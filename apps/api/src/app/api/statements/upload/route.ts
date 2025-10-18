/**
 * Statement Upload API Endpoint
 * POST /api/statements/upload - Upload and parse PDF statement
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { parseStatement, type BankName } from '@finmatter/cc-engine/server';
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['application/pdf'];

const UploadStatementSchema = z.object({
  cardId: z.string().uuid('Invalid card ID'),
  bankName: z.enum([
    'hdfc',
    'icici',
    'sbi',
    'axis',
    'kotak',
    'citi',
    'amex',
    'hsbc',
  ]),
  password: z
    .string()
    .optional()
    .describe('Password for password-protected PDFs'),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * Helper function to get authenticated user ID
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new FinMatterError('Unauthorized', 'AUTH_REQUIRED', 401);
  }

  const token = authHeader.split(' ')[1];
  const { data: userResponse, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  if (userError || !userResponse?.user) {
    throw new FinMatterError('Unauthorized', 'INVALID_TOKEN', 401);
  }

  return userResponse.user.id;
}

/**
 * POST /api/statements/upload
 * Upload and parse a PDF statement
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  // Apply rate limiting
  const { checkRateLimit, getClientIdentifier } = await import(
    '@/lib/rateLimit'
  );
  const identifier = await getClientIdentifier(request);
  const STATEMENT_UPLOAD_LIMIT = {
    name: 'STATEMENT_UPLOAD',
    max: 5,
    windowMs: 60 * 60 * 1000, // 5 per hour
    message: 'Too many statement uploads. Please wait before uploading more.',
  };

  const rateLimit = checkRateLimit(identifier, STATEMENT_UPLOAD_LIMIT);

  if (rateLimit.limited) {
    return createCorsResponse(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: STATEMENT_UPLOAD_LIMIT.message,
          details: {
            retryAfter: rateLimit.retryAfter,
          },
        },
      },
      {
        status: 429,
        origin: origin || undefined,
        headers: {
          'Retry-After': rateLimit.retryAfter.toString(),
        },
      },
    );
  }

  try {
    const userId = await getAuthenticatedUserId(request);

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const cardId = formData.get('cardId') as string | null;
    const bankName = formData.get('bankName') as string | null;
    const password = formData.get('password') as string | null;

    if (!file || !cardId || !bankName) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message:
              'Missing required fields: file, cardId, and bankName are required',
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Validate request data
    const validation = UploadStatementSchema.safeParse({
      cardId,
      bankName,
      password: password || undefined,
    });
    if (!validation.success) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Only PDF files are allowed',
            details: { fileType: file.type },
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size must be less than 5MB',
            details: { fileSize: file.size, maxSize: MAX_FILE_SIZE },
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Verify card belongs to user
    const { data: card, error: cardError } = await supabaseAdmin
      .from('cards')
      .select('id, user_id')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (cardError || !card) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'CARD_NOT_FOUND',
            message: 'Card not found or does not belong to you',
          },
        },
        { status: 404, origin: origin || undefined },
      );
    }

    // Upload file to Supabase Storage
    const fileName = `${userId}/${cardId}/${Date.now()}-${file.name}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('statements')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      throw new FinMatterError(
        'Failed to upload file',
        'STORAGE_UPLOAD_FAILED',
        500,
        { error: uploadError },
      );
    }

    // Create statement record with pending status
    const { data: statement, error: statementError } = await supabaseAdmin
      .from('statements')
      .insert({
        user_id: userId,
        card_id: cardId,
        file_path: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        parsing_status: 'processing',
      })
      .select()
      .single();

    if (statementError) {
      // Clean up uploaded file if statement creation fails
      await supabaseAdmin.storage.from('statements').remove([fileName]);

      console.error('Failed to create statement record:', statementError);
      throw new FinMatterError(
        'Failed to create statement record',
        'DB_INSERT_FAILED',
        500,
        { error: statementError },
      );
    }

    // Parse PDF in background (async, don't await)
    parseStatementAsync(
      statement.id,
      fileBuffer,
      validation.data.bankName,
      userId,
      cardId,
      password || undefined,
    ).catch(error => {
      console.error('Statement parsing failed:', error);
    });

    return createCorsResponse(
      {
        success: true,
        data: {
          statement: {
            id: statement.id,
            fileName: file.name,
            fileSize: file.size,
            status: 'processing',
            uploadedAt: statement.uploaded_at,
          },
          message: 'Statement uploaded successfully. Parsing in progress.',
        },
      },
      { status: 202, origin: origin || undefined },
    );
  } catch (error) {
    if (error instanceof FinMatterError) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode, origin: origin || undefined },
      );
    }

    console.error('Statement upload error:', error);
    return createCorsResponse(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500, origin: origin || undefined },
    );
  }
}

/**
 * Parse statement asynchronously and update database
 */
async function parseStatementAsync(
  statementId: string,
  fileBuffer: Buffer,
  bankName: BankName,
  userId: string,
  cardId: string,
  password?: string,
) {
  try {
    // Parse the PDF
    const result = await parseStatement(fileBuffer, bankName, password);

    if (!result.success) {
      // Delete the statement record and file since parsing failed
      console.log(
        `Statement ${statementId} parsing failed, deleting record and file`,
      );

      // Get the file path before deleting the record
      const { data: statementData } = await supabaseAdmin
        .from('statements')
        .select('file_path')
        .eq('id', statementId)
        .single();

      // Delete the statement record
      await supabaseAdmin.from('statements').delete().eq('id', statementId);

      // Delete the uploaded file from storage
      if (statementData?.file_path) {
        await supabaseAdmin.storage
          .from('statements')
          .remove([statementData.file_path]);
      }

      return;
    }

    // Validate mandatory fields after parsing
    const validationErrors: string[] = [];
    const mandatoryFields = [
      { field: 'cardLastFourDigits', name: 'Card Number' },
      { field: 'statementDate', name: 'Statement Date' },
      { field: 'totalDue', name: 'Total Amount Due' },
      { field: 'minimumPayment', name: 'Minimum Payment' },
      { field: 'creditLimit', name: 'Credit Limit' },
      { field: 'availableCredit', name: 'Available Credit' },
    ];

    for (const { field, name } of mandatoryFields) {
      if (!result.metadata[field as keyof typeof result.metadata]) {
        validationErrors.push(`Missing mandatory field: ${name}`);
      }
    }

    // Mathematical validation checks
    const validationWarnings: string[] = [];

    // Reward Points Equation: opening + earned - redeemed - expired = closing
    if (result.metadata.rewardPoints) {
      const { opening, earned, redeemed, expired, closing } =
        result.metadata.rewardPoints;
      if (
        opening !== undefined &&
        earned !== undefined &&
        redeemed !== undefined &&
        expired !== undefined &&
        closing !== undefined
      ) {
        const calculatedClosing = opening + earned - redeemed - expired;
        if (Math.abs(calculatedClosing - closing) > 1) {
          // Allow 1 point difference for rounding
          validationWarnings.push(
            `Reward points equation mismatch: ${opening} + ${earned} - ${redeemed} - ${expired} = ${calculatedClosing}, but closing shows ${closing}`,
          );
        }
      }
    }

    // Statement Balance Equation: previousBalance + purchases - payments = currentBalance
    if (
      result.metadata.previousBalance !== undefined &&
      result.metadata.purchasesCharges !== undefined &&
      result.metadata.paymentsCredits !== undefined &&
      result.metadata.totalDue !== undefined
    ) {
      const calculatedBalance =
        result.metadata.previousBalance +
        result.metadata.purchasesCharges -
        result.metadata.paymentsCredits;
      if (Math.abs(calculatedBalance - result.metadata.totalDue) > 0.01) {
        // Allow 1 paisa difference
        validationWarnings.push(
          `Statement balance equation mismatch: ${result.metadata.previousBalance} + ${result.metadata.purchasesCharges} - ${result.metadata.paymentsCredits} = ${calculatedBalance}, but total due shows ${result.metadata.totalDue}`,
        );
      }
    }

    // Credit Limit Equation: creditLimit - availableCredit = usedCredit
    if (
      result.metadata.creditLimit !== undefined &&
      result.metadata.availableCredit !== undefined
    ) {
      const usedCredit =
        result.metadata.creditLimit - result.metadata.availableCredit;
      if (usedCredit < 0) {
        validationWarnings.push(
          `Credit limit validation failed: used credit (${usedCredit}) cannot be negative`,
        );
      }
    }

    // Spending Categories: sum of category percentages = 100%
    if (result.metadata.spendsOverview?.categoryWiseSpends) {
      const totalPercentage = Object.values(
        result.metadata.spendsOverview.categoryWiseSpends,
      ).reduce((sum, category) => sum + (category.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 1) {
        // Allow 1% difference
        validationWarnings.push(
          `Category spending percentages sum to ${totalPercentage}%, should be 100%`,
        );
      }
    }

    // Transaction count validation
    if (
      result.metadata.spendsOverview?.numberOfTransactions !== undefined &&
      result.metadata.spendsOverview.numberOfTransactions !==
        result.transactions.length
    ) {
      validationWarnings.push(
        `Transaction count mismatch: metadata shows ${result.metadata.spendsOverview.numberOfTransactions}, but parsed ${result.transactions.length} transactions`,
      );
    }

    // Log validation results
    if (validationWarnings.length > 0) {
      console.warn(
        `Statement ${statementId} validation warnings:`,
        validationWarnings,
      );
    }

    // If critical fields are missing, delete the statement
    if (validationErrors.length > 0) {
      console.warn(
        `Statement ${statementId} missing mandatory fields, deleting:`,
        validationErrors,
      );

      // Get the file path before deleting the record
      const { data: statementData } = await supabaseAdmin
        .from('statements')
        .select('file_path')
        .eq('id', statementId)
        .single();

      // Delete the statement record
      await supabaseAdmin.from('statements').delete().eq('id', statementId);

      // Delete the uploaded file from storage
      if (statementData?.file_path) {
        await supabaseAdmin.storage
          .from('statements')
          .remove([statementData.file_path]);
      }

      return;
    }

    // Prepare enhanced metadata
    const updateData: any = {
      parsing_status: 'success',
      transaction_count: result.transactions.length,
      parsed_at: new Date().toISOString(),

      // Store validation warnings for review
      validation_warnings:
        validationWarnings.length > 0 ? validationWarnings.join('; ') : null,

      // Basic fields
      statement_date: result.metadata.statementDate,
      statement_period_start: result.metadata.statementPeriodStart,
      statement_period_end: result.metadata.statementPeriodEnd,
      due_date: result.metadata.dueDate,
      minimum_payment: result.metadata.minimumPayment,
      total_amount_due: result.metadata.totalDue,
      credit_limit: result.metadata.creditLimit,
      available_credit: result.metadata.availableCredit,

      // Billing cycle information
      billing_day: result.metadata.billingDay,
      statement_day: result.metadata.statementDay,

      // Statement summary
      previous_balance: result.metadata.previousBalance,
      purchases_charges: result.metadata.purchasesCharges,
      cash_advances: result.metadata.cashAdvances,
      payments_credits: result.metadata.paymentsCredits,

      // Enhanced fields
      cash_advance_limit: result.metadata.cashAdvanceLimit,
      late_payment_fee: result.metadata.latePaymentFee,
      interest_charges: result.metadata.interestCharges,
    };

    // Reward points
    if (result.metadata.rewardPoints) {
      updateData.reward_points_opening = result.metadata.rewardPoints.opening;
      updateData.reward_points_earned = result.metadata.rewardPoints.earned;
      updateData.reward_points_redeemed = result.metadata.rewardPoints.redeemed;
      updateData.reward_points_expired = result.metadata.rewardPoints.expired;
      updateData.reward_points_closing = result.metadata.rewardPoints.closing;

      if (result.metadata.rewardPoints.earnedByCategory) {
        updateData.reward_points_by_category =
          result.metadata.rewardPoints.earnedByCategory;
      }
    }

    // Spends overview
    if (result.metadata.spendsOverview) {
      updateData.total_spends = result.metadata.spendsOverview.totalSpends;
      updateData.domestic_spends =
        result.metadata.spendsOverview.domesticSpends;
      updateData.international_spends =
        result.metadata.spendsOverview.internationalSpends;
      updateData.atm_withdrawals =
        result.metadata.spendsOverview.atmWithdrawals;
      updateData.number_of_transactions =
        result.metadata.spendsOverview.numberOfTransactions;

      if (result.metadata.spendsOverview.categoryWiseSpends) {
        updateData.category_wise_spends =
          result.metadata.spendsOverview.categoryWiseSpends;
      }
    }

    // EMI summary
    if (result.metadata.emiSummary) {
      updateData.emi_count = result.metadata.emiSummary.emiCount;
      updateData.total_emi_amount = result.metadata.emiSummary.totalEMIAmount;
    }

    // Update statement metadata
    await supabaseAdmin
      .from('statements')
      .update(updateData)
      .eq('id', statementId);

    // Insert transactions with enhanced metadata
    const transactions = result.transactions.map(t => ({
      user_id: userId,
      card_id: cardId,
      statement_id: statementId,
      transaction_date: t.date,
      merchant_name: t.merchantName,
      amount: t.amount,
      transaction_type: t.type,
      raw_text: t.rawText,
      category: t.category || 'others',
      source: 'pdf' as const,
      status: 'completed' as const,

      // Enhanced fields
      location: t.location,
      reward_points: t.rewardPoints,
      reference_number: t.referenceNumber,
      is_emi: t.isEMI || false,
      gst_amount: t.gstAmount,
      emi_details: t.emiDetails ? t.emiDetails : null,
    }));

    if (transactions.length > 0) {
      const { error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert(transactions);

      if (transactionError) {
        console.error('Failed to insert transactions:', transactionError);
        // Mark as failed if transactions couldn't be inserted
        await supabaseAdmin
          .from('statements')
          .update({
            parsing_status: 'failed',
            parsing_error: 'Failed to insert transactions',
          })
          .eq('id', statementId);
      }
    }

    // Insert EMI loans if present
    if (
      result.metadata.emiSummary &&
      result.metadata.emiSummary.loans.length > 0
    ) {
      const emiLoans = result.metadata.emiSummary.loans.map(loan => ({
        statement_id: statementId,
        user_id: userId,
        card_id: cardId,
        loan_number: loan.loanNumber,
        principal_amount: loan.principalAmount,
        emi_amount: loan.emiAmount,
        remaining_tenure: loan.remainingTenure,
        interest_rate: loan.interestRate,
      }));

      const { error: emiError } = await supabaseAdmin
        .from('statement_emi_loans')
        .insert(emiLoans);

      if (emiError) {
        console.error('Failed to insert EMI loans:', emiError);
        // Continue anyway - this is not critical
      }
    }
  } catch (error) {
    console.error('Parse statement async error:', error);
    await supabaseAdmin
      .from('statements')
      .update({
        parsing_status: 'failed',
        parsing_error: error instanceof Error ? error.message : 'Unknown error',
        parsed_at: new Date().toISOString(),
      })
      .eq('id', statementId);
  }
}

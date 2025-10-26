/**
 * Retry Statement Parsing API Endpoint
 * POST /api/statements/[id]/retry - Retry parsing a failed statement with new password
 */

import { NextRequest } from 'next/server';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@/lib/errors';
import { parseStatement } from '@finmatter/cc-engine/server';
import { z } from 'zod';

// Force Node.js runtime for PDF parsing with extended timeout
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout for parsing

const RetrySchema = z.object({
  password: z.string().optional(),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * POST /api/statements/[id]/retry
 * Retry parsing a failed statement with a new password
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');
  const statementId = params.id;

  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new FinMatterError('Unauthorized', 'AUTH_REQUIRED', 401);
    }

    const token = authHeader.split(' ')[1];
    const { data: userResponse, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userResponse?.user) {
      throw new FinMatterError('Unauthorized', 'INVALID_TOKEN', 401);
    }

    const userId = userResponse.user.id;

    // Get the statement record
    const { data: statement, error: statementError } = (await supabaseAdmin
      .from('statements')
      .select(
        `
        *,
        card:cards(*)
      `,
      )
      .eq('id', statementId)
      .eq('user_id', userId)
      .single()) as { data: any; error: any };

    if (statementError || !statement) {
      throw new FinMatterError(
        'Statement not found',
        'STATEMENT_NOT_FOUND',
        404,
      );
    }

    // Check if statement is in a retryable state
    if (statement.parsing_status !== 'failed') {
      throw new FinMatterError(
        'Statement is not in a failed state',
        'INVALID_STATE',
        400,
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = RetrySchema.safeParse(body);
    if (!validation.success) {
      throw new FinMatterError(
        'Invalid request data',
        'VALIDATION_ERROR',
        400,
        { details: validation.error.errors },
      );
    }

    // Get the PDF file from storage
    const { data: fileData, error: fileError } = await supabaseAdmin.storage
      .from('statements')
      .download(statement.file_path);

    if (fileError || !fileData) {
      throw new FinMatterError(
        'Statement file not found',
        'FILE_NOT_FOUND',
        404,
      );
    }

    // Convert file to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Update status to processing
    await (supabaseAdmin as any)
      .from('statements')
      .update({
        parsing_status: 'processing',
        parsing_error: null,
        parsing_error_details: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', statementId);

    // Parse the PDF with new password
    const result = await parseStatement(
      fileBuffer,
      statement.card.bank_name as any,
      validation.data.password,
    );

    if (!result.success) {
      // Handle parsing failure
      const primaryError = result.errors[0] || 'Unknown parsing error';

      await (supabaseAdmin as any)
        .from('statements')
        .update({
          parsing_status: 'failed',
          parsing_error: primaryError,
          parsing_error_details: JSON.stringify({
            errorType: 'retry_failed',
            errors: result.errors,
            warnings: result.warnings,
            retryCount: (statement.retry_count || 0) + 1,
            suggestions: [
              'Double-check the password',
              'Try different password formats',
              'Contact your bank for the correct password',
              'Ensure the PDF is not corrupted',
            ],
          }),
          retry_count: (statement.retry_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', statementId);

      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'PARSING_FAILED',
            message: primaryError,
            details: {
              errors: result.errors,
              warnings: result.warnings,
              retryCount: (statement.retry_count || 0) + 1,
            },
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Success - update statement with parsed data
    await (supabaseAdmin as any)
      .from('statements')
      .update({
        parsing_status: 'success',
        parsing_error: null,
        parsing_error_details: null,
        transaction_count: result.transactions.length,
        parsed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        // Statement dates
        statement_date: result.metadata.statementDate,
        statement_period_start: result.metadata.statementPeriodStart,
        statement_period_end: result.metadata.statementPeriodEnd,

        // Financial metadata
        due_date: result.metadata.dueDate,
        minimum_payment: result.metadata.minimumPayment,
        total_amount_due: result.metadata.totalDue,
        credit_limit: result.metadata.creditLimit,
        available_credit: result.metadata.availableCredit,
        billing_day: result.metadata.billingDay,
        statement_day: result.metadata.statementDay,

        // Previous balance info
        previous_balance: result.metadata.previousBalance,
        purchases_charges: result.metadata.purchasesCharges,
        cash_advances: result.metadata.cashAdvances,
        payments_credits: result.metadata.paymentsCredits,

        // Fees and charges
        late_payment_fee: result.metadata.latePaymentFee,
        interest_charges: result.metadata.interestCharges,
        cash_advance_limit: result.metadata.cashAdvanceLimit,

        // Reward points
        reward_points_opening: result.metadata.rewardPoints?.opening || 0,
        reward_points_earned: result.metadata.rewardPoints?.earned || 0,
        reward_points_redeemed: result.metadata.rewardPoints?.redeemed || 0,
        reward_points_expired: result.metadata.rewardPoints?.expired || 0,
        reward_points_closing: result.metadata.rewardPoints?.closing || 0,

        // EMI info
        emi_count: result.metadata.emiSummary?.emiCount || 0,
        total_emi_amount: result.metadata.emiSummary?.totalEMIAmount || 0,

        // Spending overview
        total_spends: result.metadata.spendsOverview?.totalSpends || 0,
        domestic_spends: result.metadata.spendsOverview?.domesticSpends || 0,
        international_spends:
          result.metadata.spendsOverview?.internationalSpends || 0,
        atm_withdrawals: result.metadata.spendsOverview?.atmWithdrawals || 0,
        number_of_transactions:
          result.metadata.spendsOverview?.numberOfTransactions ||
          result.transactions.length,

        // JSON data
        category_wise_spends: result.metadata.spendsOverview?.categoryWiseSpends
          ? JSON.stringify(result.metadata.spendsOverview.categoryWiseSpends)
          : null,
        reward_points_by_category: result.metadata.rewardPoints
          ?.earnedByCategory
          ? JSON.stringify(result.metadata.rewardPoints.earnedByCategory)
          : null,

        validation_warnings:
          result.warnings && result.warnings.length > 0
            ? result.warnings.join('; ')
            : null,
      })
      .eq('id', statementId);

    // Import categorization engine
    const { categorizeTransaction } = await import('@finmatter/cc-engine');

    // Delete existing transactions for this statement to avoid duplicates
    await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('statement_id', statementId)
      .eq('user_id', userId);

    // Insert transactions
    if (result.transactions.length > 0) {
      const transactions = result.transactions.map(transaction => {
        // Auto-categorize transaction if not already categorized
        const categorization =
          !transaction.category || transaction.category === 'others'
            ? categorizeTransaction(transaction.merchantName, { userId })
            : null;

        return {
          statement_id: statementId,
          user_id: userId,
          card_id: statement.card_id,
          transaction_date: transaction.date,
          merchant_name: transaction.merchantName,
          amount: transaction.amount,
          transaction_type: transaction.type,
          raw_text: transaction.rawText,
          category:
            transaction.category || categorization?.category || 'others',
          subcategory: categorization?.subcategory,
          source: 'pdf' as const,
          status: 'completed' as const,

          // Enhanced fields
          location: transaction.location,
          reward_points: transaction.rewardPoints,
          reference_number: transaction.referenceNumber,
          is_emi: transaction.isEMI || false,
          gst_amount: transaction.gstAmount,
          emi_details: transaction.emiDetails ? transaction.emiDetails : null,
        };
      });

      await supabaseAdmin.from('transactions').insert(transactions);

      // Delete and re-insert EMI loans to avoid duplicates
      await supabaseAdmin
        .from('statement_emi_loans')
        .delete()
        .eq('statement_id', statementId)
        .eq('user_id', userId);

      // Insert EMI loans if present
      if (
        result.metadata.emiSummary &&
        result.metadata.emiSummary.loans.length > 0
      ) {
        const emiLoans = result.metadata.emiSummary.loans.map(loan => ({
          statement_id: statementId,
          user_id: userId,
          card_id: statement.card_id,
          loan_number: loan.loanNumber,
          principal_amount: loan.principalAmount,
          emi_amount: loan.emiAmount,
          remaining_tenure: loan.remainingTenure,
          interest_rate: loan.interestRate,
        }));

        await supabaseAdmin.from('statement_emi_loans').insert(emiLoans);
      }
    }

    // Update card with latest credit limit and available credit from statement
    if (result.metadata.creditLimit) {
      const cardUpdateData: any = {
        credit_limit: result.metadata.creditLimit,
        billing_day: result.metadata.billingDay,
        updated_at: new Date().toISOString(),
      };

      // Calculate or use parsed available credit
      if (
        result.metadata.availableCredit !== undefined &&
        result.metadata.availableCredit !== null
      ) {
        // Use parsed available credit if it exists
        cardUpdateData.available_credit = result.metadata.availableCredit;
      } else {
        // If available credit wasn't parsed, try to estimate from spending
        // Calculate from transactions: sum of all debit amounts
        const totalSpent = result.transactions
          .filter(t => t.type === 'debit' || t.amount > 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        if (totalSpent > 0) {
          const estimatedAvailable = result.metadata.creditLimit - totalSpent;
          cardUpdateData.available_credit = Math.max(0, estimatedAvailable);
        }
      }

      await supabaseAdmin
        .from('cards')
        .update(cardUpdateData)
        .eq('id', statement.card_id)
        .eq('user_id', userId);
    }

    return createCorsResponse(
      {
        success: true,
        data: {
          message: 'Statement parsed successfully',
          transactionCount: result.transactions.length,
          metadata: result.metadata,
        },
      },
      { status: 200, origin: origin || undefined },
    );
  } catch (error: any) {
    console.error('Retry statement error:', error);

    if (error instanceof FinMatterError) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: error.status, origin: origin || undefined },
      );
    }

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

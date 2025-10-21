/**
 * Retry Statement Parsing API Endpoint
 * POST /api/statements/[id]/retry - Retry parsing a failed statement with new password
 */

import { NextRequest } from 'next/server';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { supabaseAdmin } from '@/lib/supabase';
import { FinMatterError } from '@/lib/errors';
import { parseStatement } from '@finmatter/cc-engine/server';
import { z } from 'zod';

// Force Node.js runtime for PDF parsing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
        // Add other parsed fields here
        statement_date: result.metadata.statementDate?.toISOString(),
        due_date: result.metadata.dueDate?.toISOString(),
        minimum_payment: result.metadata.minimumPayment,
        total_amount_due: result.metadata.totalDue,
        credit_limit: result.metadata.creditLimit,
        available_credit: result.metadata.availableCredit,
        reward_points_opening: result.metadata.rewardPoints?.opening || 0,
        reward_points_earned: result.metadata.rewardPoints?.earned || 0,
        reward_points_redeemed: result.metadata.rewardPoints?.redeemed || 0,
        reward_points_expired: result.metadata.rewardPoints?.expired || 0,
        reward_points_closing: result.metadata.rewardPoints?.closing || 0,
      })
      .eq('id', statementId);

    // Insert transactions
    if (result.transactions.length > 0) {
      const transactions = result.transactions.map(transaction => ({
        statement_id: statementId,
        user_id: userId,
        card_id: statement.card_id,
        date: transaction.date?.toISOString(),
        description: transaction.merchantName,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        location: transaction.location,
        reference_number: transaction.referenceNumber,
        is_emi: transaction.isEMI || false,
        emi_amount: transaction.emiDetails?.principalAmount || 0,
        gst_amount: transaction.gstAmount,
        reward_points: transaction.rewardPoints,
        created_at: new Date().toISOString(),
      }));

      await supabaseAdmin.from('transactions').insert(transactions as any);
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

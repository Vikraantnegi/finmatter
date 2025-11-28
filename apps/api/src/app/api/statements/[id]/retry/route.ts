/**
 * Statement Retry API Endpoint
 * POST /api/statements/:id/retry - Retry parsing a failed statement
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { AppError, logError } from '@/lib/errorHandler';
import {
  parseStatement,
  type BankName,
  type ParsedTransaction,
} from '@finmatter/cc-engine';

/**
 * Get authenticated user ID from request
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new AppError('INVALID_TOKEN', 'Invalid or expired token', 401);
  }

  return user.id;
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * POST /api/statements/:id/retry
 * Retry parsing a failed statement
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const statementId = params.id;

    // Get statement details
    const { data: statement, error: fetchError } = await supabaseAdmin
      .from('statements')
      .select('*')
      .eq('id', statementId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !statement) {
      throw new AppError(
        'STATEMENT_NOT_FOUND',
        'Statement not found or access denied',
        404,
      );
    }

    // Only allow retry for failed statements
    if (statement.parsing_status !== 'failed') {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot retry statement with status: ${statement.parsing_status}. Only failed statements can be retried.`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Get password from request body (optional - user might want to try different password)
    const body = await request.json().catch(() => ({}));
    const password = body.password || null;

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('statements')
      .download(statement.file_path);

    if (downloadError || !fileData) {
      throw new AppError(
        'FILE_NOT_FOUND',
        'Failed to download statement file from storage',
        404,
      );
    }

    // Convert blob to buffer
    const fileBuffer = Buffer.from(await fileData.arrayBuffer());

    // Update status to processing
    await supabaseAdmin
      .from('statements')
      .update({
        parsing_status: 'processing',
        parsing_error: null,
      })
      .eq('id', statementId);

    // Start parsing asynchronously
    parseStatementAsync(
      statementId,
      userId,
      statement.card_id,
      fileBuffer,
      statement.bank_name as BankName,
      password || undefined,
    ).catch((error: unknown) => {
      const errorToLog =
        error instanceof Error ? error : new Error(String(error));
      logError(errorToLog, {
        userId,
        additionalData: {
          cardId: statement.card_id,
          statementId,
          error: errorToLog.message,
        },
      });
    });

    return createCorsResponse(
      {
        success: true,
        data: {
          message: 'Retry initiated. Parsing in progress...',
        },
      },
      { origin: origin || undefined },
    );
  } catch (error) {
    if (error instanceof AppError) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: error.statusCode, origin: origin || undefined },
      );
    }

    return createCorsResponse(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500, origin: origin || undefined },
    );
  }
}

/**
 * Parse statement asynchronously in the background (same as upload route)
 */
async function parseStatementAsync(
  statementId: string,
  userId: string,
  cardId: string,
  fileBuffer: Buffer,
  bankName: BankName,
  password?: string,
): Promise<void> {
  try {
    // Parse the PDF
    const parseResult = await parseStatement(fileBuffer, bankName, password);

    // Delete existing transactions for this statement (in case of retry)
    await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('statement_id', statementId);

    // Insert transactions if parsing was successful
    if (parseResult.success && parseResult.transactions.length > 0) {
      const transactionsToInsert = parseResult.transactions.map(
        (txn: ParsedTransaction) => ({
          user_id: userId,
          card_id: cardId,
          statement_id: statementId,
          transaction_date: txn.transactionDate.toISOString().split('T')[0],
          posting_date: txn.postingDate
            ? txn.postingDate.toISOString().split('T')[0]
            : null,
          merchant_name: txn.merchantName,
          merchant_category: txn.merchantCategory || null,
          amount: Math.abs(txn.amount),
          type: txn.type,
          currency: txn.currency || 'INR',
          description: txn.description || null,
          raw_text: txn.rawText,
          category: null,
        }),
      );

      const { error: transactionsError } = await supabaseAdmin
        .from('transactions')
        .insert(transactionsToInsert);

      if (transactionsError) {
        logError(new Error(transactionsError.message), {
          userId,
          additionalData: {
            cardId,
            statementId,
            transactionCount: transactionsToInsert.length,
            error: transactionsError.message,
          },
        });

        await supabaseAdmin
          .from('statements')
          .update({
            parsing_status: 'failed',
            parsing_error: `Failed to insert transactions: ${transactionsError.message}`,
            parsed_at: new Date().toISOString(),
          })
          .eq('id', statementId);

        return;
      }
    }

    // Update statement with success and metadata
    const updateData: any = {
      parsing_status: parseResult.success ? 'success' : 'failed',
      parsed_at: new Date().toISOString(),
      transaction_count: parseResult.transactions.length,
    };

    if (parseResult.metadata.statementPeriodStart) {
      updateData.statement_period_start =
        parseResult.metadata.statementPeriodStart.toISOString().split('T')[0];
    }
    if (parseResult.metadata.statementPeriodEnd) {
      updateData.statement_period_end = parseResult.metadata.statementPeriodEnd
        .toISOString()
        .split('T')[0];
    }
    if (parseResult.metadata.billingCycleStart) {
      updateData.billing_cycle_start = parseResult.metadata.billingCycleStart
        .toISOString()
        .split('T')[0];
    }
    if (parseResult.metadata.billingCycleEnd) {
      updateData.billing_cycle_end = parseResult.metadata.billingCycleEnd
        .toISOString()
        .split('T')[0];
    }

    if (!parseResult.success && parseResult.errors) {
      updateData.parsing_error = parseResult.errors.join('; ');
    }

    await supabaseAdmin
      .from('statements')
      .update(updateData)
      .eq('id', statementId);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown parsing error';

    await supabaseAdmin
      .from('statements')
      .update({
        parsing_status: 'failed',
        parsing_error: errorMessage,
        parsed_at: new Date().toISOString(),
      })
      .eq('id', statementId);

    const errorToLog = error instanceof Error ? error : new Error(errorMessage);
    logError(errorToLog, {
      userId,
      additionalData: { cardId, statementId, error: errorMessage },
    });
  }
}

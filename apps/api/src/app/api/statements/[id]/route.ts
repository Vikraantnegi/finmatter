/**
 * Statement Detail API Endpoint
 * GET /api/statements/:id - Get single statement with transactions
 * DELETE /api/statements/:id - Delete statement
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';

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
 * GET /api/statements/:id
 * Get single statement with its transactions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const statementId = params.id;

    // Fetch statement with card info and all rich metadata
    const { data: statement, error: statementError } = await supabaseAdmin
      .from('statements')
      .select(
        `
        *,
        card:cards (
          id,
          bank_name,
          card_name,
          last_four_digits,
          network
        )
      `,
      )
      .eq('id', statementId)
      .eq('user_id', userId)
      .single();

    if (statementError || !statement) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'STATEMENT_NOT_FOUND',
            message: 'Statement not found',
          },
        },
        { status: 404, origin: origin || undefined },
      );
    }

    // Fetch transactions for this statement
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('statement_id', statementId)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (transactionsError) {
      console.error('Failed to fetch transactions:', transactionsError);
    }

    // Fetch EMI loans for this statement
    const { data: emiLoans, error: emiLoansError } = await supabaseAdmin
      .from('statement_emi_loans')
      .select('*')
      .eq('statement_id', statementId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (emiLoansError) {
      console.error('Failed to fetch EMI loans:', emiLoansError);
    }

    return createCorsResponse(
      {
        success: true,
        data: {
          statement: {
            ...statement,
            transactions: transactions || [],
            emiLoans: emiLoans || [],
          },
        },
      },
      { origin: origin || undefined },
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

    console.error('Get statement error:', error);
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
 * DELETE /api/statements/:id
 * Delete statement and its transactions
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const statementId = params.id;

    // Fetch statement to get file path
    const { data: statement, error: fetchError } = await supabaseAdmin
      .from('statements')
      .select('file_path, user_id')
      .eq('id', statementId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !statement) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'STATEMENT_NOT_FOUND',
            message: 'Statement not found',
          },
        },
        { status: 404, origin: origin || undefined },
      );
    }

    // Delete transactions (will cascade)
    await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('statement_id', statementId)
      .eq('user_id', userId);

    // Delete statement record
    const { error: deleteError } = await supabaseAdmin
      .from('statements')
      .delete()
      .eq('id', statementId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Failed to delete statement:', deleteError);
      throw new FinMatterError(
        'Failed to delete statement',
        'DB_DELETE_FAILED',
        500,
        { error: deleteError },
      );
    }

    // Delete file from storage
    if (statement.file_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('statements')
        .remove([statement.file_path]);

      if (storageError) {
        console.error('Failed to delete file from storage:', storageError);
        // Don't fail the request if storage deletion fails
      }
    }

    return createCorsResponse(
      {
        success: true,
        message: 'Statement deleted successfully',
      },
      { origin: origin || undefined },
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

    console.error('Delete statement error:', error);
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

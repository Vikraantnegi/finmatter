/**
 * Statement Transactions API Endpoint
 * GET /api/statements/:id/transactions - Get transactions for a statement
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { AppError } from '@/lib/errorHandler';

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
 * GET /api/statements/:id/transactions
 * Get transactions for a specific statement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const statementId = params.id;

    // Verify statement ownership
    const { data: statement, error: statementError } = await supabaseAdmin
      .from('statements')
      .select('id, user_id')
      .eq('id', statementId)
      .eq('user_id', userId)
      .single();

    if (statementError || !statement) {
      throw new AppError(
        'STATEMENT_NOT_FOUND',
        'Statement not found or access denied',
        404,
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch transactions
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('statement_id', statementId)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError(
        'DATABASE_ERROR',
        'Failed to fetch transactions',
        500,
        true,
        { error: error.message },
      );
    }

    // Get total count
    const { count } = await supabaseAdmin
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('statement_id', statementId)
      .eq('user_id', userId);

    return createCorsResponse(
      {
        success: true,
        data: {
          transactions: transactions || [],
          pagination: {
            total: count || 0,
            limit,
            offset,
            hasMore: (count || 0) > offset + limit,
          },
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

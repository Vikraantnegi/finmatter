/**
 * Transactions API Endpoint
 * GET /api/transactions - List user's transactions with filters
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
 * GET /api/transactions
 * List user's transactions with optional filters
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('card_id');
    const category = searchParams.get('category');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const type = searchParams.get('type') as
      | 'debit'
      | 'credit'
      | 'refund'
      | null;
    const merchant = searchParams.get('merchant');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabaseAdmin
      .from('transactions')
      .select(
        `
        *,
        cards (
          id,
          last_four_digits,
          card_name,
          bank_name
        ),
        statements (
          id,
          file_name,
          upload_date
        )
      `,
      )
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (cardId) {
      query = query.eq('card_id', cardId);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (merchant) {
      query = query.ilike('merchant_name', `%${merchant}%`);
    }

    const { data: transactions, error } = await query;

    if (error) {
      throw new AppError(
        'DATABASE_ERROR',
        'Failed to fetch transactions',
        500,
        true,
        { error: error.message },
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (cardId) {
      countQuery = countQuery.eq('card_id', cardId);
    }

    if (category) {
      countQuery = countQuery.eq('category', category);
    }

    if (startDate) {
      countQuery = countQuery.gte('transaction_date', startDate);
    }

    if (endDate) {
      countQuery = countQuery.lte('transaction_date', endDate);
    }

    if (type) {
      countQuery = countQuery.eq('type', type);
    }

    if (merchant) {
      countQuery = countQuery.ilike('merchant_name', `%${merchant}%`);
    }

    const { count } = await countQuery;

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
            details: error.details,
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

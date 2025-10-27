/**
 * Monthly Spending Analytics API Endpoint
 * GET /api/analytics/monthly-spending - Get monthly spending by category
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { z } from 'zod';

const GetMonthlySpendingSchema = z.object({
  cardId: z.string().uuid().optional(),
  year: z.number().min(2020).max(2030).optional(),
  month: z.number().min(1).max(12).optional(),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
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
 * GET /api/analytics/monthly-spending
 * Get monthly spending by category
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = {
      cardId: url.searchParams.get('cardId') || undefined,
      year: url.searchParams.get('year')
        ? parseInt(url.searchParams.get('year')!)
        : undefined,
      month: url.searchParams.get('month')
        ? parseInt(url.searchParams.get('month')!)
        : undefined,
      limit: parseInt(url.searchParams.get('limit') || '20'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    // Validate query parameters
    const validation = GetMonthlySpendingSchema.safeParse(queryParams);
    if (!validation.success) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validation.error.errors,
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    const { cardId, year, month, limit, offset } = validation.data;

    // Build query using the monthly_spending_by_category view
    let query = supabaseAdmin
      .from('monthly_spending_by_category')
      .select('*')
      .eq('user_id', userId)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (cardId) query = query.eq('card_id', cardId);
    if (year) query = query.eq('EXTRACT(year FROM month)', year);
    if (month) query = query.eq('EXTRACT(month FROM month)', month);

    const { data: monthlySpending, error } = await query;

    if (error) {
      console.error('Failed to fetch monthly spending:', error);
      throw new FinMatterError(
        'Failed to fetch monthly spending data',
        'DB_QUERY_FAILED',
        500,
        { error },
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('monthly_spending_by_category')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (cardId) countQuery = countQuery.eq('card_id', cardId);
    if (year) countQuery = countQuery.eq('EXTRACT(year FROM month)', year);
    if (month) countQuery = countQuery.eq('EXTRACT(month FROM month)', month);

    const { count } = await countQuery;

    return createCorsResponse(
      {
        success: true,
        data: {
          monthlySpending: monthlySpending || [],
          pagination: {
            limit,
            offset,
            total: count || 0,
            hasMore: (count || 0) > offset + limit,
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

    console.error('Get monthly spending error:', error);
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

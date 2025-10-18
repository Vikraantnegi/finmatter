/**
 * Card Usage Stats API Endpoint
 * GET /api/analytics/card-usage-stats - Get card usage statistics
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { z } from 'zod';

const GetCardUsageStatsSchema = z.object({
  cardId: z.string().uuid().optional(),
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
 * GET /api/analytics/card-usage-stats
 * Get card usage statistics
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = {
      cardId: url.searchParams.get('cardId') || undefined,
      limit: parseInt(url.searchParams.get('limit') || '20'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    // Validate query parameters
    const validation = GetCardUsageStatsSchema.safeParse(queryParams);
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

    const { cardId, limit, offset } = validation.data;

    // Build query using the card_usage_stats view
    let query = supabaseAdmin
      .from('card_usage_stats')
      .select('*')
      .eq('user_id', userId)
      .range(offset, offset + limit - 1);

    // Apply filters
    if (cardId) query = query.eq('card_id', cardId);

    const { data: usageStats, error } = await query;

    if (error) {
      console.error('Failed to fetch card usage stats:', error);
      throw new FinMatterError(
        'Failed to fetch card usage statistics',
        'DB_QUERY_FAILED',
        500,
        { error },
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('card_usage_stats')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (cardId) countQuery = countQuery.eq('card_id', cardId);

    const { count } = await countQuery;

    return createCorsResponse(
      {
        success: true,
        data: {
          usageStats: usageStats || [],
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

    console.error('Get card usage stats error:', error);
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

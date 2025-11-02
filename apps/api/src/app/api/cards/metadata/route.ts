import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { FinMatterError } from '@finmatter/shared';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * GET /api/cards/metadata
 *
 * Browse all available card metadata
 *
 * Query params:
 * - bank: Filter by bank name
 * - search: Search by card name
 * - network: Filter by network (visa, mastercard, etc.)
 * - rewardType: Filter by reward type (cashback, points, etc.)
 * - minIncome: Filter by minimum income requirement
 * - maxAnnualFee: Filter by maximum annual fee
 * - limit: Limit results (default: 50)
 * - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const url = new URL(request.url);
    const bank = url.searchParams.get('bank');
    const search = url.searchParams.get('search');
    const network = url.searchParams.get('network');
    const rewardType = url.searchParams.get('rewardType');
    const minIncome = url.searchParams.get('minIncome');
    const maxAnnualFee = url.searchParams.get('maxAnnualFee');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query
    let query = supabaseAdmin
      .from('cards_metadata')
      .select('*')
      .eq('is_active', true)
      .order('card_name', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (bank) {
      query = query.eq('bank_name', bank);
    }

    if (network) {
      query = query.eq('network', network.toLowerCase());
    }

    if (rewardType) {
      query = query.eq('reward_type', rewardType.toLowerCase());
    }

    if (maxAnnualFee) {
      query = query.lte('annual_fee', parseFloat(maxAnnualFee));
    }

    // Search filter (if provided)
    if (search) {
      query = query.or(
        `card_name.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }

    // Execute query
    const { data: cards, error: cardsError } = await query;

    if (cardsError) {
      throw new FinMatterError(
        'Failed to fetch card metadata',
        'DB_QUERY_FAILED',
        500,
        { error: cardsError },
      );
    }

    // Filter by minIncome if provided (using eligibility_criteria JSONB)
    let filteredCards = cards || [];
    if (minIncome) {
      const minIncomeNum = parseFloat(minIncome);
      filteredCards = filteredCards.filter(card => {
        const eligibility = (card.eligibility_criteria as any[])?.[0];
        if (!eligibility || !eligibility.minIncome) return true;
        return eligibility.minIncome <= minIncomeNum;
      });
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('cards_metadata')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    return createCorsResponse(
      {
        success: true,
        data: {
          cards: filteredCards,
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

    console.error('Card metadata API error:', error);
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

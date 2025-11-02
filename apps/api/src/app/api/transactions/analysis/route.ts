import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { FinMatterError } from '@finmatter/shared';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * GET /api/transactions/analysis
 *
 * Get spending analysis with reward optimization insights
 *
 * Query params:
 * - period: 'week' | 'month' | 'quarter' | 'year' (default: 'month')
 * - cardId: optional filter by specific card
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    // Get auth user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401, origin: origin || undefined },
      );
    }

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid authentication token',
          },
        },
        { status: 401, origin: origin || undefined },
      );
    }

    // Get query params
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'month';
    const cardId = url.searchParams.get('cardId');

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week': {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      }
      case 'month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      }
      case 'quarter': {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
        break;
      }
      case 'year': {
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      }
      default: {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    // Build query
    let query = supabaseAdmin
      .from('transactions')
      .select('*, cards(*, card_metadata_id)')
      .eq('user_id', user.id)
      .eq('transaction_type', 'debit')
      .eq('status', 'completed')
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .order('transaction_date', { ascending: false });

    if (cardId) {
      query = query.eq('card_id', cardId);
    }

    const { data: transactions, error: txError } = await query;

    if (txError) {
      throw new FinMatterError(
        'Failed to fetch transactions',
        'DB_QUERY_FAILED',
        500,
        { error: txError },
      );
    }

    if (!transactions || transactions.length === 0) {
      return createCorsResponse(
        {
          success: true,
          data: {
            period,
            summary: {
              totalAmount: 0,
              transactionCount: 0,
              averageAmount: 0,
              categoryBreakdown: [],
              cardBreakdown: [],
            },
            insights: {
              topCategory: null,
              topMerchant: null,
              spendingTrend: 'stable',
              rewardOpportunities: [],
            },
            recommendations: [],
          },
        },
        { origin: origin || undefined },
      );
    }

    // Analyze spending by category
    const categoryBreakdown: Record<string, { amount: number; count: number }> =
      {};
    const cardBreakdown: Record<
      string,
      { amount: number; count: number; cardName: string }
    > = {};

    let totalAmount = 0;

    for (const tx of transactions) {
      const amount = parseFloat(tx.amount);
      totalAmount += amount;

      // Category breakdown
      const cat = tx.category || 'others';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { amount: 0, count: 0 };
      }
      categoryBreakdown[cat].amount += amount;
      categoryBreakdown[cat].count += 1;

      // Card breakdown
      if (tx.card_id && tx.cards) {
        const cardKey = tx.card_id;
        if (!cardBreakdown[cardKey]) {
          const cards = tx.cards as any;
          cardBreakdown[cardKey] = {
            amount: 0,
            count: 0,
            cardName: cards.card_name || 'Unknown Card',
          };
        }
        cardBreakdown[cardKey].amount += amount;
        cardBreakdown[cardKey].count += 1;
      }
    }

    // Find top category and merchant
    let topCategory = null;
    let topCategoryAmount = 0;

    for (const [cat, data] of Object.entries(categoryBreakdown)) {
      if (data.amount > topCategoryAmount) {
        topCategory = cat;
        topCategoryAmount = data.amount;
      }
    }

    // Merchant analysis
    const merchantBreakdown: Record<string, { amount: number; count: number }> =
      {};

    for (const tx of transactions) {
      const merchant = tx.merchant_name;
      const amount = parseFloat(tx.amount);

      if (!merchantBreakdown[merchant]) {
        merchantBreakdown[merchant] = { amount: 0, count: 0 };
      }
      merchantBreakdown[merchant].amount += amount;
      merchantBreakdown[merchant].count += 1;
    }

    const topMerchant =
      Object.entries(merchantBreakdown).sort(
        (a, b) => b[1].amount - a[1].amount,
      )[0]?.[0] || null;

    // Generate recommendations based on spending patterns
    const recommendations = generateRecommendations(
      categoryBreakdown,
      totalAmount,
    );

    return createCorsResponse(
      {
        success: true,
        data: {
          period,
          summary: {
            totalAmount,
            transactionCount: transactions.length,
            averageAmount: totalAmount / transactions.length,
            categoryBreakdown: Object.entries(categoryBreakdown).map(
              ([category, data]) => ({
                category,
                amount: data.amount,
                count: data.count,
                percentage: (data.amount / totalAmount) * 100,
              }),
            ),
            cardBreakdown: Object.entries(cardBreakdown).map(
              ([cardId, data]) => ({
                cardId,
                cardName: data.cardName,
                amount: data.amount,
                count: data.count,
                percentage: (data.amount / totalAmount) * 100,
              }),
            ),
          },
          insights: {
            topCategory: topCategory
              ? {
                  category: topCategory,
                  amount: topCategoryAmount,
                  percentage: (topCategoryAmount / totalAmount) * 100,
                }
              : null,
            topMerchant: topMerchant
              ? {
                  merchant: topMerchant,
                  amount: merchantBreakdown[topMerchant].amount,
                }
              : null,
            spendingTrend: 'stable', // TODO: Implement trend analysis
            rewardOpportunities: recommendations,
          },
          recommendations,
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

    console.error('Transaction analysis API error:', error);
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
 * Generate spending recommendations based on patterns
 */
function generateRecommendations(
  categoryBreakdown: Record<string, { amount: number; count: number }>,
  totalAmount: number,
): any[] {
  const recommendations: any[] = [];

  // Check if user spends heavily on specific categories
  const highSpendCategories = Object.entries(categoryBreakdown)
    .filter(([_, data]) => data.amount > totalAmount * 0.3) // More than 30% of total
    .map(([category]) => category);

  for (const category of highSpendCategories) {
    recommendations.push({
      type: 'category',
      priority: 'high',
      title: `Optimize ${category} spending`,
      message: `${category} represents ${((categoryBreakdown[category].amount / totalAmount) * 100).toFixed(1)}% of your total spending. Consider a card with better ${category} rewards.`,
      action: 'explore_cards',
      category,
    });
  }

  // Check for low-spend categories that might benefit from better cards
  const lowSpendCategories = Object.entries(categoryBreakdown)
    .filter(([_, data]) => data.amount < totalAmount * 0.1 && data.count > 0)
    .map(([category]) => category);

  for (const category of lowSpendCategories) {
    recommendations.push({
      type: 'category',
      priority: 'medium',
      title: `Consider ${category} rewards`,
      message: `You have ${category} transactions that could earn better rewards with the right card.`,
      action: 'explore_cards',
      category,
    });
  }

  return recommendations;
}

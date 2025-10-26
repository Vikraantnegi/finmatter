/**
 * Transaction Statistics API Endpoint
 * GET /api/transactions/stats - Get transaction statistics and analytics
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { z } from 'zod';

const StatsQuerySchema = z.object({
  // Time period
  period: z
    .enum(['week', 'month', 'quarter', 'year', 'custom'])
    .default('month'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),

  // Filters
  cardId: z.string().uuid().optional(),
  category: z.string().optional(),

  // Grouping
  groupBy: z
    .enum(['category', 'card', 'month', 'week', 'day'])
    .default('category'),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * Get authenticated user ID from request
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new FinMatterError(
      'Missing or invalid authorization header',
      'AUTHENTICATION_ERROR',
      401,
    );
  }

  const token = authHeader.substring(7);
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new FinMatterError(
      'Invalid or expired token',
      'AUTHENTICATION_ERROR',
      401,
    );
  }

  return user.id;
}

/**
 * GET /api/transactions/stats - Get transaction statistics
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = StatsQuerySchema.parse(queryParams);

    const { period, startDate, endDate, cardId, category, groupBy } =
      validatedParams;

    // Calculate date range
    const { start, end } = calculateDateRange(period, startDate, endDate);

    // Build base query
    let baseQuery = supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', 'debit') // Only count debits for spending stats
      .gte('transaction_date', start)
      .lte('transaction_date', end);

    // Apply filters
    if (cardId) {
      baseQuery = baseQuery.eq('card_id', cardId);
    }

    if (category) {
      baseQuery = baseQuery.eq('category', category);
    }

    // Get basic statistics
    const { data: transactions, error } = await baseQuery;

    if (error) {
      console.error('Error fetching transaction stats:', error);
      throw new FinMatterError(
        'Failed to fetch transaction statistics',
        'INTERNAL_SERVER_ERROR',
        500,
      );
    }

    // Calculate statistics
    const stats = calculateTransactionStats(transactions || [], groupBy);

    // Get top merchants
    const topMerchants = getTopMerchants(transactions || []);

    // Get spending trends
    const spendingTrends = getSpendingTrends(transactions || [], groupBy);

    // Get category breakdown
    const categoryBreakdown = getCategoryBreakdown(transactions || []);

    return createCorsResponse(
      {
        success: true,
        data: {
          summary: {
            totalTransactions: transactions?.length || 0,
            totalSpent: stats.totalSpent,
            averageTransactionValue: stats.averageTransactionValue,
            period: {
              start,
              end,
              type: period,
            },
          },
          breakdown: categoryBreakdown,
          trends: spendingTrends,
          topMerchants,
          filters: validatedParams,
        },
      },
      {
        status: 200,
        origin: origin || undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error in GET /api/transactions/stats:', error);

    if (error instanceof FinMatterError) {
      return createCorsResponse(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        {
          status: error.statusCode,
          origin: origin || undefined,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    if (error instanceof z.ZodError) {
      return createCorsResponse(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        {
          status: 400,
          origin: origin || undefined,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    return createCorsResponse(
      {
        success: false,
        error: 'Internal server error',
      },
      {
        status: 500,
        origin: origin || undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}

/**
 * Calculate date range based on period
 */
function calculateDateRange(
  period: string,
  customStart?: string,
  customEnd?: string,
): { start: string; end: string } {
  const now = new Date();

  if (period === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }

  let start: Date;

  switch (period) {
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter': {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterStart, 1);
      break;
    }
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    start: start.toISOString(),
    end: now.toISOString(),
  };
}

/**
 * Calculate transaction statistics
 */
function calculateTransactionStats(
  transactions: any[],
  groupBy: string,
): {
  totalSpent: number;
  averageTransactionValue: number;
  groupedData: Record<string, any>;
} {
  const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const averageTransactionValue =
    transactions.length > 0 ? totalSpent / transactions.length : 0;

  // Group data based on groupBy parameter
  const groupedData: Record<string, any> = {};

  transactions.forEach(transaction => {
    let groupKey: string;

    switch (groupBy) {
      case 'category':
        groupKey = transaction.category || 'others';
        break;
      case 'card':
        groupKey = transaction.card_id || 'unknown';
        break;
      case 'month':
        groupKey = new Date(transaction.transaction_date)
          .toISOString()
          .substring(0, 7); // YYYY-MM
        break;
      case 'week': {
        const weekStart = getWeekStart(new Date(transaction.transaction_date));
        groupKey = weekStart.toISOString().substring(0, 10); // YYYY-MM-DD
        break;
      }
      case 'day':
        groupKey = new Date(transaction.transaction_date)
          .toISOString()
          .substring(0, 10); // YYYY-MM-DD
        break;
      default:
        groupKey = transaction.category || 'others';
    }

    if (!groupedData[groupKey]) {
      groupedData[groupKey] = {
        count: 0,
        total: 0,
        average: 0,
      };
    }

    groupedData[groupKey].count++;
    groupedData[groupKey].total += transaction.amount || 0;
    groupedData[groupKey].average =
      groupedData[groupKey].total / groupedData[groupKey].count;
  });

  return {
    totalSpent,
    averageTransactionValue,
    groupedData,
  };
}

/**
 * Get top merchants by spending
 */
function getTopMerchants(
  transactions: any[],
  limit: number = 10,
): Array<{
  merchant: string;
  amount: number;
  count: number;
  percentage: number;
}> {
  const merchantStats: Record<string, { amount: number; count: number }> = {};
  const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  transactions.forEach(transaction => {
    const merchant = transaction.merchant_name || 'Unknown';

    if (!merchantStats[merchant]) {
      merchantStats[merchant] = { amount: 0, count: 0 };
    }

    merchantStats[merchant].amount += transaction.amount || 0;
    merchantStats[merchant].count++;
  });

  return Object.entries(merchantStats)
    .map(([merchant, stats]) => ({
      merchant,
      amount: stats.amount,
      count: stats.count,
      percentage: totalSpent > 0 ? (stats.amount / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

/**
 * Get spending trends over time
 */
function getSpendingTrends(
  transactions: any[],
  groupBy: string,
): Array<{
  period: string;
  amount: number;
  count: number;
}> {
  const trends: Record<string, { amount: number; count: number }> = {};

  transactions.forEach(transaction => {
    let periodKey: string;

    switch (groupBy) {
      case 'month':
        periodKey = new Date(transaction.transaction_date)
          .toISOString()
          .substring(0, 7);
        break;
      case 'week': {
        const weekStart = getWeekStart(new Date(transaction.transaction_date));
        periodKey = weekStart.toISOString().substring(0, 10);
        break;
      }
      case 'day':
        periodKey = new Date(transaction.transaction_date)
          .toISOString()
          .substring(0, 10);
        break;
      default:
        periodKey = new Date(transaction.transaction_date)
          .toISOString()
          .substring(0, 7);
    }

    if (!trends[periodKey]) {
      trends[periodKey] = { amount: 0, count: 0 };
    }

    trends[periodKey].amount += transaction.amount || 0;
    trends[periodKey].count++;
  });

  return Object.entries(trends)
    .map(([period, stats]) => ({
      period,
      amount: stats.amount,
      count: stats.count,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Get category breakdown
 */
function getCategoryBreakdown(transactions: any[]): Array<{
  category: string;
  amount: number;
  count: number;
  percentage: number;
}> {
  const categoryStats: Record<string, { amount: number; count: number }> = {};
  const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  transactions.forEach(transaction => {
    const category = transaction.category || 'others';

    if (!categoryStats[category]) {
      categoryStats[category] = { amount: 0, count: 0 };
    }

    if (categoryStats[category]) {
      categoryStats[category].amount += transaction.amount || 0;
      categoryStats[category].count++;
    }
  });

  return Object.entries(categoryStats)
    .map(([category, stats]) => ({
      category,
      amount: stats.amount,
      count: stats.count,
      percentage: totalSpent > 0 ? (stats.amount / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Get week start date (Monday)
 */
function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(date.setDate(diff));
}

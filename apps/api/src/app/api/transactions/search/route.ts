/**
 * Transaction Search API Endpoint
 * GET /api/transactions/search - Search transactions with advanced filters
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { z } from 'zod';

const SearchQuerySchema = z.object({
  // Search query
  q: z.string().min(1, 'Search query is required'),

  // Pagination
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),

  // Filters
  cardId: z.string().uuid().optional(),
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),

  // Search scope
  fields: z
    .array(z.enum(['merchant_name', 'description', 'notes', 'tags']))
    .default(['merchant_name', 'description', 'notes']),

  // Sorting
  sortBy: z.enum(['date', 'amount', 'relevance']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
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
 * GET /api/transactions/search - Search transactions
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries());

    // Parse fields parameter (comma-separated string)
    if (queryParams.fields && typeof queryParams.fields === 'string') {
      queryParams.fields = queryParams.fields
        .split(',')
        .map(f => f.trim()) as any;
    }

    const validatedParams = SearchQuerySchema.parse(queryParams);

    const {
      q: searchQuery,
      page,
      limit,
      cardId,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      fields,
      sortBy,
      sortOrder,
    } = validatedParams;

    // Build search conditions
    const searchConditions: string[] = [];
    fields.forEach(field => {
      searchConditions.push(`${field}.ilike.%${searchQuery}%`);
    });

    // Build the query
    let query = supabaseAdmin
      .from('transactions')
      .select(
        `
        *,
        cards (
          id,
          cardName,
          bankName,
          lastFourDigits
        )
      `,
      )
      .eq('user_id', userId)
      .or(searchConditions.join(','));

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

    if (minAmount !== undefined) {
      query = query.gte('amount', minAmount);
    }

    if (maxAmount !== undefined) {
      query = query.lte('amount', maxAmount);
    }

    // Apply sorting
    if (sortBy === 'relevance') {
      // For relevance, we'll sort by date as a proxy (most recent first)
      query = query.order('transaction_date', { ascending: false });
    } else {
      const orderField = sortBy === 'date' ? 'transaction_date' : 'amount';
      query = query.order(orderField, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error searching transactions:', error);
      throw new FinMatterError(
        'Failed to search transactions',
        'INTERNAL_SERVER_ERROR',
        500,
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .or(searchConditions.join(','));

    // Calculate relevance scores for results
    const scoredTransactions = calculateRelevanceScores(
      transactions || [],
      searchQuery,
      fields,
    );

    return createCorsResponse(
      JSON.stringify({
        success: true,
        data: {
          transactions: scoredTransactions,
          pagination: {
            page,
            limit,
            total: totalCount || 0,
            totalPages: Math.ceil((totalCount || 0) / limit),
            hasNext: page * limit < (totalCount || 0),
            hasPrev: page > 1,
          },
          search: {
            query: searchQuery,
            fields,
            filters: {
              cardId,
              category,
              startDate,
              endDate,
              minAmount,
              maxAmount,
            },
          },
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error in GET /api/transactions/search:', error);

    if (error instanceof FinMatterError) {
      return createCorsResponse(
        JSON.stringify({
          success: false,
          error: error.message,
          code: error.code,
        }),
        {
          status: error.statusCode,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    if (error instanceof z.ZodError) {
      return createCorsResponse(
        JSON.stringify({
          success: false,
          error: 'Validation error',
          details: error.errors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    return createCorsResponse(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}

/**
 * Calculate relevance scores for search results
 */
function calculateRelevanceScores(
  transactions: any[],
  searchQuery: string,
  searchFields: string[],
): Array<any & { relevanceScore: number; matchedFields: string[] }> {
  const normalizedQuery = searchQuery.toLowerCase();

  return transactions
    .map(transaction => {
      let relevanceScore = 0;
      const matchedFields: string[] = [];

      // Check each search field
      searchFields.forEach(field => {
        const fieldValue = transaction[field];
        if (fieldValue && typeof fieldValue === 'string') {
          const normalizedValue = fieldValue.toLowerCase();

          // Exact match gets highest score
          if (normalizedValue === normalizedQuery) {
            relevanceScore += 100;
            matchedFields.push(field);
          }
          // Starts with query gets high score
          else if (normalizedValue.startsWith(normalizedQuery)) {
            relevanceScore += 80;
            matchedFields.push(field);
          }
          // Contains query gets medium score
          else if (normalizedValue.includes(normalizedQuery)) {
            relevanceScore += 50;
            matchedFields.push(field);
          }
          // Word boundary match gets lower score
          else if (
            new RegExp(`\\b${normalizedQuery}\\b`).test(normalizedValue)
          ) {
            relevanceScore += 30;
            matchedFields.push(field);
          }
        }
      });

      // Boost score for recent transactions
      const daysSinceTransaction = Math.floor(
        (Date.now() - new Date(transaction.transaction_date).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysSinceTransaction < 30) {
        relevanceScore += 10;
      } else if (daysSinceTransaction < 90) {
        relevanceScore += 5;
      }

      // Boost score for higher amounts (more significant transactions)
      if (transaction.amount > 1000) {
        relevanceScore += 5;
      }

      return {
        ...transaction,
        relevanceScore,
        matchedFields: [...new Set(matchedFields)], // Remove duplicates
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by relevance score
}

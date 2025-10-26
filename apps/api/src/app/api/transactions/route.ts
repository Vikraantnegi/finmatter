/**
 * Transactions API Endpoint
 * GET /api/transactions - Get user's transactions with filtering and pagination
 * POST /api/transactions - Create a new transaction (manual entry)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { z } from 'zod';

const TransactionQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),

  // Filtering
  cardId: z.string().uuid().optional(),
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  merchant: z.string().optional(),
  search: z.string().optional(),

  // Sorting
  sortBy: z.enum(['date', 'amount', 'merchant']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Grouping
  groupBy: z.enum(['date', 'category', 'card', 'none']).default('none'),
});

const CreateTransactionSchema = z.object({
  cardId: z.string().uuid().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('INR'),
  type: z
    .enum(['debit', 'credit', 'refund', 'fee', 'interest'])
    .default('debit'),
  merchantName: z.string().min(1, 'Merchant name is required'),
  description: z.string().optional(),
  date: z.string().datetime(),
  category: z
    .enum([
      'dining',
      'shopping',
      'groceries',
      'fuel',
      'travel',
      'entertainment',
      'bills',
      'healthcare',
      'education',
      'transport',
      'utilities',
      'insurance',
      'investment',
      'others',
    ])
    .default('others'),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  location: z
    .object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
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
 * GET /api/transactions - Get user's transactions
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = TransactionQuerySchema.parse(queryParams);

    const {
      page,
      limit,
      cardId,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      merchant,
      search,
      sortBy,
      sortOrder,
      groupBy,
    } = validatedParams;

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
      .order(sortBy === 'date' ? 'transaction_date' : sortBy, {
        ascending: sortOrder === 'asc',
      });

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

    if (merchant) {
      query = query.ilike('merchant_name', `%${merchant}%`);
    }

    if (search) {
      query = query.or(
        `merchant_name.ilike.%${search}%,description.ilike.%${search}%,notes.ilike.%${search}%`,
      );
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      throw new FinMatterError(
        'Failed to fetch transactions',
        'INTERNAL_SERVER_ERROR',
        500,
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Group transactions if requested
    let groupedTransactions = transactions;
    if (groupBy !== 'none' && transactions) {
      groupedTransactions = groupTransactions(transactions, groupBy);
    }

    return createCorsResponse(
      JSON.stringify({
        success: true,
        data: {
          transactions: groupedTransactions,
          pagination: {
            page,
            limit,
            total: totalCount || 0,
            totalPages: Math.ceil((totalCount || 0) / limit),
            hasNext: page * limit < (totalCount || 0),
            hasPrev: page > 1,
          },
          filters: validatedParams,
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
    console.error('Error in GET /api/transactions:', error);

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
 * POST /api/transactions - Create a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const body = await request.json();

    // Validate request body
    const validatedData = CreateTransactionSchema.parse(body);

    // Check if card exists and belongs to user (if cardId provided)
    if (validatedData.cardId) {
      const { data: card, error: cardError } = await supabaseAdmin
        .from('cards')
        .select('id')
        .eq('id', validatedData.cardId)
        .eq('user_id', userId)
        .single();

      if (cardError || !card) {
        throw new FinMatterError(
          'Card not found or does not belong to user',
          'NOT_FOUND',
          404,
        );
      }
    }

    // Insert transaction
    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        card_id: validatedData.cardId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        transaction_type: validatedData.type,
        merchant_name: validatedData.merchantName,
        description: validatedData.description,
        transaction_date: validatedData.date,
        category: validatedData.category,
        subcategory: validatedData.subcategory,
        tags: validatedData.tags,
        notes: validatedData.notes,
        location: validatedData.location,
        source: 'manual',
      })
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
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      throw new FinMatterError(
        'Failed to create transaction',
        'INTERNAL_SERVER_ERROR',
        500,
      );
    }

    return createCorsResponse(
      JSON.stringify({
        success: true,
        data: transaction,
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error in POST /api/transactions:', error);

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
 * Group transactions by specified criteria
 */
function groupTransactions(transactions: any[], groupBy: string): any {
  const groups: Record<string, any[]> = {};

  transactions.forEach(transaction => {
    let groupKey: string;

    switch (groupBy) {
      case 'date':
        groupKey = new Date(transaction.transaction_date).toDateString();
        break;
      case 'category':
        groupKey = transaction.category;
        break;
      case 'card':
        groupKey =
          (transaction.cards && transaction.cards.cardName) || 'Unknown Card';
        break;
      default:
        groupKey = 'all';
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(transaction);
  });

  return groups;
}

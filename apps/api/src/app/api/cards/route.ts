/**
 * Cards API Endpoint
 * GET /api/cards - Get user's cards
 * POST /api/cards - Add new card
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { z } from 'zod';
import { DatabaseCard } from '@finmatter/types';

// Request validation schemas
const CreateCardSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required').max(100),
  cardName: z.string().min(1, 'Card name is required').max(100),
  lastFourDigits: z.string().regex(/^\d{4}$/, 'Last four digits must be exactly 4 digits'),
  cardType: z.enum(['credit', 'debit', 'prepaid']),
  network: z.enum(['visa', 'mastercard', 'rupay', 'amex', 'discover']),
  rewardType: z.enum(['cashback', 'points', 'miles', 'none']),
  annualFee: z.number().min(0).default(0),
  currency: z.string().default('INR'),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  availableCredit: z.number().min(0).optional(),
});

const GetCardsSchema = z.object({
  status: z.enum(['active', 'inactive', 'blocked', 'expired']).optional(),
  cardType: z.enum(['credit', 'debit', 'prepaid']).optional(),
  bankName: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

/**
 * Helper function to get authenticated user ID
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new FinMatterError('Unauthorized', 'AUTH_REQUIRED', 401);
  }

  const token = authHeader.split(' ')[1];
  const { data: userResponse, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !userResponse?.user) {
    throw new FinMatterError('Unauthorized', 'INVALID_TOKEN', 401);
  }

  return userResponse.user.id;
}

/**
 * GET /api/cards
 * Get user's cards with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    
    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = {
      status: url.searchParams.get('status'),
      cardType: url.searchParams.get('cardType'),
      bankName: url.searchParams.get('bankName'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
      offset: parseInt(url.searchParams.get('offset') || '0'),
    };

    // Validate query parameters
    const validation = GetCardsSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validation.error.errors,
          },
        },
        { status: 400 },
      );
    }

    const { status, cardType, bankName, limit, offset } = validation.data;

    // Build query
    let query = supabaseAdmin
      .from('cards')
      .select(`
        *,
        card_benefits (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) query = query.eq('status', status);
    if (cardType) query = query.eq('card_type', cardType);
    if (bankName) query = query.ilike('bank_name', `%${bankName}%`);

    const { data: cards, error } = await query;

    if (error) {
      console.error('Supabase get cards error:', error);
      throw new FinMatterError(
        'Failed to fetch cards',
        'DB_QUERY_FAILED',
        500,
        { error },
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (status) countQuery = countQuery.eq('status', status);
    if (cardType) countQuery = countQuery.eq('card_type', cardType);
    if (bankName) countQuery = countQuery.ilike('bank_name', `%${bankName}%`);

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Supabase count cards error:', countError);
      // Continue without count if there's an error
    }

    return NextResponse.json({
      success: true,
      data: {
        cards: cards || [],
        pagination: {
          limit,
          offset,
          total: count || 0,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });
  } catch (error) {
    if (error instanceof FinMatterError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode },
      );
    }

    console.error('Get cards error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/cards
 * Create a new card
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    
    // Parse and validate request body
    const body = await request.json();
    const validation = CreateCardSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        },
        { status: 400 },
      );
    }

    const cardData = validation.data;

    // Prepare database insert data
    const insertData: Omit<DatabaseCard, 'id' | 'createdAt' | 'updatedAt'> = {
      user_id: userId,
      bank_name: cardData.bankName,
      card_name: cardData.cardName,
      last_four_digits: cardData.lastFourDigits, // TODO: Encrypt this in production
      card_type: cardData.cardType,
      network: cardData.network,
      reward_type: cardData.rewardType,
      annual_fee: cardData.annualFee,
      currency: cardData.currency,
      status: 'active',
      issue_date: cardData.issueDate ? new Date(cardData.issueDate) : undefined,
      expiry_date: cardData.expiryDate ? new Date(cardData.expiryDate) : undefined,
      credit_limit: cardData.creditLimit || undefined,
      available_credit: cardData.availableCredit || undefined,
    };

    // Insert card
    const { data: card, error } = await supabaseAdmin
      .from('cards')
      .insert(insertData)
      .select(`
        *,
        card_benefits (*)
      `)
      .single();

    if (error) {
      console.error('Supabase create card error:', error);
      throw new FinMatterError(
        'Failed to create card',
        'DB_INSERT_FAILED',
        500,
        { error },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          card,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof FinMatterError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode },
      );
    }

    console.error('Create card error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    );
  }
}

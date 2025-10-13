/**
 * Cards API Endpoint
 * GET /api/cards - Get user's cards
 * POST /api/cards - Add new card
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { z } from 'zod';
import { DatabaseCard } from '@finmatter/types';
import { dbCardsToApiCards, dbCardToApiCard } from '@/lib/dataTransform';
import { sanitizeCardName, sanitizeLastFourDigits, sanitizeCreditAmount } from '@/lib/sanitize';
import { withRateLimit, CARD_CREATE_LIMIT } from '@/lib/rateLimit';

// Helper function to parse MM/YY format to proper date
function parseMMYYToDate(mmYyString: string): Date {
  const [month, year] = mmYyString.split('/');
  const monthNum = parseInt(month, 10) - 1; // JavaScript months are 0-indexed
  const yearNum = parseInt(`20${year}`, 10); // Convert YY to 20YY
  
  // Return the last day of the month
  return new Date(yearNum, monthNum + 1, 0);
}

// Request validation schemas
const CreateCardSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required').max(100),
  cardName: z.string().min(1, 'Card name is required').max(100),
  lastFourDigits: z
    .string()
    .regex(/^\d{4}$/, 'Last four digits must be exactly 4 digits'),
  cardType: z.enum(['credit', 'debit', 'prepaid']),
  network: z.enum(['visa', 'mastercard', 'rupay', 'amex', 'discover']),
  rewardType: z.enum(['cashback', 'points', 'miles', 'none']),
  annualFee: z.number().min(0).default(0),
  currency: z.string().default('INR'),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  availableCredit: z.number().min(0).optional(),
  billingDay: z.number().min(1).max(31).optional(), // Optional - can be extracted from statements later
  cardMetadataId: z.string().optional(),
  bankId: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  isCustom: z.boolean().optional(),
}).refine(
  (data) => {
    // Validate availableCredit <= creditLimit
    if (data.availableCredit !== undefined && data.creditLimit !== undefined) {
      return data.availableCredit <= data.creditLimit;
    }
    return true;
  },
  {
    message: 'Available credit cannot exceed credit limit',
    path: ['availableCredit'],
  }
);

const GetCardsSchema = z.object({
  status: z.enum(['active', 'inactive', 'blocked', 'expired']).optional(),
  cardType: z.enum(['credit', 'debit', 'prepaid']).optional(),
  bankName: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
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
 * GET /api/cards
 * Get user's cards with optional filtering
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const userId = await getAuthenticatedUserId(request);

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = {
      status: url.searchParams.get('status') || undefined,
      cardType: url.searchParams.get('cardType') || undefined,
      bankName: url.searchParams.get('bankName') || undefined,
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

    // Build query - only fetch non-deleted cards by default
    let query = supabaseAdmin
      .from('cards')
      .select(
        `
        *,
        card_benefits (*)
      `,
      )
      .eq('user_id', userId)
      .is('deleted_at', null) // Only get active cards
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) query = query.eq('status', status);
    if (cardType) query = query.eq('card_type', cardType);
    if (bankName) query = query.ilike('bank_name', `%${bankName}%`);

    const { data: cards, error } = await query;

    if (error) {
      // Supabase error logged
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
      .eq('user_id', userId)
      .is('deleted_at', null); // Only count active cards

    if (status) countQuery = countQuery.eq('status', status);
    if (cardType) countQuery = countQuery.eq('card_type', cardType);
    if (bankName) countQuery = countQuery.ilike('bank_name', `%${bankName}%`);

    const { count, error: countError } = await countQuery;

    if (countError) {
      // Count error logged
      // Continue without count if there's an error
    }

    // Transform database format to API format
    const transformedCards = dbCardsToApiCards(cards || []);

    return createCorsResponse(
      {
        success: true,
        data: {
          cards: transformedCards,
          pagination: {
            limit,
            offset,
            total: count || 0,
            hasMore: (count || 0) > offset + limit,
          },
        },
      },
      { origin: origin || undefined }
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
        { status: error.statusCode },
      );
    }

    // Error logged
    return createCorsResponse(
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
 * Rate limited: 10 cards per 15 minutes
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Apply rate limiting
  const { checkRateLimit, getClientIdentifier } = await import('@/lib/rateLimit');
  const identifier = await getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, CARD_CREATE_LIMIT);

  if (rateLimit.limited) {
    return createCorsResponse(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: CARD_CREATE_LIMIT.message || 'Too many cards created.',
          details: {
            retryAfter: rateLimit.retryAfter,
          },
          suggestion: `Please wait ${rateLimit.retryAfter} seconds before adding more cards.`,
        },
      },
      {
        status: 429,
        origin: origin || undefined,
        headers: {
          'Retry-After': rateLimit.retryAfter.toString(),
          'X-RateLimit-Limit': CARD_CREATE_LIMIT.max.toString(),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

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

    // Sanitize inputs before database insert (security)
    const sanitizedBankName = sanitizeCardName(cardData.bankName);
    const sanitizedCardName = sanitizeCardName(cardData.cardName);
    const sanitizedLastFour = sanitizeLastFourDigits(cardData.lastFourDigits);

    // Prepare database insert data
    const insertData = {
      user_id: userId,
      bank_name: sanitizedBankName,
      card_name: sanitizedCardName,
      last_four_digits: sanitizedLastFour, // TODO: Encrypt this in production
      card_type: cardData.cardType,
      network: cardData.network,
      reward_type: cardData.rewardType,
      annual_fee: cardData.annualFee,
      currency: cardData.currency,
      status: 'active' as const,
      issue_date: cardData.issueDate ? new Date(cardData.issueDate) : undefined,
      expiry_date: cardData.expiryDate
        ? parseMMYYToDate(cardData.expiryDate)
        : undefined,
      credit_limit: cardData.creditLimit ? sanitizeCreditAmount(cardData.creditLimit) : undefined,
      available_credit: cardData.availableCredit ? sanitizeCreditAmount(cardData.availableCredit) : undefined,
      billing_day: cardData.billingDay || undefined,
      card_metadata_id: cardData.cardMetadataId || undefined,
      bank_id: cardData.bankId || undefined,
      primary_color: cardData.primaryColor || undefined,
      secondary_color: cardData.secondaryColor || undefined,
      is_custom: cardData.isCustom || false,
    };

    // Insert card
    const { data: card, error } = await supabaseAdmin
      .from('cards')
      .insert(insertData)
      .select(
        `
        *,
        card_benefits (*)
      `,
      )
      .single();

    if (error) {
      // Handle duplicate card error (unique constraint violation)
      if (error.code === '23505') {
        return createCorsResponse(
          {
            success: false,
            error: {
              code: 'CARD_ALREADY_EXISTS',
              message: `You've already added a card from ${cardData.bankName} ending in ${cardData.lastFourDigits}.`,
              details: {
                field: 'lastFourDigits',
                bankName: cardData.bankName,
                lastFourDigits: cardData.lastFourDigits,
              },
              suggestion: 'Check your cards list or try different card details.',
            },
          },
          { status: 409, origin: origin || undefined },
        );
      }

      // Handle foreign key violation (user not found)
      if (error.code === '23503') {
        return createCorsResponse(
          {
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'Your session has expired. Please login again.',
              suggestion: 'Refresh the page and login.',
            },
          },
          { status: 401, origin: origin || undefined },
        );
      }

      // Generic database error
      console.error('Supabase create card error:', error);
      throw new FinMatterError(
        'Failed to create card',
        'DB_INSERT_FAILED',
        500,
        { error },
      );
    }

    // Transform database format to API format
    const transformedCard = dbCardToApiCard(card);

    return createCorsResponse(
      {
        success: true,
        data: {
          card: transformedCard,
        },
      },
      { status: 201, origin: origin || undefined },
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

    // Error logged
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

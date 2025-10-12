/**
 * Card Benefits API Endpoint
 * GET /api/cards/[id]/benefits - Get card benefits
 * POST /api/cards/[id]/benefits - Add card benefits
 * PUT /api/cards/[id]/benefits/[benefitId] - Update card benefit
 * DELETE /api/cards/[id]/benefits/[benefitId] - Delete card benefit
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { z } from 'zod';
import { DatabaseCardBenefit } from '@finmatter/types';
import { dbBenefitsToApiBenefits, dbBenefitToApiBenefit } from '@/lib/dataTransform';

// Request validation schemas
const CreateBenefitSchema = z.object({
  category: z.string().min(1, 'Category is required').max(50),
  rewardRate: z
    .number()
    .min(0, 'Reward rate must be positive')
    .max(100, 'Reward rate cannot exceed 100%'),
  rewardType: z.enum(['cashback', 'points', 'miles']).default('cashback'),
  rewardCap: z.number().min(0, 'Reward cap must be positive').optional(),
  conditions: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  validFrom: z.string().optional(), // NEW
  validUntil: z.string().optional(), // NEW
  description: z.string().optional(), // NEW
  value: z.string().optional(), // NEW
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
 * Helper function to verify card ownership
 */
async function verifyCardOwnership(
  cardId: string,
  userId: string,
): Promise<void> {
  const { data: card, error } = await supabaseAdmin
    .from('cards')
    .select('id')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single();

  if (error || !card) {
    throw new FinMatterError('Card not found', 'CARD_NOT_FOUND', 404);
  }
}

/**
 * GET /api/cards/[id]/benefits
 * Get card benefits
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');
  try {
    const userId = await getAuthenticatedUserId(request);
    const cardId = params.id;

    if (!cardId) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Card ID is required',
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Verify card ownership
    await verifyCardOwnership(cardId, userId);

    // Get benefits
    const { data: benefits, error } = await supabaseAdmin
      .from('card_benefits')
      .select('*')
      .eq('card_id', cardId)
      .order('category', { ascending: true });

    if (error) {
      console.error('Supabase get benefits error:', error);
      throw new FinMatterError(
        'Failed to fetch benefits',
        'DB_QUERY_FAILED',
        500,
        { error },
      );
    }

    // Transform database format to API format
    const transformedBenefits = dbBenefitsToApiBenefits(benefits || []);

    return createCorsResponse(
      {
        success: true,
        data: {
          benefits: transformedBenefits,
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

    console.error('Get benefits error:', error);
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
 * POST /api/cards/[id]/benefits
 * Add card benefits
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');
  try {
    const userId = await getAuthenticatedUserId(request);
    const cardId = params.id;

    if (!cardId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Card ID is required',
          },
        },
        { status: 400 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = CreateBenefitSchema.safeParse(body);

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

    // Verify card ownership
    await verifyCardOwnership(cardId, userId);

    const benefitData = validation.data;

    // Prepare database insert data
    const insertData: Omit<
      DatabaseCardBenefit,
      'id' | 'created_at' | 'updated_at'
    > = {
      card_id: cardId,
      category: benefitData.category,
      reward_rate: benefitData.rewardRate,
      reward_type: benefitData.rewardType,
      reward_cap: benefitData.rewardCap || 0,
      conditions: benefitData.conditions || {},
      is_active: benefitData.isActive,
      valid_from: benefitData.validFrom ? new Date(benefitData.validFrom) : undefined,
      valid_until: benefitData.validUntil ? new Date(benefitData.validUntil) : undefined,
      description: benefitData.description,
      value: benefitData.value,
    };

    // Insert benefit
    const { data: benefit, error } = await supabaseAdmin
      .from('card_benefits')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase create benefit error:', error);
      throw new FinMatterError(
        'Failed to create benefit',
        'DB_INSERT_FAILED',
        500,
        { error },
      );
    }

    // Transform database format to API format
    const transformedBenefit = dbBenefitToApiBenefit(benefit);

    return createCorsResponse(
      {
        success: true,
        data: {
          benefit: transformedBenefit,
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

    console.error('Create benefit error:', error);
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

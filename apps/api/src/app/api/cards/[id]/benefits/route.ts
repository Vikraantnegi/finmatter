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
import { z } from 'zod';
import { DatabaseCardBenefit } from '@finmatter/types';

// Request validation schemas
const CreateBenefitSchema = z.object({
  category: z.string().min(1, 'Category is required').max(50),
  rewardRate: z.number().min(0, 'Reward rate must be positive').max(100, 'Reward rate cannot exceed 100%'),
  rewardCap: z.number().min(0, 'Reward cap must be positive').optional(),
  conditions: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

// TODO: fix this ts error, UpdateBenefitSchema is not used
// const UpdateBenefitSchema = z.object({
//   category: z.string().min(1).max(50).optional(),
//   rewardRate: z.number().min(0).max(100).optional(),
//   rewardCap: z.number().min(0).optional(),
//   conditions: z.record(z.any()).optional(),
//   isActive: z.boolean().optional(),
// });

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
 * Helper function to verify card ownership
 */
async function verifyCardOwnership(cardId: string, userId: string): Promise<void> {
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
  { params }: { params: { id: string } }
) {
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

    return NextResponse.json({
      success: true,
      data: {
        benefits: benefits || [],
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

    console.error('Get benefits error:', error);
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
 * POST /api/cards/[id]/benefits
 * Add card benefits
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const insertData: Omit<DatabaseCardBenefit, 'id' | 'created_at' | 'updated_at'> = {
      card_id: cardId,
      category: benefitData.category,
      reward_rate: benefitData.rewardRate,
      reward_cap: benefitData.rewardCap || 0,
      conditions: benefitData.conditions || {},
      is_active: benefitData.isActive,
      // TODO: fix this ts error, reward_type is missing in benefit data
      reward_type: 'cashback',
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

    return NextResponse.json(
      {
        success: true,
        data: {
          benefit,
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

    console.error('Create benefit error:', error);
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

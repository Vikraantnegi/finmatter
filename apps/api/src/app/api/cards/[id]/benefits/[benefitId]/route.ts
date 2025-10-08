/**
 * Individual Card Benefit API Endpoint
 * PUT /api/cards/[id]/benefits/[benefitId] - Update card benefit
 * DELETE /api/cards/[id]/benefits/[benefitId] - Delete card benefit
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { z } from 'zod';
import { DatabaseCardBenefit } from '@finmatter/types';

// Request validation schema
const UpdateBenefitSchema = z.object({
  category: z.string().min(1).max(50).optional(),
  rewardRate: z.number().min(0).max(100).optional(),
  rewardCap: z.number().min(0).optional(),
  conditions: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
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
  const { data: userResponse, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  if (userError || !userResponse?.user) {
    throw new FinMatterError('Unauthorized', 'INVALID_TOKEN', 401);
  }

  return userResponse.user.id;
}

/**
 * Helper function to verify benefit ownership
 */
async function verifyBenefitOwnership(
  cardId: string,
  benefitId: string,
  userId: string,
): Promise<DatabaseCardBenefit> {
  // First verify the card belongs to the user
  const { data: card, error: cardError } = await supabaseAdmin
    .from('cards')
    .select('id')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single();

  if (cardError || !card) {
    throw new FinMatterError('Card not found', 'CARD_NOT_FOUND', 404);
  }

  // Then get the benefit
  const { data: benefit, error: benefitError } = await supabaseAdmin
    .from('card_benefits')
    .select('*')
    .eq('id', benefitId)
    .eq('card_id', cardId)
    .single();

  if (benefitError || !benefit) {
    throw new FinMatterError('Benefit not found', 'BENEFIT_NOT_FOUND', 404);
  }

  return benefit;
}

/**
 * PUT /api/cards/[id]/benefits/[benefitId]
 * Update card benefit
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; benefitId: string } },
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const cardId = params.id;
    const benefitId = params.benefitId;

    if (!cardId || !benefitId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Card ID and Benefit ID are required',
          },
        },
        { status: 400 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = UpdateBenefitSchema.safeParse(body);

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

    // Verify benefit ownership
    await verifyBenefitOwnership(cardId, benefitId, userId);

    // Prepare update data
    const updateData: Partial<DatabaseCardBenefit> = {};
    const validatedData = validation.data;

    if (validatedData.category !== undefined)
      updateData.category = validatedData.category;
    if (validatedData.rewardRate !== undefined)
      updateData.reward_rate = validatedData.rewardRate;
    if (validatedData.rewardCap !== undefined)
      updateData.reward_cap = validatedData.rewardCap;
    if (validatedData.conditions !== undefined)
      updateData.conditions = validatedData.conditions;
    if (validatedData.isActive !== undefined)
      updateData.is_active = validatedData.isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: true, message: 'No data to update' },
        { status: 200 },
      );
    }

    // Update benefit
    const { data: benefit, error } = await supabaseAdmin
      .from('card_benefits')
      .update(updateData)
      .eq('id', benefitId)
      .eq('card_id', cardId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update benefit error:', error);
      throw new FinMatterError(
        'Failed to update benefit',
        'DB_UPDATE_FAILED',
        500,
        { error },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        benefit,
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

    console.error('Update benefit error:', error);
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
 * DELETE /api/cards/[id]/benefits/[benefitId]
 * Delete card benefit
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; benefitId: string } },
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const cardId = params.id;
    const benefitId = params.benefitId;

    if (!cardId || !benefitId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Card ID and Benefit ID are required',
          },
        },
        { status: 400 },
      );
    }

    // Verify benefit ownership
    await verifyBenefitOwnership(cardId, benefitId, userId);

    // Delete benefit
    const { error } = await supabaseAdmin
      .from('card_benefits')
      .delete()
      .eq('id', benefitId)
      .eq('card_id', cardId);

    if (error) {
      console.error('Supabase delete benefit error:', error);
      throw new FinMatterError(
        'Failed to delete benefit',
        'DB_DELETE_FAILED',
        500,
        { error },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Benefit deleted successfully',
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

    console.error('Delete benefit error:', error);
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

/**
 * Individual Card API Endpoint
 * GET /api/cards/[id] - Get specific card
 * PUT /api/cards/[id] - Update card
 * DELETE /api/cards/[id] - Soft delete card
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { z } from 'zod';
import { DatabaseCard } from '@finmatter/types';

// Request validation schemas
const UpdateCardSchema = z.object({
  bankName: z.string().min(1).max(100).optional(),
  cardName: z.string().min(1).max(100).optional(),
  lastFourDigits: z
    .string()
    .regex(/^\d{4}$/, 'Last four digits must be exactly 4 digits')
    .optional(),
  cardType: z.enum(['credit', 'debit', 'prepaid']).optional(),
  network: z
    .enum(['visa', 'mastercard', 'rupay', 'amex', 'discover'])
    .optional(),
  rewardType: z.enum(['cashback', 'points', 'miles', 'none']).optional(),
  annualFee: z.number().min(0).optional(),
  currency: z.string().optional(),
  status: z.enum(['active', 'inactive', 'blocked', 'expired']).optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  availableCredit: z.number().min(0).optional(),
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
 * Helper function to verify card ownership
 */
async function verifyCardOwnership(
  cardId: string,
  userId: string,
): Promise<DatabaseCard> {
  const { data: card, error } = await supabaseAdmin
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single();

  if (error || !card) {
    throw new FinMatterError('Card not found', 'CARD_NOT_FOUND', 404);
  }

  return card;
}

/**
 * GET /api/cards/[id]
 * Get specific card details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
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

    // Verify ownership and get card
    const { data: card, error } = await supabaseAdmin
      .from('cards')
      .select(
        `
        *,
        card_benefits (*)
      `,
      )
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (error || !card) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CARD_NOT_FOUND',
            message: 'Card not found',
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        card,
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

    console.error('Get card error:', error);
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
 * PUT /api/cards/[id]
 * Update card details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
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
    const validation = UpdateCardSchema.safeParse(body);

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

    // Prepare update data
    const updateData: Partial<DatabaseCard> = {};
    const validatedData = validation.data;

    if (validatedData.bankName !== undefined)
      updateData.bank_name = validatedData.bankName;
    if (validatedData.cardName !== undefined)
      updateData.card_name = validatedData.cardName;
    if (validatedData.lastFourDigits !== undefined)
      updateData.last_four_digits = validatedData.lastFourDigits;
    if (validatedData.cardType !== undefined)
      updateData.card_type = validatedData.cardType;
    if (validatedData.network !== undefined)
      updateData.network = validatedData.network;
    if (validatedData.rewardType !== undefined)
      updateData.reward_type = validatedData.rewardType;
    if (validatedData.annualFee !== undefined)
      updateData.annual_fee = validatedData.annualFee;
    if (validatedData.currency !== undefined)
      updateData.currency = validatedData.currency;
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;
    if (validatedData.issueDate !== undefined)
      updateData.issue_date = validatedData.issueDate
        ? new Date(validatedData.issueDate)
        : undefined;
    if (validatedData.expiryDate !== undefined)
      updateData.expiry_date = validatedData.expiryDate
        ? new Date(validatedData.expiryDate)
        : undefined;
    if (validatedData.creditLimit !== undefined)
      updateData.credit_limit = validatedData.creditLimit;
    if (validatedData.availableCredit !== undefined)
      updateData.available_credit = validatedData.availableCredit;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: true, message: 'No data to update' },
        { status: 200 },
      );
    }

    // Update card
    const { data: card, error } = await supabaseAdmin
      .from('cards')
      .update(updateData)
      .eq('id', cardId)
      .eq('user_id', userId)
      .select(
        `
        *,
        card_benefits (*)
      `,
      )
      .single();

    if (error) {
      console.error('Supabase update card error:', error);
      throw new FinMatterError(
        'Failed to update card',
        'DB_UPDATE_FAILED',
        500,
        { error },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        card,
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

    console.error('Update card error:', error);
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
 * DELETE /api/cards/[id]
 * Soft delete card (set status to inactive)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
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

    // Soft delete by setting status to inactive
    const { data: card, error } = await supabaseAdmin
      .from('cards')
      .update({ status: 'inactive' })
      .eq('id', cardId)
      .eq('user_id', userId)
      .select('id, card_name, status')
      .single();

    if (error) {
      console.error('Supabase delete card error:', error);
      throw new FinMatterError(
        'Failed to delete card',
        'DB_UPDATE_FAILED',
        500,
        { error },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Card deleted successfully',
        card,
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

    console.error('Delete card error:', error);
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

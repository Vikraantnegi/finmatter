/**
 * Card API Endpoint (Individual Card)
 * GET /api/cards/:id - Get card by ID
 * PUT /api/cards/:id - Update card
 * DELETE /api/cards/:id - Delete card (soft delete)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { AppError } from '@/lib/errorHandler';
import { validateExpiry } from '@/lib/cardValidation';
import { z } from 'zod';
import type {
  DatabaseCard,
  DatabaseBank,
  DatabaseCardMetadata,
} from '@finmatter/types';

/**
 * Get authenticated user ID from request
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new AppError('INVALID_TOKEN', 'Invalid or expired token', 401);
  }

  return user.id;
}

/**
 * Request body schema for updating a card
 */
const UpdateCardSchema = z.object({
  cardHolderName: z.string().min(1).max(100).optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2000).max(2099).optional(),
  issueDate: z.string().optional(),
  billingDay: z.number().int().min(1).max(31).optional(),
  creditLimit: z.number().nonnegative().optional(),
  availableCredit: z.number().nonnegative().optional(),
  status: z.enum(['active', 'inactive', 'blocked', 'expired']).optional(),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * Verify that the card belongs to the authenticated user
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
    throw new AppError(
      'CARD_NOT_FOUND',
      'Card not found or access denied',
      404,
    );
  }

  return card;
}

/**
 * GET /api/cards/:id - Get card by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const cardId = params.id;

    // Verify ownership
    const card = await verifyCardOwnership(cardId, userId);

    // Fetch bank and card metadata
    let bankData: DatabaseBank | null = null;
    let cardMetadata: DatabaseCardMetadata | null = null;

    if (card.bank_id) {
      const { data: bank } = await supabaseAdmin
        .from('banks')
        .select('*')
        .eq('id', card.bank_id)
        .single();

      if (bank) {
        bankData = bank;
      }
    }

    if (card.card_metadata_id) {
      const { data: metadata } = await supabaseAdmin
        .from('cards_metadata')
        .select('*')
        .eq('id', card.card_metadata_id)
        .single();

      if (metadata) {
        cardMetadata = metadata;
      }
    }

    return createCorsResponse(
      {
        success: true,
        card: {
          id: card.id,
          lastFourDigits: card.last_four_digits,
          cardHolderName: card.card_holder_name,
          expiryMonth: card.expiry_month,
          expiryYear: card.expiry_year,
          bank: bankData
            ? {
                id: bankData.id,
                name: bankData.name,
                displayName: bankData.display_name,
                logoUrl: bankData.logo_url,
                logoWithNameUrl: bankData.logo_with_name_url,
                primaryColor: bankData.primary_color,
                secondaryColor: bankData.secondary_color,
              }
            : undefined,
          cardMetadata: cardMetadata
            ? {
                id: cardMetadata.id,
                cardName: cardMetadata.card_name,
                displayName: cardMetadata.display_name,
                cardType: cardMetadata.card_type,
                network: cardMetadata.network,
                rewardType: cardMetadata.reward_type,
                annualFee: Number(cardMetadata.annual_fee),
                joiningFee: Number(cardMetadata.joining_fee),
                primaryColor: cardMetadata.primary_color,
                secondaryColor: cardMetadata.secondary_color,
                cardLogoUrl: cardMetadata.card_logo_url,
                benefits: cardMetadata.benefits as any[],
                offers: cardMetadata.offers as any[],
                rewards: cardMetadata.rewards as any,
                milestones: cardMetadata.milestones as any[],
              }
            : undefined,
          detectedFromBin: card.detected_from_bin,
          binLookupSource: card.bin_lookup_source,
          status: card.status,
          issueDate: card.issue_date,
          billingDay: card.billing_day,
          creditLimit: card.credit_limit
            ? Number(card.credit_limit)
            : undefined,
          availableCredit: card.available_credit
            ? Number(card.available_credit)
            : undefined,
          createdAt: card.created_at,
          updatedAt: card.updated_at,
        },
      },
      {
        status: 200,
        origin: origin || undefined,
      },
    );
  } catch (error) {
    console.error('Get card error:', error);

    if (error instanceof AppError) {
      return createCorsResponse(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        {
          status: error.statusCode,
          origin: origin || undefined,
        },
      );
    }

    return createCorsResponse(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
      {
        status: 500,
        origin: origin || undefined,
      },
    );
  }
}

/**
 * PUT /api/cards/:id - Update card
 *
 * Note: Card number and CVV cannot be updated for security reasons
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const cardId = params.id;

    // Verify ownership
    await verifyCardOwnership(cardId, userId);

    // Parse and validate request body
    const body = await request.json();
    const validation = UpdateCardSchema.safeParse(body);

    if (!validation.success) {
      return createCorsResponse(
        {
          success: false,
          error: validation.error.errors[0]?.message || 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: validation.error.errors,
        },
        {
          status: 400,
          origin: origin || undefined,
        },
      );
    }

    const updateData = validation.data;

    // Validate expiry date if provided
    if (updateData.expiryMonth && updateData.expiryYear) {
      const expiryValidation = validateExpiry(
        updateData.expiryMonth,
        updateData.expiryYear,
      );

      if (!expiryValidation.valid) {
        return createCorsResponse(
          {
            success: false,
            error: expiryValidation.message || 'Invalid expiry date',
            code: 'INVALID_EXPIRY_DATE',
          },
          {
            status: 400,
            origin: origin || undefined,
          },
        );
      }
    }

    // Prepare update payload (only include provided fields)
    const updatePayload: Partial<DatabaseCard> = {};

    if (updateData.cardHolderName !== undefined) {
      updatePayload.card_holder_name = updateData.cardHolderName;
    }

    if (updateData.expiryMonth !== undefined) {
      updatePayload.expiry_month = updateData.expiryMonth;
    }

    if (updateData.expiryYear !== undefined) {
      updatePayload.expiry_year = updateData.expiryYear;
    }

    if (updateData.issueDate !== undefined) {
      updatePayload.issue_date = updateData.issueDate || null;
    }

    if (updateData.billingDay !== undefined) {
      updatePayload.billing_day = updateData.billingDay || null;
    }

    if (updateData.creditLimit !== undefined) {
      updatePayload.credit_limit = updateData.creditLimit || null;
    }

    if (updateData.availableCredit !== undefined) {
      updatePayload.available_credit = updateData.availableCredit || null;
    }

    if (updateData.status !== undefined) {
      updatePayload.status = updateData.status;
    }

    // Update card
    const { data: updatedCard, error: updateError } = await supabaseAdmin
      .from('cards')
      .update(updatePayload)
      .eq('id', cardId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError || !updatedCard) {
      console.error('Error updating card:', updateError);
      return createCorsResponse(
        {
          success: false,
          error: 'Failed to update card',
          code: 'CARD_UPDATE_ERROR',
        },
        {
          status: 500,
          origin: origin || undefined,
        },
      );
    }

    return createCorsResponse(
      {
        success: true,
        card: {
          id: updatedCard.id,
          lastFourDigits: updatedCard.last_four_digits,
          cardHolderName: updatedCard.card_holder_name,
          expiryMonth: updatedCard.expiry_month,
          expiryYear: updatedCard.expiry_year,
          status: updatedCard.status,
          issueDate: updatedCard.issue_date,
          billingDay: updatedCard.billing_day,
          creditLimit: updatedCard.credit_limit
            ? Number(updatedCard.credit_limit)
            : undefined,
          availableCredit: updatedCard.available_credit
            ? Number(updatedCard.available_credit)
            : undefined,
          updatedAt: updatedCard.updated_at,
        },
      },
      {
        status: 200,
        origin: origin || undefined,
      },
    );
  } catch (error) {
    console.error('Update card error:', error);

    if (error instanceof AppError) {
      return createCorsResponse(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        {
          status: error.statusCode,
          origin: origin || undefined,
        },
      );
    }

    return createCorsResponse(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
      {
        status: 500,
        origin: origin || undefined,
      },
    );
  }
}

/**
 * DELETE /api/cards/:id - Delete card (soft delete)
 * Sets status to 'inactive' instead of hard delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const cardId = params.id;

    // Verify ownership
    await verifyCardOwnership(cardId, userId);

    // Soft delete: set status to 'inactive'
    const { data: deletedCard, error: deleteError } = await supabaseAdmin
      .from('cards')
      .update({ status: 'inactive' })
      .eq('id', cardId)
      .eq('user_id', userId)
      .select()
      .single();

    if (deleteError || !deletedCard) {
      console.error('Error deleting card:', deleteError);
      return createCorsResponse(
        {
          success: false,
          error: 'Failed to delete card',
          code: 'CARD_DELETE_ERROR',
        },
        {
          status: 500,
          origin: origin || undefined,
        },
      );
    }

    return createCorsResponse(
      {
        success: true,
        message: 'Card deleted successfully',
        card: {
          id: deletedCard.id,
          status: deletedCard.status,
        },
      },
      {
        status: 200,
        origin: origin || undefined,
      },
    );
  } catch (error) {
    console.error('Delete card error:', error);

    if (error instanceof AppError) {
      return createCorsResponse(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        {
          status: error.statusCode,
          origin: origin || undefined,
        },
      );
    }

    return createCorsResponse(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
      {
        status: 500,
        origin: origin || undefined,
      },
    );
  }
}

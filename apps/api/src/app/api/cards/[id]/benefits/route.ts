/**
 * Card Benefits API Endpoint
 * GET /api/cards/[id]/benefits - Get benefits for a specific card
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';

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
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new FinMatterError('Invalid token', 'INVALID_TOKEN', 401);
  }

  return user.id;
}

/**
 * GET /api/cards/[id]/benefits
 * Get benefits for a specific card from database
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const cardId = params.id;

    // First, verify the card belongs to the user
    const { data: card, error: cardError } = await supabaseAdmin
      .from('cards')
      .select('id, card_metadata_id, bank_name, card_name')
      .eq('id', cardId)
      .eq('user_id', userId)
      .eq('deleted_at', null)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CARD_NOT_FOUND',
            message: 'Card not found or access denied',
          },
        },
        { status: 404 }
      );
    }

    // If card has metadata_id, fetch complete card metadata
    if (card.card_metadata_id) {
      const { data: cardMetadata, error: metadataError } = await supabaseAdmin
        .from('cards_metadata')
        .select('*')
        .eq('id', card.card_metadata_id)
        .eq('is_active', true)
        .single();

      if (metadataError) {
        console.error('Error fetching card metadata:', metadataError);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to fetch card metadata',
            },
          },
          { status: 500 }
        );
      }

      // Extract benefits from JSON and transform to API format
      const benefits = cardMetadata?.benefits || [];
      const transformedBenefits = benefits.map((benefit: any, index: number) => ({
        id: `${cardMetadata.id}-benefit-${index}`,
        category: benefit.category,
        description: benefit.description,
        value: benefit.value,
        rewardRate: benefit.rewardRate,
        rewardType: benefit.rewardType,
        rewardCap: benefit.rewardCap,
        capPeriod: benefit.capPeriod,
        conditions: benefit.conditions || [],
        isActive: true,
      }));

      return NextResponse.json(
        {
          success: true,
          data: {
            cardId: card.id,
            cardName: card.card_name,
            bankName: card.bank_name,
            benefits: transformedBenefits,
            // Additional metadata from cards_metadata
            metadata: {
              cardType: cardMetadata.card_type,
              network: cardMetadata.network,
              rewardType: cardMetadata.reward_type,
              annualFee: cardMetadata.annual_fee,
              primaryColor: cardMetadata.primary_color,
              secondaryColor: cardMetadata.secondary_color,
              description: cardMetadata.description,
              rewardRules: cardMetadata.reward_rules,
            },
          },
        },
        {
          status: 200,
          headers: createCorsResponse(origin || undefined).headers,
        }
      );
    }

    // If no metadata_id, return empty benefits (custom card)
    return NextResponse.json(
      {
        success: true,
        data: {
          cardId: card.id,
          cardName: card.card_name,
          bankName: card.bank_name,
          benefits: [],
        },
      },
      {
        status: 200,
        headers: createCorsResponse(origin || undefined).headers,
      }
    );

  } catch (error: any) {
    console.error('Get card benefits error:', error);

    if (error instanceof FinMatterError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        {
          status: error.statusCode,
          headers: createCorsResponse(origin || undefined).headers,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      {
        status: 500,
        headers: createCorsResponse(origin || undefined).headers,
      }
    );
  }
}

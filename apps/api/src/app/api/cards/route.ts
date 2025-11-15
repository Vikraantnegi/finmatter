/**
 * Cards API Endpoint
 * POST /api/cards - Add new card
 * GET /api/cards - List user's cards
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { AppError } from '@/lib/errorHandler';
import { lookupBIN } from '@/lib/binLookup';
import {
  validateCardNumber,
  validateCardFormat,
  validateExpiry,
  extractBIN,
  detectNetwork,
  extractLastFour as extractLastFourDigits,
} from '@/lib/cardValidation';
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
 * Request body schema for adding a card
 */
const AddCardSchema = z.object({
  cardNumber: z
    .string()
    .min(13, 'Card number must be at least 13 digits')
    .max(19, 'Card number must be at most 19 digits')
    .regex(/^\d+$/, 'Card number must contain only digits'),
  cardHolderName: z.string().min(1, 'Card holder name is required').max(100),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int().min(2000).max(2099),
  // Optional fields that might be pre-filled from BIN lookup
  bankId: z.string().uuid().optional(),
  cardMetadataId: z.string().uuid().optional(),
  issueDate: z.string().optional(),
  billingDay: z.number().int().min(1).max(31).optional(),
  creditLimit: z.number().nonnegative().optional(),
  availableCredit: z.number().nonnegative().optional(),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * POST /api/cards - Add new card
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    // Authenticate user
    const userId = await getAuthenticatedUserId(request);

    // Parse and validate request body
    const body = await request.json();
    const validation = AddCardSchema.safeParse(body);

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

    const {
      cardNumber,
      cardHolderName,
      expiryMonth,
      expiryYear,
      bankId: providedBankId,
      cardMetadataId: providedCardMetadataId,
      issueDate,
      billingDay,
      creditLimit,
      availableCredit,
    } = validation.data;

    // Step 1: Validate card number (Luhn algorithm + format)
    if (!validateCardNumber(cardNumber)) {
      return createCorsResponse(
        {
          success: false,
          error: 'Invalid card number (Luhn check failed)',
          code: 'INVALID_CARD_NUMBER',
        },
        {
          status: 400,
          origin: origin || undefined,
        },
      );
    }

    const formatValidation = validateCardFormat(cardNumber);
    if (!formatValidation.valid) {
      return createCorsResponse(
        {
          success: false,
          error: formatValidation.message || 'Invalid card format',
          code: 'INVALID_CARD_FORMAT',
        },
        {
          status: 400,
          origin: origin || undefined,
        },
      );
    }

    // Step 2: Validate expiry date
    const expiryValidation = validateExpiry(expiryMonth, expiryYear);
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

    // Step 3: Extract BIN and run lookup
    const bin = extractBIN(cardNumber);
    if (!bin) {
      return createCorsResponse(
        {
          success: false,
          error: 'Failed to extract BIN from card number',
          code: 'BIN_EXTRACTION_ERROR',
        },
        {
          status: 400,
          origin: origin || undefined,
        },
      );
    }

    let detectedBankId = providedBankId;
    let detectedCardMetadataId = providedCardMetadataId;
    let detectedNetworkFromBin: string | null = null;
    let detectedCardType: string | null = null;
    let binLookupSource: 'internal' | 'binlist_api' | 'manual' = 'manual';
    let detectedFromBin = false;

    // Perform BIN lookup
    const binLookupResult = await lookupBIN(bin);
    if (binLookupResult) {
      detectedFromBin = true;
      binLookupSource = binLookupResult.source;
      detectedBankId = binLookupResult.bankId || detectedBankId;
      detectedCardMetadataId =
        binLookupResult.cardMetadataId || detectedCardMetadataId;
      detectedNetworkFromBin = binLookupResult.network;
      detectedCardType = binLookupResult.cardType;

      // Use detected network if available, otherwise use format validation
      if (!detectedNetworkFromBin && formatValidation.network) {
        detectedNetworkFromBin = formatValidation.network;
      }
    } else {
      // Use network from format validation if BIN lookup failed
      if (formatValidation.network) {
        detectedNetworkFromBin = formatValidation.network;
      }
    }

    // Step 5: Prepare card data
    const lastFourDigits =
      extractLastFourDigits(cardNumber) ||
      cardNumber.replace(/\D/g, '').slice(-4);
    const detectedNetwork = detectNetwork(cardNumber);

    // Step 6: Create card record
    const cardData: Partial<DatabaseCard> = {
      user_id: userId,
      bank_id: detectedBankId || null,
      bank_name: null, // Legacy field, prefer bank_id
      card_metadata_id: detectedCardMetadataId || null,
      card_name: null,
      card_holder_name: cardHolderName,
      last_four_digits: lastFourDigits,
      card_type:
        (detectedCardType as any) || formatValidation.cardType || 'credit',
      network:
        (detectedNetworkFromBin as any) || (detectedNetwork as any) || 'visa', // Fallback to visa
      reward_type: null,
      annual_fee: 0,
      currency: 'INR',
      status: 'active',
      expiry_month: expiryMonth,
      expiry_year: expiryYear,
      detected_from_bin: detectedFromBin,
      bin_lookup_source: binLookupSource,
      issue_date: issueDate || null,
      billing_day: billingDay || null,
      credit_limit: creditLimit || null,
      available_credit: availableCredit || null,
    };

    const { data: newCard, error: insertError } = await supabaseAdmin
      .from('cards')
      .insert(cardData)
      .select()
      .single();

    if (insertError || !newCard) {
      console.error('Error creating card:', insertError);
      return createCorsResponse(
        {
          success: false,
          error: 'Failed to create card',
          code: 'CARD_CREATION_ERROR',
        },
        {
          status: 500,
          origin: origin || undefined,
        },
      );
    }

    // Step 7: Fetch card metadata for preview (join with banks and cards_metadata)
    let bankData: DatabaseBank | null = null;
    let cardMetadata: DatabaseCardMetadata | null = null;

    if (newCard.bank_id) {
      const { data: bank } = await supabaseAdmin
        .from('banks')
        .select('*')
        .eq('id', newCard.bank_id)
        .single();

      if (bank) {
        bankData = bank;
      }
    }

    if (newCard.card_metadata_id) {
      const { data: metadata } = await supabaseAdmin
        .from('cards_metadata')
        .select('*')
        .eq('id', newCard.card_metadata_id)
        .single();

      if (metadata) {
        cardMetadata = metadata;
      }
    }

    // Step 8: Return response with preview data
    return createCorsResponse(
      {
        success: true,
        card: {
          id: newCard.id,
          lastFourDigits: newCard.last_four_digits,
          cardHolderName: newCard.card_holder_name,
          expiryMonth: newCard.expiry_month,
          expiryYear: newCard.expiry_year,
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
          detectedFromBin: newCard.detected_from_bin,
          binLookupSource: newCard.bin_lookup_source,
          status: newCard.status,
          createdAt: newCard.created_at,
        },
      },
      {
        status: 201,
        origin: origin || undefined,
      },
    );
  } catch (error) {
    console.error('Add card error:', error);

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
 * GET /api/cards - List user's cards
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    // Authenticate user
    const userId = await getAuthenticatedUserId(request);

    // Fetch user's cards with joins to banks and cards_metadata
    const { data: cards, error } = await supabaseAdmin
      .from('cards')
      .select(
        `
        *,
        banks!cards_bank_id_fkey (
          id,
          name,
          display_name,
          logo_url,
          logo_with_name_url,
          primary_color,
          secondary_color
        ),
        cards_metadata!cards_card_metadata_id_fkey (
          id,
          card_name,
          display_name,
          card_type,
          network,
          reward_type,
          annual_fee,
          joining_fee,
          primary_color,
          secondary_color,
          card_logo_url,
          benefits,
          offers,
          rewards,
          milestones
        )
      `,
      )
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cards:', error);
      return createCorsResponse(
        {
          success: false,
          error: 'Failed to fetch cards',
          code: 'FETCH_CARDS_ERROR',
        },
        {
          status: 500,
          origin: origin || undefined,
        },
      );
    }

    // Transform cards data
    const cardsList = (cards || []).map(card => {
      const bank = (card as any).banks;
      const metadata = (card as any).cards_metadata;

      return {
        id: card.id,
        lastFourDigits: card.last_four_digits,
        cardHolderName: card.card_holder_name,
        expiryMonth: card.expiry_month,
        expiryYear: card.expiry_year,
        bank: bank
          ? {
              id: bank.id,
              name: bank.name,
              displayName: bank.display_name,
              logoUrl: bank.logo_url,
              logoWithNameUrl: bank.logo_with_name_url,
              primaryColor: bank.primary_color,
              secondaryColor: bank.secondary_color,
            }
          : undefined,
        cardMetadata: metadata
          ? {
              id: metadata.id,
              cardName: metadata.card_name,
              displayName: metadata.display_name,
              cardType: metadata.card_type,
              network: metadata.network,
              rewardType: metadata.reward_type,
              annualFee: Number(metadata.annual_fee),
              joiningFee: Number(metadata.joining_fee),
              primaryColor: metadata.primary_color,
              secondaryColor: metadata.secondary_color,
              cardLogoUrl: metadata.card_logo_url,
              benefits: metadata.benefits as any[],
              offers: metadata.offers as any[],
              rewards: metadata.rewards as any,
              milestones: metadata.milestones as any[],
            }
          : undefined,
        status: card.status,
        createdAt: card.created_at,
        updatedAt: card.updated_at,
      };
    });

    return createCorsResponse(
      {
        success: true,
        cards: cardsList,
      },
      {
        status: 200,
        origin: origin || undefined,
      },
    );
  } catch (error) {
    console.error('List cards error:', error);

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

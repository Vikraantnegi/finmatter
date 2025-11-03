/**
 * BIN Lookup API Endpoint
 * GET /api/cards/bin-lookup?bin=XXXXXX
 *
 * Real-time BIN lookup for card preview during card entry
 */

import { NextRequest } from 'next/server';
import { lookupBIN } from '@/lib/binLookup';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { AppError } from '@/lib/errorHandler';
import { z } from 'zod';

/**
 * Query parameter schema
 */
const BinLookupQuerySchema = z.object({
  bin: z.string().regex(/^\d{6}$/, 'BIN must be exactly 6 digits'),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * GET /api/cards/bin-lookup?bin=XXXXXX
 * Lookup card information from BIN (Bank Identification Number)
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const binParam = searchParams.get('bin');

    if (!binParam) {
      return createCorsResponse(
        {
          success: false,
          error: 'BIN parameter is required',
          code: 'MISSING_BIN_PARAMETER',
        },
        {
          status: 400,
          origin: origin || undefined,
        },
      );
    }

    // Validate BIN format
    const validation = BinLookupQuerySchema.safeParse({ bin: binParam });

    if (!validation.success) {
      return createCorsResponse(
        {
          success: false,
          error: validation.error.errors[0]?.message || 'Invalid BIN format',
          code: 'INVALID_BIN_FORMAT',
        },
        {
          status: 400,
          origin: origin || undefined,
        },
      );
    }

    const { bin } = validation.data;

    // Perform BIN lookup
    const lookupResult = await lookupBIN(bin);

    if (!lookupResult) {
      return createCorsResponse(
        {
          success: true,
          detected: false,
          message: 'No card information found for this BIN',
        },
        {
          status: 200,
          origin: origin || undefined,
        },
      );
    }

    // Return preview data
    return createCorsResponse(
      {
        success: true,
        detected: true,
        bank: lookupResult.bankId
          ? {
              id: lookupResult.bankId,
              name: lookupResult.bankName,
            }
          : undefined,
        network: lookupResult.network,
        cardType: lookupResult.cardType,
        country: lookupResult.country,
        cardMetadata: lookupResult.detectedCard
          ? {
              id: lookupResult.detectedCard.id,
              displayName: lookupResult.detectedCard.displayName,
              bank: lookupResult.detectedCard.bank,
              network: lookupResult.detectedCard.network,
              benefits: lookupResult.detectedCard.benefits || [],
              offers: lookupResult.detectedCard.offers || [],
            }
          : undefined,
        source: lookupResult.source,
      },
      {
        status: 200,
        origin: origin || undefined,
      },
    );
  } catch (error) {
    console.error('BIN lookup error:', error);

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

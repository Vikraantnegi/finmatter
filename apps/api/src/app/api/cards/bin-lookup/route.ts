/**
 * BIN Lookup API Endpoint
 * GET /api/cards/bin-lookup?bin=40782345
 * Looks up card metadata from BIN (Bank Identification Number)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
// import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * GET /api/cards/bin-lookup
 * Lookup card metadata from BIN
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    // Parse query parameters
    const url = new URL(request.url);
    const bin = url.searchParams.get('bin');

    if (!bin) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'BIN parameter is required',
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Validate BIN format (should be 6-8 digits)
    const cleanBin = bin.replace(/\D/g, '');
    if (cleanBin.length < 6 || cleanBin.length > 8) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'BIN must be 6-8 digits',
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Query bin_ranges table to find matching BIN
    const { data: binRange, error: binError } = await supabaseAdmin
      .from('bin_ranges')
      .select('*')
      .lte('bin_start', cleanBin)
      .gte('bin_end', cleanBin)
      .eq('is_active', true)
      .single();

    if (binError || !binRange) {
      // BIN not found - return generic response
      return createCorsResponse(
        {
          success: true,
          data: {
            found: false,
            bankName: null,
            cardBrand: null,
            network: null,
            cardMetadata: null,
          },
        },
        { origin: origin || undefined },
      );
    }

    // If card_metadata_id exists, fetch full metadata
    let cardMetadata = null;
    if (binRange.card_metadata_id) {
      const { data: metadata, error: metadataError } = await supabaseAdmin
        .from('cards_metadata')
        .select('*')
        .eq('id', binRange.card_metadata_id)
        .eq('is_active', true)
        .single();

      if (!metadataError && metadata) {
        cardMetadata = metadata;
      }
    }

    // Return response
    return createCorsResponse(
      {
        success: true,
        data: {
          found: true,
          bankName: binRange.bank_name,
          cardBrand: binRange.card_brand,
          network: binRange.card_network,
          cardType: binRange.card_type,
          countryCode: binRange.country_code,
          cardMetadataId: binRange.card_metadata_id,
          cardMetadata,
        },
      },
      { origin: origin || undefined },
    );
  } catch (error) {
    console.error('BIN lookup error:', error);

    return createCorsResponse(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to lookup BIN',
        },
      },
      { status: 500, origin: origin || undefined },
    );
  }
}

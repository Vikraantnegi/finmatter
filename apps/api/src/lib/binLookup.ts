/**
 * BIN Lookup Service
 *
 * Looks up card information from BIN (Bank Identification Number)
 * Tries internal database first, falls back to BinList API
 */

import axios from 'axios';
import { supabaseAdmin } from './supabase/client';
import type {
  Bank,
  Network,
  BinLookupSource,
  CardNetwork,
  CardType,
} from '@finmatter/types';

const BIN_CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes
const BANK_CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

type BinCacheEntry = {
  result: BinLookupResult | null;
  expiresAt: number;
};

const binCache = new Map<string, BinCacheEntry>();

type BankCacheEntry = {
  id: string;
  slug: string;
  displaySlug: string;
};

let bankCache: BankCacheEntry[] | null = null;
let bankCacheExpiresAt = 0;

function normalizeBankName(name?: string | null): string | null {
  if (!name) {
    return null;
  }
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function getBankCache(): Promise<BankCacheEntry[]> {
  const now = Date.now();
  if (bankCache && now < bankCacheExpiresAt) {
    return bankCache;
  }

  const { data, error } = await supabaseAdmin
    .from('banks')
    .select('id,name,display_name')
    .eq('is_active', true);

  if (error || !data) {
    bankCache = [];
  } else {
    bankCache = data.map(bank => ({
      id: bank.id,
      slug: normalizeBankName(bank.name) || '',
      displaySlug:
        normalizeBankName(bank.display_name) ||
        normalizeBankName(bank.name) ||
        '',
    }));
  }

  bankCacheExpiresAt = now + BANK_CACHE_TTL_MS;
  return bankCache;
}

async function resolveBankIdByName(name: string): Promise<string | null> {
  const normalized = normalizeBankName(name);
  if (!normalized) {
    return null;
  }

  const banks = await getBankCache();
  const match = banks.find(
    bank =>
      bank.slug === normalized ||
      (bank.displaySlug && bank.displaySlug === normalized),
  );

  return match?.id || null;
}

function getCachedBinResult(bin: string): BinLookupResult | null | undefined {
  const cached = binCache.get(bin);
  if (!cached) {
    return undefined;
  }

  if (cached.expiresAt < Date.now()) {
    binCache.delete(bin);
    return undefined;
  }

  return cached.result;
}

function setCachedBinResult(bin: string, result: BinLookupResult | null) {
  binCache.set(bin, {
    result,
    expiresAt: Date.now() + BIN_CACHE_TTL_MS,
  });
}

/**
 * BIN Lookup Result
 */
export interface BinLookupResult {
  bankId?: string;
  bankName?: string;
  cardMetadataId?: string;
  cardName?: string;
  cardDisplayName?: string;
  network: CardNetwork;
  cardType: CardType;
  country: string;
  source: BinLookupSource;
  detectedCard?: {
    id: string;
    displayName: string;
    bank: Bank;
    network: Network;
    benefits?: any[];
    offers?: any[];
  };
}

/**
 * BinList API Response (external API)
 */
interface BinListApiResponse {
  number?: {
    length?: number;
    luhn?: boolean;
  };
  scheme?: string; // visa, mastercard, etc.
  type?: string; // debit, credit
  brand?: string;
  country?: {
    numeric?: string;
    alpha2?: string;
    name?: string;
    emoji?: string;
    currency?: string;
    latitude?: number;
    longitude?: number;
  };
  bank?: {
    name?: string;
    url?: string;
    phone?: string;
    city?: string;
  };
}

/**
 * Internal BIN lookup from database
 *
 * Query logic:
 * - Find entries where bin_start <= bin <= bin_end
 * - Priority: entries with card_metadata_id first (specific card detected)
 * - Then entries with only bank_id (bank detected, card unknown)
 */
export async function lookupBINInternal(
  bin: string,
): Promise<BinLookupResult | null> {
  if (!bin || bin.length !== 6 || !/^\d{6}$/.test(bin)) {
    return null;
  }

  try {
    // Convert BIN to number for range comparison
    const binNumber = parseInt(bin, 10);

    // Query bin_lookup table with priority:
    // 1. Entries with card_metadata_id (specific card)
    // 2. Entries with only bank_id (bank only)
    //
    // We need to find entries where: bin_start <= bin <= bin_end
    // Since PostgreSQL doesn't support direct range queries easily with Supabase client,
    // we'll fetch all potential matches and filter in JavaScript

    const { data: allMatches, error } = await supabaseAdmin
      .from('bin_lookup')
      .select(
        `
        id,
        bin_start,
        bin_end,
        bank_id,
        card_metadata_id,
        card_type,
        network,
        country,
        banks!bin_lookup_bank_id_fkey (
          id,
          name,
          display_name,
          logo_url,
          logo_with_name_url,
          primary_color,
          secondary_color
        ),
        cards_metadata!bin_lookup_card_metadata_id_fkey (
          id,
          card_name,
          display_name,
          bank_id,
          network,
          benefits,
          offers
        )
      `,
      )
      .eq('is_active', true)
      .lte('bin_start', bin); // bin_start <= bin (optimization: filter early)

    if (error || !allMatches || allMatches.length === 0) {
      return null;
    }

    // Filter for entries where bin falls within range
    const validMatches = allMatches.filter(entry => {
      const binStart = parseInt(entry.bin_start, 10);
      const binEnd = entry.bin_end ? parseInt(entry.bin_end, 10) : binStart;

      return binNumber >= binStart && binNumber <= binEnd;
    });

    if (validMatches.length === 0) {
      return null;
    }

    // Sort by priority: card_metadata_id present first, then by bank_id
    validMatches.sort((a, b) => {
      if (a.card_metadata_id && !b.card_metadata_id) return -1;
      if (!a.card_metadata_id && b.card_metadata_id) return 1;
      return 0;
    });

    const data = validMatches[0];

    if (!data) {
      return null;
    }

    // Verify BIN falls within range
    const binStart = parseInt(data.bin_start, 10);
    const binEnd = data.bin_end ? parseInt(data.bin_end, 10) : binStart;

    if (binNumber < binStart || binNumber > binEnd) {
      return null;
    }

    const bank = data.banks as any;
    const cardMetadata = data.cards_metadata as any;

    const result: BinLookupResult = {
      bankId: data.bank_id,
      bankName: bank?.display_name || bank?.name,
      cardMetadataId: data.card_metadata_id || undefined,
      cardName: cardMetadata?.card_name,
      cardDisplayName: cardMetadata?.display_name,
      network: data.network as CardNetwork,
      cardType: data.card_type as CardType,
      country: data.country || 'IN',
      source: 'internal',
    };

    // Add detected card info if available
    if (cardMetadata && bank) {
      result.detectedCard = {
        id: cardMetadata.id,
        displayName: cardMetadata.display_name,
        bank: {
          id: bank.id,
          name: bank.name,
          displayName: bank.display_name,
          logoUrl: bank.logo_url,
          logoWithNameUrl: bank.logo_with_name_url,
          primaryColor: bank.primary_color,
          secondaryColor: bank.secondary_color,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
        network: {
          id: '',
          name: cardMetadata.network,
          displayName: '',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
        benefits: cardMetadata.benefits || [],
        offers: cardMetadata.offers || [],
      };
    } else if (bank) {
      // Bank detected but no specific card
      result.detectedCard = {
        id: '',
        displayName: '',
        bank: {
          id: bank.id,
          name: bank.name,
          displayName: bank.display_name,
          logoUrl: bank.logo_url,
          logoWithNameUrl: bank.logo_with_name_url,
          primaryColor: bank.primary_color,
          secondaryColor: bank.secondary_color,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
        network: {
          id: '',
          name: data.network,
          displayName: '',
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
      };
    }

    setCachedBinResult(bin, result);
    return result;
  } catch (error) {
    console.error('Internal BIN lookup error:', error);
    return null;
  }
}

/**
 * External BIN lookup using BinList API
 *
 * Documentation: https://binlist.net/
 * Free tier: 10 requests/minute
 */
export async function lookupBINExternal(
  bin: string,
): Promise<BinLookupResult | null> {
  if (!bin || bin.length !== 6 || !/^\d{6}$/.test(bin)) {
    return null;
  }

  try {
    const response = await axios.get<BinListApiResponse>(
      `https://lookup.binlist.net/${bin}`,
      {
        timeout: 5000,
        headers: {
          'Accept-Version': '3',
          Accept: 'application/json',
        },
      },
    );

    if (!response.data) {
      return null;
    }

    const data = response.data;

    // Map BinList API response to our format
    const network = mapNetworkFromBinList(data.scheme);
    const cardType: CardType = mapCardTypeFromBinList(data.type) || 'credit';

    if (!network) {
      return null;
    }

    const result: BinLookupResult = {
      bankName: data.bank?.name || undefined,
      network,
      cardType,
      country: data.country?.alpha2 || 'IN',
      source: 'binlist_api',
    };

    return result;
  } catch (error: any) {
    // Handle rate limiting (429) or other errors
    if (error.response?.status === 429) {
      console.warn('BinList API rate limit exceeded');
    } else if (error.response?.status === 404) {
      // BIN not found in BinList database
      return null;
    } else {
      console.error('BinList API error:', error.message);
    }
    return null;
  }
}

/**
 * Map BinList API network to our CardNetwork type
 */
function mapNetworkFromBinList(scheme?: string): CardNetwork | null {
  if (!scheme) {
    return null;
  }

  const normalized = scheme.toLowerCase();

  switch (normalized) {
    case 'visa':
      return 'visa';
    case 'mastercard':
      return 'mastercard';
    case 'amex':
    case 'american express':
      return 'amex';
    case 'discover':
      return 'discover';
    case 'diners':
    case 'diners club':
      return 'diners';
    default:
      // BinList doesn't support RuPay, so return null
      return null;
  }
}

/**
 * Map BinList API card type to our CardType
 */
function mapCardTypeFromBinList(type?: string): CardType | null {
  if (!type) {
    return null;
  }

  const normalized = type.toLowerCase();

  switch (normalized) {
    case 'credit':
      return 'credit';
    case 'debit':
      return 'debit';
    case 'prepaid':
      return 'prepaid';
    default:
      return 'credit'; // Default assumption
  }
}

/**
 * Cache external BIN lookup result to database
 *
 * Stores the result from BinList API to bin_lookup table
 * for future fast internal lookups
 */
export async function cacheBinLookup(
  bin: string,
  result: BinLookupResult,
): Promise<void> {
  if (!result.bankId && !result.bankName) {
    // Can't cache without bank info
    return;
  }

  try {
    // First, try to find matching bank by name
    let bankId = result.bankId;

    if (!bankId && result.bankName) {
      const resolved = await resolveBankIdByName(result.bankName);
      bankId = resolved || undefined;
    }

    // If we found a bank, cache the BIN lookup
    if (bankId) {
      await supabaseAdmin.from('bin_lookup').insert({
        bin_start: bin,
        bin_end: bin, // Single BIN, not a range
        bank_id: bankId,
        card_metadata_id: result.cardMetadataId || null,
        card_type: result.cardType,
        network: result.network,
        country: result.country || 'IN',
        is_active: true,
      });

      result.bankId = bankId;
      // BIN lookup result cached for future use
    }
  } catch (error) {
    // Don't throw - caching is best effort
    console.error('Failed to cache BIN lookup:', error);
  }
}

/**
 * Main BIN lookup function
 *
 * Strategy:
 * 1. Try internal lookup first (fast, from our database)
 * 2. If not found, try external BinList API (slower, rate-limited)
 * 3. If external succeeds, cache it for future use
 * 4. Return result with source indicator
 */
export async function lookupBIN(bin: string): Promise<BinLookupResult | null> {
  if (!bin || bin.length !== 6 || !/^\d{6}$/.test(bin)) {
    return null;
  }

  const cached = getCachedBinResult(bin);
  if (cached !== undefined) {
    return cached;
  }

  // Step 1: Try internal lookup
  const internalResult = await lookupBINInternal(bin);
  if (internalResult) {
    setCachedBinResult(bin, internalResult);
    return internalResult;
  }

  // Step 2: Try external BinList API
  const externalResult = await lookupBINExternal(bin);
  if (externalResult) {
    // Step 3: Cache external result for future use
    await cacheBinLookup(bin, externalResult);
    setCachedBinResult(bin, externalResult);
    return externalResult;
  }

  // No result found
  setCachedBinResult(bin, null);
  return null;
}

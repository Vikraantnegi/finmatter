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

export async function resolveBankIdByName(
  name: string,
): Promise<string | null> {
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
  network: CardNetwork | null; // Nullable - may not be detected
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

    // Query strategy:
    // 1. First try exact match (bin_start = bin AND bin_end = bin) - most common case
    // 2. If no exact match, try range matches (bin_start <= bin AND (bin_end IS NULL OR bin_end >= bin))
    // Since bin_start and bin_end are strings, string comparison works for 6-digit BINs

    // Try exact match first (fastest)
    const { data: exactMatch, error: exactError } = await supabaseAdmin
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
      .eq('bin_start', bin)
      .eq('bin_end', bin)
      .maybeSingle();

    if (exactMatch && !exactError) {
      console.log(
        `✅ [BIN Lookup] Found exact match for BIN ${bin} in database`,
      );
      // Process exact match (same logic as below)
      const bank = exactMatch.banks as any;
      const cardMetadata = exactMatch.cards_metadata as any;
      const result: BinLookupResult = {
        bankId: exactMatch.bank_id,
        bankName: bank?.display_name || bank?.name,
        cardMetadataId: exactMatch.card_metadata_id || undefined,
        cardName: cardMetadata?.card_name,
        cardDisplayName: cardMetadata?.display_name,
        network: (exactMatch.network as CardNetwork) || null,
        cardType: exactMatch.card_type as CardType,
        country: exactMatch.country || 'IN',
        source: 'internal',
      };
      // Add detected card info if available (same logic as below)
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
            name: exactMatch.network,
            displayName: '',
            isActive: true,
            createdAt: '',
            updatedAt: '',
          },
        };
      }
      setCachedBinResult(bin, result);
      return result;
    }

    // If no exact match, try range matches
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
      .lte('bin_start', bin); // bin_start <= bin (string comparison works for 6-digit BINs)

    if (error) {
      console.error('❌ [BIN Lookup] Database query error:', error);
      return null;
    }

    if (!allMatches || allMatches.length === 0) {
      console.log(
        `ℹ️ [BIN Lookup] No entries found in bin_lookup table for BIN ${bin}`,
      );
      return null;
    }

    // Filter for entries where bin falls within range
    // For exact match: bin_start = bin_end = bin (all as strings)
    // For range: bin_start <= bin <= bin_end (numeric comparison)
    const validMatches = allMatches.filter(entry => {
      const binStart = parseInt(entry.bin_start, 10);
      const binEnd = entry.bin_end ? parseInt(entry.bin_end, 10) : binStart;

      const inRange = binNumber >= binStart && binNumber <= binEnd;
      if (inRange) {
        console.log(
          `✅ [BIN Lookup] BIN ${bin} (${binNumber}) matches range [${binStart}, ${binEnd}]`,
        );
      }
      return inRange;
    });

    if (validMatches.length === 0) {
      console.log(
        `ℹ️ [BIN Lookup] BIN ${bin} (${binNumber}) not in any valid range from ${allMatches.length} potential matches`,
      );
      return null;
    }

    console.log(
      `✅ [BIN Lookup] Found ${validMatches.length} valid match(es) for BIN ${bin}`,
    );

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
      network: (data.network as CardNetwork) || null,
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
    console.log(`🌐 [BIN Lookup] Calling BinList API for BIN ${bin}...`);
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
      console.log(
        `⚠️ [BIN Lookup] BinList API returned empty response for BIN ${bin}`,
      );
      return null;
    }

    const data = response.data;
    console.log(`📥 [BIN Lookup] BinList API response for BIN ${bin}:`, {
      scheme: data.scheme || 'null',
      type: data.type || 'null',
      brand: data.brand || 'null',
      bankName: data.bank?.name || 'null',
      country: data.country?.alpha2 || 'null',
    });

    // Map BinList API response to our format
    const network = mapNetworkFromBinList(data.scheme);
    const cardType: CardType = mapCardTypeFromBinList(data.type) || 'credit';

    console.log(`🔄 [BIN Lookup] Mapped BinList response for BIN ${bin}:`, {
      network: network || 'null',
      cardType,
      bankName: data.bank?.name || 'null',
      country: data.country?.alpha2 || 'IN',
    });

    // Return result even if network is null - we want to cache it to avoid repeated API calls
    // The cacheBinLookup function will handle null network values
    const result: BinLookupResult = {
      bankName: data.bank?.name || undefined,
      network: network || null, // Allow null network
      cardType,
      country: data.country?.alpha2 || 'IN',
      source: 'binlist_api',
    };

    return result;
  } catch (error: any) {
    // Handle rate limiting (429) or other errors
    if (error.response?.status === 429) {
      console.warn(
        `⚠️ [BIN Lookup] BinList API rate limit exceeded for BIN ${bin}`,
      );
    } else if (error.response?.status === 404) {
      // BIN not found in BinList database
      console.log(`ℹ️ [BIN Lookup] BIN ${bin} not found in BinList database`);
      return null;
    } else {
      console.error(
        `❌ [BIN Lookup] BinList API error for BIN ${bin}:`,
        error.message,
      );
      if (error.response) {
        console.error(
          `❌ [BIN Lookup] Response status: ${error.response.status}`,
        );
        console.error(`❌ [BIN Lookup] Response data:`, error.response.data);
      }
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
  // Cache ALL external lookups to avoid hitting the API repeatedly for the same BIN
  // This is global (not user-level) to prevent rate limits
  // Even if we don't have network or bank info, cache what we have to avoid API calls
  try {
    // First, try to find matching bank by name
    let bankId = result.bankId;

    if (!bankId && result.bankName) {
      const resolved = await resolveBankIdByName(result.bankName);
      bankId = resolved || undefined;
    }

    // Check if BIN already exists (exact match: bin_start = bin_end = bin)
    // OR if bin falls within any existing range
    const { data: existingExact } = await supabaseAdmin
      .from('bin_lookup')
      .select('id')
      .eq('bin_start', bin)
      .eq('bin_end', bin)
      .eq('is_active', true)
      .maybeSingle();

    if (existingExact) {
      console.log(
        `ℹ️ [BIN Lookup] BIN ${bin} already exists in cache (exact match), skipping insert`,
      );
      return;
    }

    // Also check if bin falls within any existing range
    const binNum = parseInt(bin, 10);
    const { data: existingRanges } = await supabaseAdmin
      .from('bin_lookup')
      .select('id, bin_start, bin_end')
      .eq('is_active', true)
      .lte('bin_start', bin)
      .limit(100); // Reasonable limit

    if (existingRanges) {
      const inRange = existingRanges.some(entry => {
        const start = parseInt(entry.bin_start, 10);
        const end = entry.bin_end ? parseInt(entry.bin_end, 10) : start;
        return binNum >= start && binNum <= end;
      });

      if (inRange) {
        console.log(
          `ℹ️ [BIN Lookup] BIN ${bin} already covered by existing range in cache, skipping insert`,
        );
        return;
      }
    }

    // Cache the BIN lookup - use default values if missing to avoid API calls
    // Prepare insert data with explicit nulls for optional fields
    // This works if the database schema allows nulls (which it should after migration)
    const insertData: any = {
      bin_start: bin,
      bin_end: bin, // Single BIN, not a range
      bank_id: bankId || null, // Explicit null if not available
      card_metadata_id: result.cardMetadataId || null, // Explicit null if not available
      card_type: result.cardType || 'credit',
      network: result.network || null, // Explicit null if not available
      country: result.country || 'IN',
      is_active: true,
    };

    console.log(`💾 [BIN Lookup] Attempting to cache BIN ${bin} with data:`, {
      bin_start: insertData.bin_start,
      bin_end: insertData.bin_end,
      bank_id: insertData.bank_id || 'null (omitted)',
      card_metadata_id: insertData.card_metadata_id || 'null (omitted)',
      network: insertData.network || 'null (omitted)',
      card_type: insertData.card_type,
      country: insertData.country,
    });

    let { data: insertedData, error: insertError } = await supabaseAdmin
      .from('bin_lookup')
      .insert(insertData)
      .select();

    // If insert failed due to NOT NULL constraint, try with explicit nulls
    // This handles the case where the database schema requires fields but allows nulls
    if (insertError && insertError.code === '23502') {
      console.log(
        `⚠️ [BIN Lookup] Insert failed with NOT NULL constraint, retrying with explicit nulls...`,
      );

      // Retry with explicit nulls for optional fields
      const retryData = {
        ...insertData,
        bank_id: bankId || null,
        card_metadata_id: result.cardMetadataId || null,
        network: result.network || null,
      };

      const retryResult = await supabaseAdmin
        .from('bin_lookup')
        .insert(retryData)
        .select();

      if (retryResult.error) {
        insertError = retryResult.error;
        insertedData = null;
      } else {
        insertError = null;
        insertedData = retryResult.data;
        console.log(`✅ [BIN Lookup] Retry with explicit nulls succeeded`);
      }
    }

    if (insertError) {
      // Don't throw - caching is best effort
      // Ignore duplicate key errors (BIN already cached)
      if (insertError.code !== '23505') {
        console.error(
          '❌ [BIN Lookup] Failed to cache BIN lookup:',
          insertError,
        );
        console.error('❌ [BIN Lookup] Error code:', insertError.code);
        console.error('❌ [BIN Lookup] Error message:', insertError.message);
        console.error(
          '❌ [BIN Lookup] Error details:',
          JSON.stringify(insertError, null, 2),
        );
        console.error(
          '❌ [BIN Lookup] Insert data that failed:',
          JSON.stringify(insertData, null, 2),
        );

        // Log helpful debugging info
        if (
          insertError.message?.includes('null value') ||
          insertError.code === '23502'
        ) {
          console.error(
            '💡 [BIN Lookup] Hint: Database may require bank_id or network to be NOT NULL',
          );
          console.error(
            '   Consider updating the database schema to allow NULLs for these fields',
          );
        }
      } else {
        // BIN already exists in cache - that's fine
        console.log(
          `ℹ️ [BIN Lookup] BIN ${bin} already cached (duplicate key)`,
        );
      }
    } else {
      if (bankId) {
        result.bankId = bankId;
      }
      console.log(
        `✅ [BIN Lookup] Successfully cached BIN ${bin} to database (global cache)`,
      );
      console.log(`   - Inserted ID: ${insertedData?.[0]?.id || 'unknown'}`);
      console.log(`   - bank_id: ${bankId || 'null'}`);
      console.log(`   - network: ${result.network || 'null'}`);
      console.log(`   - card_type: ${result.cardType || 'credit'}`);
      console.log(`   - country: ${result.country || 'IN'}`);
    }
  } catch (error: any) {
    // Don't throw - caching is best effort
    console.error(
      '⚠️ [BIN Lookup] Unexpected error caching BIN lookup:',
      error,
    );
    if (error?.code) {
      console.error('⚠️ [BIN Lookup] Error code:', error.code);
    }
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
  console.log(`🔍 [BIN Lookup] Checking database for BIN ${bin}...`);
  const internalResult = await lookupBINInternal(bin);
  if (internalResult) {
    console.log(
      `✅ [BIN Lookup] Found BIN ${bin} in database (source: ${internalResult.source})`,
    );
    setCachedBinResult(bin, internalResult);
    return internalResult;
  } else {
    console.log(
      `ℹ️ [BIN Lookup] BIN ${bin} not found in database, will try external API`,
    );
  }

  // Step 2: Try external BinList API
  console.log(`🔍 [BIN Lookup] Attempting external lookup for BIN ${bin}`);
  const externalResult = await lookupBINExternal(bin);
  if (externalResult) {
    console.log(
      `✅ [BIN Lookup] External lookup successful for BIN ${bin}, caching...`,
    );
    console.log(`📦 [BIN Lookup] External result data:`, {
      bankName: externalResult.bankName || 'null',
      bankId: externalResult.bankId || 'null',
      network: externalResult.network || 'null',
      cardType: externalResult.cardType || 'null',
      country: externalResult.country || 'null',
      source: externalResult.source,
    });
    // Step 3: Cache external result for future use
    await cacheBinLookup(bin, externalResult);
    setCachedBinResult(bin, externalResult);
    return externalResult;
  } else {
    console.log(
      `⚠️ [BIN Lookup] External lookup failed or returned null for BIN ${bin}`,
    );
    console.log(`⚠️ [BIN Lookup] This could be due to:`);
    console.log(`   - BIN not found in BinList database`);
    console.log(`   - Rate limit exceeded (429)`);
    console.log(`   - Network error`);
    console.log(`   - API timeout`);
  }

  // No result found
  setCachedBinResult(bin, null);
  return null;
}

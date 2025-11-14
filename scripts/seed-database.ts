/**
 * Seed Database Script
 *
 * Seeds banks, networks, and cards_metadata tables from JSON files
 *
 * Usage:
 *   pnpm tsx scripts/seed-database.ts
 *
 * Environment Variables Required:
 *   NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Your Supabase service role key
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Supabase client - using same config as upload scripts
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://tpiemcfwrodnxbrvjsvx.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwaWVtY2Z3cm9kbnhicnZqc3Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU4ODU0OSwiZXhwIjoyMDc1MTY0NTQ5fQ.fkXJte1bKUVqNP3R4k7hbwSVpyMTRDiGg-JiO7LFQe0';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// File paths
const BANKS_FILE = path.join(PROJECT_ROOT, 'data', 'banks.json');
const CARDS_FILE = path.join(PROJECT_ROOT, 'data', 'cards.json');

// Network data (from existing network icons)
const NETWORKS_DATA = [
  {
    name: 'visa',
    displayName: 'Visa',
    iconUrl:
      'https://tpiemcfwrodnxbrvjsvx.supabase.co/storage/v1/object/public/network/visa/logo.png',
    logoUrl:
      'https://tpiemcfwrodnxbrvjsvx.supabase.co/storage/v1/object/public/network/visa/logo.png',
    primaryColor: '#1A1F71',
    secondaryColor: '#FFFFFF',
  },
  {
    name: 'mastercard',
    displayName: 'Mastercard',
    iconUrl:
      'https://tpiemcfwrodnxbrvjsvx.supabase.co/storage/v1/object/public/network/mastercard/logo.png',
    logoUrl:
      'https://tpiemcfwrodnxbrvjsvx.supabase.co/storage/v1/object/public/network/mastercard/logo.png',
    primaryColor: '#EB001B',
    secondaryColor: '#F79E1B',
  },
  {
    name: 'rupay',
    displayName: 'RuPay',
    iconUrl:
      'https://tpiemcfwrodnxbrvjsvx.supabase.co/storage/v1/object/public/network/rupay/flat-rounded.png',
    logoUrl:
      'https://tpiemcfwrodnxbrvjsvx.supabase.co/storage/v1/object/public/network/rupay/logo.png',
    primaryColor: '#0066B2',
    secondaryColor: '#003D7A',
  },
  {
    name: 'amex',
    displayName: 'American Express',
    iconUrl:
      'https://tpiemcfwrodnxbrvjsvx.supabase.co/storage/v1/object/public/network/amex/logo.png',
    logoUrl:
      'https://tpiemcfwrodnxbrvjsvx.supabase.co/storage/v1/object/public/network/amex/logo.png',
    primaryColor: '#006FCF',
    secondaryColor: '#00175A',
  },
  {
    name: 'discover',
    displayName: 'Discover',
    iconUrl:
      'https://tpiemcfwrodnxbrvjsvx.supabase.co/storage/v1/object/public/network/discover/logo.png',
    logoUrl:
      'https://tpiemcfwrodnxbrvjsvx.supabase.co/storage/v1/object/public/network/discover/logo.png',
    primaryColor: '#FF6000',
    secondaryColor: '#000000',
  },
];

interface BankData {
  name: string;
  displayName: string;
  logoUrl: string | null;
  logoWithNameUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

interface CardData {
  bankName: string;
  cards: Array<{
    cardName: string;
    displayName: string;
    cardType: string;
    network: string;
    rewardType: string | null;
    annualFee: number;
    joiningFee: number;
    benefits?: any[];
    offers?: any[];
    rewards?: any;
    milestones?: any[];
    // Support both string array and object array formats
    binRanges?: Array<
      | string
      | { binStart: string; binEnd?: string }
      | { bin_start: string; bin_end?: string }
    >;
    networkLogoUrl?: string;
    networkIconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    cardLogoUrl?: string;
    joiningBonus?: any;
    metadata?: any;
  }>;
}

/**
 * Seed networks table
 */
async function seedNetworks(): Promise<Map<string, string>> {
  console.log('\n📡 Seeding networks...');
  const networkIdMap = new Map<string, string>();

  for (const network of NETWORKS_DATA) {
    const { data, error } = await supabase
      .from('networks')
      .upsert(
        {
          name: network.name,
          display_name: network.displayName,
          icon_url: network.iconUrl,
          logo_url: network.logoUrl,
          primary_color: network.primaryColor,
          secondary_color: network.secondaryColor,
          is_active: true,
        },
        {
          onConflict: 'name',
          ignoreDuplicates: false,
        },
      )
      .select('id, name')
      .single();

    if (error) {
      console.error(
        `  ❌ Error seeding network ${network.name}:`,
        error.message,
      );
      continue;
    }

    if (data) {
      networkIdMap.set(network.name, data.id);
      console.log(`  ✓ Seeded network: ${network.displayName}`);
    }
  }

  console.log(`  ✅ Seeded ${networkIdMap.size} networks\n`);
  return networkIdMap;
}

/**
 * Seed banks table
 */
async function seedBanks(): Promise<Map<string, string>> {
  console.log('🏦 Seeding banks...');

  if (!fs.existsSync(BANKS_FILE)) {
    throw new Error(`Banks file not found: ${BANKS_FILE}`);
  }

  const banksJson = fs.readFileSync(BANKS_FILE, 'utf-8');
  const banks: BankData[] = JSON.parse(banksJson);
  const bankIdMap = new Map<string, string>();

  for (const bank of banks) {
    const { data, error } = await supabase
      .from('banks')
      .upsert(
        {
          name: bank.name,
          display_name: bank.displayName,
          logo_url: bank.logoUrl,
          logo_with_name_url: bank.logoWithNameUrl,
          primary_color: bank.primaryColor,
          secondary_color: bank.secondaryColor,
          is_active: true,
        },
        {
          onConflict: 'name',
          ignoreDuplicates: false,
        },
      )
      .select('id, name')
      .single();

    if (error) {
      console.error(`  ❌ Error seeding bank ${bank.name}:`, error.message);
      continue;
    }

    if (data) {
      bankIdMap.set(bank.name, data.id);
      console.log(`  ✓ Seeded bank: ${bank.displayName}`);
    }
  }

  console.log(`  ✅ Seeded ${bankIdMap.size} banks\n`);
  return bankIdMap;
}

/**
 * Seed cards_metadata table
 */
async function seedCards(bankIdMap: Map<string, string>): Promise<void> {
  console.log('💳 Seeding cards metadata...');

  if (!fs.existsSync(CARDS_FILE)) {
    throw new Error(`Cards file not found: ${CARDS_FILE}`);
  }

  const cardsJson = fs.readFileSync(CARDS_FILE, 'utf-8');
  const cardsData: CardData[] = JSON.parse(cardsJson);

  let totalCards = 0;
  let seededCards = 0;

  for (const bankCards of cardsData) {
    const bankId = bankIdMap.get(bankCards.bankName);
    if (!bankId) {
      console.error(
        `  ⚠️  Bank not found: ${bankCards.bankName}, skipping cards`,
      );
      continue;
    }

    for (const card of bankCards.cards) {
      totalCards++;

      const { data, error } = await supabase
        .from('cards_metadata')
        .upsert(
          {
            bank_id: bankId,
            card_name: card.cardName,
            display_name: card.displayName,
            card_type: card.cardType,
            network: card.network,
            reward_type: card.rewardType || null,
            annual_fee: card.annualFee || 0,
            joining_fee: card.joiningFee || 0,
            primary_color: card.primaryColor || null,
            secondary_color: card.secondaryColor || null,
            card_logo_url: card.cardLogoUrl || null,
            benefits: card.benefits || [],
            offers: card.offers || [],
            rewards: card.rewards || {},
            milestones: card.milestones || [],
            metadata: {
              ...(card.metadata || {}),
              networkLogoUrl: card.networkLogoUrl,
              networkIconUrl: card.networkIconUrl,
              joiningBonus: card.joiningBonus,
            },
            is_active: true,
          },
          {
            onConflict: 'bank_id,card_name',
            ignoreDuplicates: false,
          },
        )
        .select('id, display_name')
        .single();

      if (error) {
        console.error(
          `  ❌ Error seeding card ${card.displayName}:`,
          error.message,
        );
        continue;
      }

      if (data) {
        seededCards++;
        if (seededCards % 10 === 0) {
          console.log(`  ... Seeded ${seededCards} cards`);
        }
      }
    }
  }

  console.log(`  ✅ Seeded ${seededCards}/${totalCards} cards metadata\n`);
}

/**
 * Seed BIN ranges
 */
async function seedBinRanges(bankIdMap: Map<string, string>): Promise<void> {
  console.log('🔢 Seeding BIN ranges...');

  if (!fs.existsSync(CARDS_FILE)) {
    return; // Skip if no cards file
  }

  const cardsJson = fs.readFileSync(CARDS_FILE, 'utf-8');
  const cardsData: CardData[] = JSON.parse(cardsJson);

  // First, get card metadata IDs
  let totalBinRanges = 0;
  let seededBinRanges = 0;

  for (const bankCards of cardsData) {
    const bankId = bankIdMap.get(bankCards.bankName);
    if (!bankId) continue;

    for (const card of bankCards.cards) {
      // Get card metadata ID
      const { data: cardMetadata } = await supabase
        .from('cards_metadata')
        .select('id')
        .eq('bank_id', bankId)
        .eq('card_name', card.cardName)
        .single();

      if (!cardMetadata || !card.binRanges || card.binRanges.length === 0) {
        continue;
      }

      // Process BIN ranges
      // Handle both formats:
      // 1. String array: ["453282", "453283", "453284"] -> create range if consecutive, or individual entries
      // 2. Object array: [{binStart: "453282", binEnd: "453284"}]

      // First, normalize all BINs to numbers for sorting and range detection
      const binNumbers: number[] = [];
      const binRangesToProcess: Array<{ binStart: string; binEnd: string }> =
        [];

      for (const binRange of card.binRanges) {
        // Handle both formats:
        // 1. String format: "453282" or ["453282", "453283"]
        // 2. Object format: { binStart: "453282", binEnd: "453282" }
        let binStart: string;
        let binEnd: string;

        if (typeof binRange === 'string') {
          // String format: use as both start and end
          binStart = binRange;
          binEnd = binRange;
        } else if (typeof binRange === 'object' && binRange !== null) {
          // Object format: extract binStart and binEnd
          // Handle both camelCase and snake_case formats
          const obj = binRange as any;
          binStart = obj.binStart || obj.bin_start;
          binEnd = obj.binEnd || obj.bin_end || binStart;
        } else {
          // Invalid format, skip
          continue;
        }

        // Validate BIN format (must be exactly 6 digits)
        if (
          !binStart ||
          typeof binStart !== 'string' ||
          binStart.length !== 6 ||
          !/^\d{6}$/.test(binStart)
        ) {
          continue;
        }
      }

      // Process string array: group consecutive numbers into ranges
      if (binNumbers.length > 0) {
        // Sort numbers
        binNumbers.sort((a, b) => a - b);

        // Group consecutive numbers into ranges
        let rangeStart = binNumbers[0];
        let rangeEnd = binNumbers[0];

        for (let i = 1; i < binNumbers.length; i++) {
          if (binNumbers[i] === rangeEnd + 1) {
            // Consecutive, extend range
            rangeEnd = binNumbers[i];
          } else {
            // Not consecutive, save current range and start new one
            binRangesToProcess.push({
              binStart: rangeStart.toString().padStart(6, '0'),
              binEnd: rangeEnd.toString().padStart(6, '0'),
            });
            rangeStart = binNumbers[i];
            rangeEnd = binNumbers[i];
          }
        }
        // Don't forget the last range
        binRangesToProcess.push({
          binStart: rangeStart.toString().padStart(6, '0'),
          binEnd: rangeEnd.toString().padStart(6, '0'),
        });
      }

        // Validate binEnd if provided
        if (binEnd && (binEnd.length !== 6 || !/^\d{6}$/.test(binEnd))) {
          // If binEnd is invalid, use binStart as binEnd
          binEnd = binStart;
        }

        // Ensure binEnd >= binStart
        if (parseInt(binEnd, 10) < parseInt(binStart, 10)) {
          binEnd = binStart;
        }

        totalBinRanges++;

        const { error } = await supabase.from('bin_lookup').upsert(
          {
            bin_start: binStart,
            bin_end: binEnd,
            bank_id: bankId,
            card_metadata_id: cardMetadata.id,
            card_type: card.cardType,
            network: card.network,
            country: 'IN',
            is_active: true,
          },
          {
            onConflict: undefined, // No unique constraint, allow duplicates
          },
        );

        if (error) {
          console.error(
            `  ❌ Error seeding BIN range ${binStart}:`,
            error.message,
          );
          continue;
        }

        seededBinRanges++;
      }
    }
  }

  console.log(`  ✅ Seeded ${seededBinRanges}/${totalBinRanges} BIN ranges\n`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Seed in order: networks -> banks -> cards -> bin_ranges
    const networkIdMap = await seedNetworks();
    const bankIdMap = await seedBanks();
    await seedCards(bankIdMap);
    await seedBinRanges(bankIdMap);

    console.log('✅ Database seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Networks: ${networkIdMap.size}`);
    console.log(`   - Banks: ${bankIdMap.size}`);
    console.log('   - Cards: Check above for count');
    console.log('   - BIN ranges: Check above for count\n');
  } catch (error: any) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

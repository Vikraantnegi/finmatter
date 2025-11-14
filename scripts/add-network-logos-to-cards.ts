/**
 * Script to add network logo URLs to cards.json
 *
 * Usage:
 *   pnpm tsx scripts/add-network-logos-to-cards.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of this script file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root (finmatter directory)
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CARDS_JSON_PATH = path.resolve(PROJECT_ROOT, 'data', 'cards.json');

// Supabase storage base URL
const SUPABASE_STORAGE_BASE =
  'https://tpiemcfwrodnxbrvjsvx.supabase.co/storage/v1/object/public/network';

/**
 * Generate network logo URLs based on network name
 */
function getNetworkLogoUrls(network: string): {
  networkLogoUrl: string;
  networkIconUrl: string;
} {
  // Normalize network name to match storage structure
  const normalizedNetwork = network.toLowerCase();

  // RuPay uses PNG instead of SVG
  if (normalizedNetwork === 'rupay') {
    return {
      networkLogoUrl: `${SUPABASE_STORAGE_BASE}/${normalizedNetwork}/logo.png`,
      networkIconUrl: `${SUPABASE_STORAGE_BASE}/${normalizedNetwork}/flat-rounded.png`,
    };
  }

  // All other networks use SVG
  return {
    networkLogoUrl: `${SUPABASE_STORAGE_BASE}/${normalizedNetwork}/logo.svg`,
    networkIconUrl: `${SUPABASE_STORAGE_BASE}/${normalizedNetwork}/flat-rounded.svg`,
  };
}

/**
 * Add network logo URLs to all cards
 */
function addNetworkLogos() {
  console.log('Reading cards.json...');

  // Read current cards.json
  const cardsData = JSON.parse(fs.readFileSync(CARDS_JSON_PATH, 'utf-8'));

  let totalCards = 0;
  let updatedCards = 0;
  const networksSeen = new Set<string>();

  // Process each bank
  for (const bank of cardsData) {
    // Process each card in the bank
    for (const card of bank.cards) {
      totalCards++;

      if (card.network) {
        networksSeen.add(card.network);

        // Get network logo URLs
        const networkUrls = getNetworkLogoUrls(card.network);

        // Always update URLs (especially for RuPay which changed from SVG to PNG)
        // Check if URLs need updating (missing or wrong format for RuPay)
        const needsUpdate =
          !card.networkLogoUrl ||
          !card.networkIconUrl ||
          (card.network.toLowerCase() === 'rupay' &&
            (card.networkLogoUrl.includes('.svg') ||
              card.networkIconUrl.includes('.svg')));

        if (needsUpdate) {
          card.networkLogoUrl = networkUrls.networkLogoUrl;
          card.networkIconUrl = networkUrls.networkIconUrl;
          updatedCards++;
        }
      } else {
        console.warn(
          `⚠️  Card "${card.displayName}" (${card.cardName}) has no network field`,
        );
      }
    }
  }

  // Write back to file
  fs.writeFileSync(
    CARDS_JSON_PATH,
    JSON.stringify(cardsData, null, 2),
    'utf-8',
  );

  console.log(`\n✅ Process completed!`);
  console.log(`   Total cards: ${totalCards}`);
  console.log(`   Updated cards: ${updatedCards}`);
  console.log(
    `   Networks found: ${Array.from(networksSeen).sort().join(', ')}`,
  );

  // Check for missing networks
  const expectedNetworks = [
    'visa',
    'mastercard',
    'amex',
    'rupay',
    'diners',
    'discover',
    'maestro',
  ];
  const missingNetworks = expectedNetworks.filter(
    net => !networksSeen.has(net),
  );

  if (missingNetworks.length > 0) {
    console.log(
      `\n⚠️  Networks not found in cards: ${missingNetworks.join(', ')}`,
    );
    console.log(
      '   These networks exist in the upload script but no cards use them yet.',
    );
  }
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('🚀 Adding network logo URLs to cards.json...\n');

    if (!fs.existsSync(CARDS_JSON_PATH)) {
      throw new Error(`Cards JSON file not found at: ${CARDS_JSON_PATH}`);
    }

    addNetworkLogos();

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main();

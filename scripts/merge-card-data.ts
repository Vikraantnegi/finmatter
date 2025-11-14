/**
 * Script to merge new card data into cards.json
 *
 * Converts Python-style card data to match existing cards.json structure
 *
 * Usage:
 *   pnpm tsx scripts/merge-card-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CARDS_JSON_PATH = path.resolve(PROJECT_ROOT, 'data', 'cards.json');
const SUPABASE_STORAGE_BASE =
  'https://tpiemcfwrodnxbrvjsvx.supabase.co/storage/v1/object/public/network';

// Bank name mapping: issuer name -> bankName slug
const BANK_NAME_MAP: Record<string, string> = {
  'HDFC Bank': 'hdfc',
  'SBI Card': 'sbi',
  'ICICI Bank': 'icici',
  'Axis Bank': 'axis',
  'IDFC FIRST Bank': 'idfc',
  'American Express': 'amex',
  'RBL Bank': 'rbl',
  'IndusInd Bank': 'indusind',
  'Kotak Mahindra Bank': 'kotak',
  'HSBC Bank': 'hsbc',
  'YES BANK': 'yes',
  'State Bank of India': 'sbi',
  'CSB Bank': 'csb',
  'AU Small Finance Bank': 'au',
  'Federal Bank': 'federal',
  Kiwi: 'kiwi',
  'Bank of Baroda': 'bob',
};

// Network name mapping
const NETWORK_MAP: Record<string, string> = {
  Visa: 'visa',
  Mastercard: 'mastercard',
  'American Express': 'amex',
  RuPay: 'rupay',
};

// Card type mapping
const CARD_TYPE_MAP: Record<string, string> = {
  rewards: 'points',
  cashback: 'cashback',
  premium: 'points',
  lifestyle: 'points',
};

/**
 * Convert snake_case to kebab-case for cardName
 * Also removes bank prefix (e.g., "hdfc_regalia" -> "regalia", "hdfc-regalia-marriott" -> "regalia-marriott")
 */
function toKebabCase(str: string): string {
  if (!str) return '';

  // Remove common bank prefixes (both underscore and dash formats)
  let cleaned = str
    .replace(
      /^(hdfc|sbi|icici|axis|idfc|amex|rbl|indusind|kotak|hsbc|yes|csb|au|federal|kiwi|bob)[\-_]/i,
      '',
    )
    .replace(/_/g, '-')
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-+|-+$/g, '');

  return cleaned;
}

/**
 * Get network logo URLs
 */
function getNetworkLogoUrls(network: string): {
  networkLogoUrl: string;
  networkIconUrl: string;
} {
  const normalizedNetwork = network.toLowerCase();

  if (normalizedNetwork === 'rupay') {
    return {
      networkLogoUrl: `${SUPABASE_STORAGE_BASE}/${normalizedNetwork}/logo.png`,
      networkIconUrl: `${SUPABASE_STORAGE_BASE}/${normalizedNetwork}/flat-rounded.png`,
    };
  }

  return {
    networkLogoUrl: `${SUPABASE_STORAGE_BASE}/${normalizedNetwork}/logo.svg`,
    networkIconUrl: `${SUPABASE_STORAGE_BASE}/${normalizedNetwork}/flat-rounded.svg`,
  };
}

/**
 * Parse fee string to number (e.g., "₹500 + GST" -> 500, "₹0" -> 0)
 */
function parseFee(feeStr: string | number | undefined): number {
  if (typeof feeStr === 'number') return feeStr;
  if (
    !feeStr ||
    feeStr === '0' ||
    feeStr === '₹0' ||
    feeStr.toLowerCase().includes('free') ||
    feeStr.toLowerCase().includes('lifetime free')
  )
    return 0;

  // Extract number from string like "₹500 + GST" or "₹500"
  const match = feeStr.match(/₹?\s*([\d,]+)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10) || 0;
  }
  return 0;
}

/**
 * Extract network from rupay boolean or infer from card name/category
 */
function inferNetwork(card: any): string {
  // If rupay is explicitly true, use rupay
  if (card.rupay === true) return 'rupay';

  // Check if card name/categories mention rupay
  const nameAndCategories =
    `${card.name || ''} ${card.categories?.join(' ') || ''}`.toLowerCase();
  if (
    nameAndCategories.includes('rupay') ||
    nameAndCategories.includes('upi')
  ) {
    return 'rupay';
  }

  // Default to visa if not specified
  return 'visa';
}

/**
 * Extract reward rate from rewardsProgram text
 */
function extractRewardRate(rewardsProgram: string | undefined): number {
  if (!rewardsProgram) return 0;

  // Look for patterns like "5%", "5X", "2 points per ₹100"
  const patterns = [
    /(\d+(?:\.\d+)?)%/g, // 5%
    /(\d+(?:\.\d+)?)x/gi, // 5X
    /(\d+(?:\.\d+)?)\s*(?:points?|rewards?)\s*(?:per|for)\s*₹?\s*\d+/gi, // 2 points per ₹100
  ];

  let maxRate = 0;
  for (const pattern of patterns) {
    const matches = rewardsProgram.matchAll(pattern);
    for (const match of matches) {
      const rate = parseFloat(match[1]);
      if (rate > maxRate) maxRate = rate;
    }
  }

  return maxRate;
}

/**
 * Convert JS object format (id, name, bank, etc.) to script format
 */
function convertJsObjectFormat(jsCard: any): any {
  const details = jsCard.additionalDetails || {};

  // Parse fees
  const annualFee = parseFee(jsCard.annualFee);
  const joiningFee = parseFee(jsCard.joiningFee);

  // Determine network
  const network = inferNetwork(jsCard);

  // Determine reward type from category and rewardsProgram
  const category = jsCard.category?.toLowerCase() || '';
  const rewardsProgramLower = (details.rewardsProgram || '').toLowerCase();
  let rewardType = 'points';

  // Check rewardsProgram first for explicit mentions
  if (
    rewardsProgramLower.includes('cashback') ||
    rewardsProgramLower.includes('cash back')
  ) {
    rewardType = 'cashback';
  } else if (
    rewardsProgramLower.includes('miles') ||
    rewardsProgramLower.includes('avios') ||
    rewardsProgramLower.includes('bonvoy points')
  ) {
    rewardType = 'miles';
  } else if (category.includes('cashback')) {
    rewardType = 'cashback';
  } else if (category.includes('miles') || category.includes('airline')) {
    rewardType = 'miles';
  } else {
    rewardType = CARD_TYPE_MAP[jsCard.category] || 'points';
  }

  // Extract reward rate
  const rewardRate = extractRewardRate(details.rewardsProgram);

  // Build benefits from additionalDetails
  const benefits: any[] = [];

  const rewardsProgram = details.rewardsProgram || '';
  const program = rewardsProgram.toLowerCase();

  // Parse rewards program for category benefits
  if (details.rewardsProgram) {
    // Common categories to look for
    const categories = [
      'dining',
      'shopping',
      'travel',
      'groceries',
      'fuel',
      'utility',
      'online',
      'entertainment',
      'hotel',
      'airline',
      'amazon',
      'flipkart',
      'swiggy',
      'zomato',
      'uber',
    ];

    // Pattern to match: "5% cashback on dining" or "5X rewards on shopping" or "5% on dining"
    for (const cat of categories) {
      // Try multiple patterns
      const patterns = [
        new RegExp(
          `(\\d+(?:\\.\\d+)?)[%x]?\\s*(?:cashback|rewards?|points?)\\s*(?:on|for)?\\s*(?:choice\\s+of\\s+)?(?:any\\s+)?(?:two\\s+)?(?:packs?)?\\s*[:\\-]?\\s*${cat}`,
          'gi',
        ),
        new RegExp(`(\\d+(?:\\.\\d+)?)[%x]?\\s*(?:on|for)?\\s*${cat}`, 'gi'),
        new RegExp(
          `${cat}\\s*[:\\-]?\\s*(\\d+(?:\\.\\d+)?)[%x]?\\s*(?:cashback|rewards?|points?)`,
          'gi',
        ),
      ];

      for (const pattern of patterns) {
        const matches = program.matchAll(pattern);
        for (const match of matches) {
          const rate = parseFloat(match[1] || match[2] || '0');
          if (rate > 0) {
            // Check if this category already exists
            if (!benefits.some(b => b.category === cat)) {
              benefits.push({
                category: cat,
                description: `${rate}% ${rewardType === 'cashback' ? 'cashback' : 'reward points'} on ${cat}`,
                rewardRate: rate,
                rewardType: rewardType,
                conditions: [],
                isActive: true,
              });
              break; // Found a match, move to next category
            }
          }
        }
      }
    }

    // Also try to match lines like "• 5% Cashback on choice of any two packs:"
    const linePattern =
      /•\s*(\d+(?:\.\d+)?)[%x]?\s*(?:cashback|rewards?|points?)\s*(?:on|for)?\s*(.+?)(?:\n|$)/gi;
    const lineMatches = program.matchAll(linePattern);
    for (const match of lineMatches) {
      const rate = parseFloat(match[1] || '0');
      const description = match[2]?.trim() || '';
      if (rate > 0 && description) {
        // Try to extract category from description
        for (const cat of categories) {
          if (
            description.toLowerCase().includes(cat) &&
            !benefits.some(b => b.category === cat && b.rewardRate === rate)
          ) {
            benefits.push({
              category: cat,
              description: `${rate}% ${rewardType === 'cashback' ? 'cashback' : 'reward points'} on ${cat}`,
              rewardRate: rate,
              rewardType: rewardType,
              conditions:
                description.includes('choice') || description.includes('select')
                  ? [description]
                  : [],
              isActive: true,
            });
            break;
          }
        }
      }
    }
  }

  // Add lounge access if mentioned
  if (
    details.airportLounge ||
    details.airportLoungeAccess ||
    program.includes('lounge')
  ) {
    const loungeMatch =
      details.airportLounge?.match(/(\d+)/) ||
      details.airportLoungeAccess?.match(/(\d+)/);
    const loungeCount = loungeMatch ? parseInt(loungeMatch[1], 10) : 4;
    benefits.push({
      category: 'lounge',
      description: `${loungeCount} complimentary airport lounge visits per year`,
      rewardType: 'service',
      conditions: [],
      isActive: true,
    });
  }

  // Add fuel surcharge waiver if mentioned
  if (
    details.fuelSurcharge &&
    !details.fuelSurcharge.toLowerCase().includes('not specified') &&
    !details.fuelSurcharge.toLowerCase().includes('none')
  ) {
    benefits.push({
      category: 'fuel',
      description: 'Fuel surcharge waiver',
      rewardType: 'waiver',
      conditions: [],
      isActive: true,
    });
  }

  // Build offers from welcome bonus
  const offers: any[] = [];
  if (
    details.welcomeBonus &&
    details.welcomeBonus.trim() &&
    details.welcomeBonus.toLowerCase() !== 'not specified'
  ) {
    offers.push({
      title: 'Welcome Benefit',
      description: details.welcomeBonus,
      validity: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      terms: [],
      category: 'welcome',
      isActive: true,
    });
  }

  // Build rewards object
  const rewards: any = {
    baseRate: rewardRate || 0,
    baseRewardType: rewardType,
    acceleratedRates: [],
    redemption: {
      cashback: rewardType === 'cashback',
      points: rewardType === 'points',
      miles: rewardType === 'miles',
    },
  };

  // Build milestones
  const milestones: any[] = [];
  if (details.milestoneBenefits && Array.isArray(details.milestoneBenefits)) {
    details.milestoneBenefits.forEach((mb: string) => {
      if (
        mb &&
        mb.trim() &&
        mb.toLowerCase() !== 'na' &&
        mb.toLowerCase() !== 'not specified'
      ) {
        milestones.push({
          spendingThreshold: 100000, // Default
          reward: 'Milestone benefit',
          description: mb,
          type: 'annual',
          isActive: true,
        });
      }
    });
  }

  // Check for fee waiver mentions
  const summary = details.summary || '';
  const allText = `${details.rewardsProgram || ''} ${summary}`.toLowerCase();
  if (allText.includes('fee waiver') || allText.includes('annual fee waived')) {
    milestones.push({
      spendingThreshold: 100000,
      reward: 'Fee waiver',
      description: 'Annual fee waiver on meeting spend criteria',
      type: 'annual',
      isActive: true,
    });
  }

  return {
    card_id: jsCard.id || toKebabCase(jsCard.name || ''),
    card_name: jsCard.name || '',
    issuer: jsCard.bank || '',
    card_network:
      network === 'rupay'
        ? 'RuPay'
        : network.charAt(0).toUpperCase() + network.slice(1),
    card_type: jsCard.category || 'rewards',
    annual_fee: annualFee,
    joining_fee: joiningFee,
    reward_rate: rewardRate,
    cashback_rate: rewardType === 'cashback' ? rewardRate : 0,
    welcome_benefits: details.welcomeBonus || '',
    milestone_benefits: details.milestoneBenefits?.join('; ') || '',
    fee_waiver_condition: allText.includes('fee waiver')
      ? 'Annual fee waiver on meeting spend criteria'
      : '',
    reward_categories: benefits.map((b: any) => b.category),
    lounge_access: !!details.airportLounge || !!details.airportLoungeAccess,
    lounge_access_count:
      details.airportLounge?.match(/(\d+)/)?.[1] ||
      details.airportLoungeAccess?.match(/(\d+)/)?.[1] ||
      0,
    fuel_surcharge_waiver:
      !!details.fuelSurcharge &&
      !details.fuelSurcharge.toLowerCase().includes('not specified'),
  };
}

/**
 * Convert new card data format to existing format
 */
function convertCardData(newCard: any): any {
  // Check if it's the JS object format (has 'id', 'name', 'bank' properties)
  if (newCard.id || (newCard.name && newCard.bank && !newCard.card_id)) {
    newCard = convertJsObjectFormat(newCard);
  }

  const bankName =
    BANK_NAME_MAP[newCard.issuer] ||
    newCard.issuer?.toLowerCase().replace(/\s+/g, '-') ||
    '';
  const network =
    NETWORK_MAP[newCard.card_network] ||
    newCard.card_network?.toLowerCase() ||
    'visa';
  const rewardType = CARD_TYPE_MAP[newCard.card_type] || 'points';
  const cardName = toKebabCase(newCard.card_id || newCard.id || '');

  const networkUrls = getNetworkLogoUrls(network);

  // Build benefits from reward categories and boolean flags
  const benefits: any[] = [];

  // Add benefits from reward categories
  if (newCard.reward_categories && newCard.reward_categories.length > 0) {
    newCard.reward_categories.forEach((category: string) => {
      const normalizedCategory = category.toLowerCase().replace(/\s+/g, '-');
      const rate = newCard.reward_rate || newCard.cashback_rate || 0;

      if (rate > 0) {
        benefits.push({
          category: normalizedCategory,
          description: `${rate}% ${rewardType === 'cashback' ? 'cashback' : 'reward points'} on ${category}`,
          rewardRate: rate,
          rewardType: rewardType,
          conditions: [],
          isActive: true,
        });
      }
    });
  }

  // Add lounge access benefit if available
  if (newCard.lounge_access && newCard.lounge_access_count > 0) {
    benefits.push({
      category: 'lounge',
      description: `${newCard.lounge_access_count} complimentary airport lounge visits per year`,
      rewardType: 'service',
      conditions: [],
      isActive: true,
    });
  }

  // Add fuel surcharge waiver
  if (newCard.fuel_surcharge_waiver) {
    benefits.push({
      category: 'fuel',
      description: 'Fuel surcharge waiver',
      rewardType: 'waiver',
      conditions: [],
      isActive: true,
    });
  }

  // Build offers from welcome benefits
  const offers: any[] = [];
  if (newCard.welcome_benefits) {
    offers.push({
      title: 'Welcome Benefit',
      description: newCard.welcome_benefits,
      validity: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // 1 year from now
      terms: [],
      category: 'welcome',
      isActive: true,
    });
  }

  // Build rewards object
  const rewards: any = {
    baseRate: newCard.reward_rate || newCard.cashback_rate || 0,
    baseRewardType: rewardType,
    acceleratedRates: [],
    redemption: {
      cashback: rewardType === 'cashback',
      points: rewardType === 'points',
      miles: false,
    },
  };

  // Build milestones
  const milestones: any[] = [];
  if (newCard.fee_waiver_condition) {
    milestones.push({
      spendingThreshold: 100000, // Default, could be parsed from text
      reward: 'Fee waiver',
      description: newCard.fee_waiver_condition,
      type: 'annual',
      isActive: true,
    });
  }
  if (newCard.milestone_benefits) {
    milestones.push({
      spendingThreshold: 500000, // Default
      reward: 'Milestone benefit',
      description: newCard.milestone_benefits,
      type: 'annual',
      isActive: true,
    });
  }

  return {
    cardName,
    displayName: newCard.card_name,
    cardType: 'credit',
    network,
    rewardType,
    annualFee: newCard.annual_fee || 0,
    joiningFee: newCard.joining_fee || 0,
    benefits,
    offers,
    rewards,
    milestones,
    binRanges: [], // Not in new data
    networkLogoUrl: networkUrls.networkLogoUrl,
    networkIconUrl: networkUrls.networkIconUrl,
  };
}

/**
 * Merge new card data into existing cards.json
 */
function mergeCardData(newCardsData: any[]) {
  console.log('Reading existing cards.json...');
  const existingData = JSON.parse(fs.readFileSync(CARDS_JSON_PATH, 'utf-8'));

  let updatedCount = 0;
  let addedCount = 0;
  const banksByBankName: Record<string, any> = {};

  // Index existing banks
  for (const bank of existingData) {
    banksByBankName[bank.bankName] = bank;
  }

  // Process new cards
  for (const newCard of newCardsData) {
    // Get issuer from either 'issuer' (old format) or 'bank' (new format)
    const issuer = newCard.issuer || newCard.bank || '';
    const bankName =
      BANK_NAME_MAP[issuer] || issuer.toLowerCase().replace(/\s+/g, '-');
    const convertedCard = convertCardData(newCard);
    const cardName = convertedCard.cardName;

    // Find or create bank entry
    if (!banksByBankName[bankName]) {
      banksByBankName[bankName] = {
        bankName,
        cards: [],
      };
      console.log(`✓ Created new bank entry: ${bankName}`);
    }

    // Normalize display names for comparison (remove bank name prefix, lowercase, trim)
    const normalizeDisplayNameLocal = (name: string) => {
      let normalized = name
        .replace(/^(HDFC|SBI|ICICI|Axis|IDFC|Amex|RBL|IndusInd|Kotak)\s+/i, '')
        .replace(/\s+Credit\s+Card$/i, '')
        .replace(/millenia/gi, 'millennia') // Normalize spelling variant
        .replace(/\s*regalia\s*/gi, '') // Remove "Regalia" as it's often redundant
        .toLowerCase()
        .trim();

      // Remove common suffixes/prefixes that don't affect card identity
      normalized = normalized
        .replace(/\s+bonvoy\s*/gi, ' bonvoy ') // Normalize bonvoy spacing
        .replace(/\s+/g, ' ') // Normalize multiple spaces
        .trim();

      return normalized;
    };

    const cardDisplayName = newCard.card_name || newCard.name || '';
    const normalizedNewDisplayName = normalizeDisplayNameLocal(cardDisplayName);

    // Check if card already exists (by cardName or normalized displayName)
    const existingCardIndex = banksByBankName[bankName].cards.findIndex(
      (c: any) => {
        const normalizedExisting = normalizeDisplayNameLocal(c.displayName);
        return (
          c.cardName === cardName ||
          normalizedExisting === normalizedNewDisplayName ||
          (cardDisplayName &&
            c.displayName &&
            c.displayName
              .toLowerCase()
              .includes(cardDisplayName.toLowerCase()) &&
            cardDisplayName.toLowerCase().includes(c.displayName.toLowerCase()))
        );
      },
    );

    if (existingCardIndex >= 0) {
      // Update existing card (merge, don't overwrite)
      const existingCard = banksByBankName[bankName].cards[existingCardIndex];

      // Keep existing cardName (don't change it to avoid duplicates)
      // Update only specific fields, preserve binRanges if exists
      existingCard.displayName = convertedCard.displayName;
      existingCard.network = convertedCard.network;
      existingCard.rewardType = convertedCard.rewardType;
      existingCard.annualFee = convertedCard.annualFee;
      existingCard.joiningFee = convertedCard.joiningFee;

      // Merge benefits - combine new categories with existing
      const existingCategories = new Set(
        existingCard.benefits.map((b: any) => b.category),
      );
      convertedCard.benefits.forEach((newBenefit: any) => {
        if (!existingCategories.has(newBenefit.category)) {
          existingCard.benefits.push(newBenefit);
          existingCategories.add(newBenefit.category);
        }
      });

      // Merge offers (update if new data has offers)
      if (
        convertedCard.offers.length > 0 &&
        (existingCard.offers.length === 0 ||
          !existingCard.offers.some((o: any) => o.category === 'welcome'))
      ) {
        // Remove old welcome offers and add new ones
        existingCard.offers = existingCard.offers.filter(
          (o: any) => o.category !== 'welcome',
        );
        existingCard.offers.push(...convertedCard.offers);
      }

      // Update rewards - use new data if it has better info or existing is empty
      if (convertedCard.rewards.baseRate > 0) {
        if (
          existingCard.rewards.baseRate === 0 ||
          Object.keys(existingCard.rewards).length === 0
        ) {
          existingCard.rewards = convertedCard.rewards;
        } else if (
          convertedCard.rewards.baseRate > existingCard.rewards.baseRate
        ) {
          // Update base rate if new one is higher
          existingCard.rewards.baseRate = convertedCard.rewards.baseRate;
          existingCard.rewards.baseRewardType =
            convertedCard.rewards.baseRewardType;
        }
      }

      // Merge milestones (add if not already present)
      convertedCard.milestones.forEach((newMilestone: any) => {
        const exists = existingCard.milestones.some(
          (m: any) => m.description === newMilestone.description,
        );
        if (!exists) {
          existingCard.milestones.push(newMilestone);
        }
      });

      // Update network URLs
      existingCard.networkLogoUrl = convertedCard.networkLogoUrl;
      existingCard.networkIconUrl = convertedCard.networkIconUrl;

      updatedCount++;
      console.log(`✓ Updated: ${bankName}/${cardName}`);
    } else {
      // Add new card
      banksByBankName[bankName].cards.push(convertedCard);
      addedCount++;
      console.log(`✓ Added: ${bankName}/${cardName}`);
    }
  }

  // Convert back to array format
  let mergedData = Object.values(banksByBankName);

  // Helper function for normalization (reusable)
  function normalizeDisplayName(name: string) {
    return name
      .replace(/^(HDFC|SBI|ICICI|Axis|IDFC|Amex|RBL|IndusInd|Kotak)\s+/i, '')
      .replace(/\s+Credit\s+Card$/i, '')
      .replace(/millenia/gi, 'millennia') // Normalize spelling variant
      .toLowerCase()
      .trim();
  }

  // Helper to check if cardName has bank prefix
  function hasBankPrefix(cardName: string, bankName: string): boolean {
    return (
      cardName.startsWith(bankName + '-') || cardName.startsWith(bankName + '_')
    );
  }

  // Deduplicate cards within each bank based on normalized displayName
  let duplicateMergedCount = 0;
  mergedData = mergedData.map((bank: any) => {
    const seen = new Map<string, number>(); // normalized displayName -> index
    const uniqueCards: any[] = [];

    for (let i = 0; i < bank.cards.length; i++) {
      const card = bank.cards[i];
      const normalized = normalizeDisplayName(card.displayName);

      if (seen.has(normalized)) {
        // Merge with existing card - prefer the one without bank prefix in cardName
        const existingIndex = seen.get(normalized)!;
        const existingCard = uniqueCards[existingIndex];
        const newCard = card;

        // Prefer cardName without bank prefix
        const existingHasPrefix = hasBankPrefix(
          existingCard.cardName,
          bank.bankName,
        );
        const newHasPrefix = hasBankPrefix(newCard.cardName, bank.bankName);

        if (!newHasPrefix && existingHasPrefix) {
          // Replace existing with new (better cardName - no prefix)
          uniqueCards[existingIndex] = { ...newCard };
          const mergedCard = uniqueCards[existingIndex];

          // Merge benefits/offers/milestones from existing
          const existingCategories = new Set(
            mergedCard.benefits.map((b: any) => b.category),
          );
          existingCard.benefits.forEach((b: any) => {
            if (!existingCategories.has(b.category)) {
              mergedCard.benefits.push(b);
              existingCategories.add(b.category);
            }
          });

          // Merge offers
          existingCard.offers.forEach((o: any) => {
            if (
              !mergedCard.offers.some(
                (no: any) => no.description === o.description,
              )
            ) {
              mergedCard.offers.push(o);
            }
          });

          // Merge milestones
          existingCard.milestones.forEach((m: any) => {
            if (
              !mergedCard.milestones.some(
                (nm: any) => nm.description === m.description,
              )
            ) {
              mergedCard.milestones.push(m);
            }
          });

          // Preserve binRanges from existing if new doesn't have them
          if (
            existingCard.binRanges.length > 0 &&
            mergedCard.binRanges.length === 0
          ) {
            mergedCard.binRanges = existingCard.binRanges;
          }

          duplicateMergedCount++;
          console.log(
            `✓ Merged duplicate: ${bank.bankName}/${existingCard.cardName} (removed) into ${mergedCard.cardName} (kept)`,
          );
        } else {
          // Keep existing (it doesn't have prefix or both have prefix)
          const existingCategories = new Set(
            existingCard.benefits.map((b: any) => b.category),
          );
          newCard.benefits.forEach((b: any) => {
            if (!existingCategories.has(b.category)) {
              existingCard.benefits.push(b);
              existingCategories.add(b.category);
            }
          });

          // Merge offers
          newCard.offers.forEach((o: any) => {
            if (
              !existingCard.offers.some(
                (eo: any) => eo.description === o.description,
              )
            ) {
              existingCard.offers.push(o);
            }
          });

          // Merge milestones
          newCard.milestones.forEach((m: any) => {
            if (
              !existingCard.milestones.some(
                (em: any) => em.description === m.description,
              )
            ) {
              existingCard.milestones.push(m);
            }
          });

          // Preserve binRanges from existing if new doesn't have them
          if (
            newCard.binRanges.length > 0 &&
            existingCard.binRanges.length === 0
          ) {
            existingCard.binRanges = newCard.binRanges;
          }

          duplicateMergedCount++;
          console.log(
            `✓ Merged duplicate: ${bank.bankName}/${newCard.cardName} (removed) into ${existingCard.cardName} (kept)`,
          );
        }
      } else {
        seen.set(normalized, uniqueCards.length);
        uniqueCards.push(card);
      }
    }

    return {
      ...bank,
      cards: uniqueCards,
    };
  });

  // Write back to file
  fs.writeFileSync(
    CARDS_JSON_PATH,
    JSON.stringify(mergedData, null, 2),
    'utf-8',
  );

  console.log(`\n✅ Merge completed!`);
  console.log(`   Updated cards: ${updatedCount}`);
  console.log(`   Added cards: ${addedCount}`);
  console.log(`   Duplicates merged: ${duplicateMergedCount}`);
  console.log(`   Total banks: ${mergedData.length}`);
}

/**
 * Read card data from external file or use provided array
 */
function readCardDataFromFile(): any[] {
  // Try to read from a file if it exists, otherwise return empty array
  const cardDataFile = path.resolve(PROJECT_ROOT, 'card-data.js');
  if (fs.existsSync(cardDataFile)) {
    try {
      const fileContent = fs.readFileSync(cardDataFile, 'utf-8');
      // Extract array from file (handle both JSON and JS format)
      if (fileContent.trim().startsWith('[')) {
        return JSON.parse(fileContent);
      }
      // If it's a JS file with exports, we'd need to eval or require - skip for now
    } catch (error) {
      console.warn('⚠️  Could not read card data file:', error);
    }
  }
  return [];
}

/**
 * Main execution
 */
function main() {
  try {
    // New card data (you can paste it here or read from a file)
    // You can also pass data as command line argument or read from stdin
    let newCardsData: any[] = [];

    // Check if card data is passed as argument
    const args = process.argv.slice(2);
    if (args.length > 0) {
      const dataFile = path.resolve(args[0]);
      if (fs.existsSync(dataFile)) {
        let fileContent = fs.readFileSync(dataFile, 'utf-8');
        // Try to parse as JSON first
        try {
          if (fileContent.trim().startsWith('[')) {
            newCardsData = JSON.parse(fileContent);
          } else {
            // Try to extract array from JS file (remove comments, exports, etc.)
            fileContent = fileContent.replace(/\/\/.*$/gm, ''); // Remove single-line comments
            fileContent = fileContent.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
            const arrayMatch = fileContent.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              newCardsData = JSON.parse(arrayMatch[0]);
            }
          }
          console.log(
            `✓ Loaded ${newCardsData.length} cards from file: ${args[0]}`,
          );
        } catch (error) {
          console.error('❌ Error parsing card data file:', error);
          process.exit(1);
        }
      } else {
        console.error(`❌ File not found: ${args[0]}`);
        process.exit(1);
      }
    } else {
      // Try to read from default location
      const defaultFile = path.resolve(PROJECT_ROOT, 'new-cards-data.json');
      if (fs.existsSync(defaultFile)) {
        try {
          const fileContent = fs.readFileSync(defaultFile, 'utf-8');
          newCardsData = JSON.parse(fileContent);
          console.log(
            `✓ Loaded ${newCardsData.length} cards from: new-cards-data.json`,
          );
        } catch (error) {
          console.warn('⚠️  Could not read default file, using empty array');
          newCardsData = [];
        }
      } else {
        // Default data (can be replaced with file read)
        newCardsData = []; // Empty by default - use file or pass as argument
        /*
        // Uncomment and add data here if needed
        newCardsData = [
      {
        card_id: "hdfc_regalia",
        card_name: "HDFC Regalia Credit Card",
        issuer: "HDFC Bank",
        card_type: "rewards",
        card_tier: "Premium",
        joining_fee: 2500,
        annual_fee: 2500,
        renewal_fee: 2500,
        interest_rate: 45.0,
        interest_free_period: 50,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 950,
        fee_waiver_condition: "Annual fee waived on spending ₹3,00,000 in the previous year",
        reward_rate: 4.0,
        cashback_rate: 0.0,
        reward_categories: ["travel", "dining", "shopping"],
        lounge_access: true,
        lounge_access_count: 12,
        fuel_surcharge_waiver: true,
        movie_benefits: true,
        dining_benefits: true,
        travel_benefits: true,
        shopping_benefits: true,
        insurance_coverage: true,
        welcome_benefits: "10,000 reward points on spending ₹1,00,000 in the first 90 days",
        milestone_benefits: "5,000 reward points on spending ₹8,00,000 in a year",
        min_income: 1200000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 750,
        employment_type: ["Salaried", "Self-employed Professional"],
        residence_status: ["Indian Resident", "NRI"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "Visa",
        contactless: true,
        virtual_card: true,
        card_description: "HDFC Regalia is a premium credit card offering comprehensive travel benefits, dining privileges, and reward points on all spends.",
        card_image_url: "https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/b4fd4dcc-da0b-4789-a7a3-d897d67a9f32/Personal/Pay/Cards/Credit-Card/Credit-Cards/Regalia/regalia-card.png",
        apply_url: "https://www.hdfcbank.com/personal/pay/cards/credit-cards/regalia-credit-card",
        popularity_score: 8.7
      },
      {
        card_id: "hdfc_millenia",
        card_name: "HDFC Millenia Credit Card",
        issuer: "HDFC Bank",
        card_type: "rewards",
        card_tier: "Gold",
        joining_fee: 1000,
        annual_fee: 1000,
        renewal_fee: 1000,
        interest_rate: 45.0,
        interest_free_period: 50,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 950,
        fee_waiver_condition: "Annual fee waived on spending ₹1,00,000 in the previous year",
        reward_rate: 5.0,
        cashback_rate: 0.0,
        reward_categories: ["online", "dining", "shopping"],
        lounge_access: true,
        lounge_access_count: 8,
        fuel_surcharge_waiver: true,
        movie_benefits: true,
        dining_benefits: true,
        travel_benefits: false,
        shopping_benefits: true,
        insurance_coverage: false,
        welcome_benefits: "1,000 reward points on spending ₹1,000 in the first 30 days",
        milestone_benefits: "",
        min_income: 600000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 700,
        employment_type: ["Salaried", "Self-employed Professional", "Business Owner"],
        residence_status: ["Indian Resident", "NRI"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "Visa",
        contactless: true,
        virtual_card: true,
        card_description: "HDFC Millenia Credit Card offers accelerated rewards on online spends, dining, and shopping, making it ideal for digital-first customers.",
        card_image_url: "https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/1f31c4ad-e650-4de5-9f91-625a2e3c6a8e/Personal/Pay/Cards/Credit-Card/Credit-Cards/Millennia/millennia-card.png",
        apply_url: "https://www.hdfcbank.com/personal/pay/cards/credit-cards/millennia-credit-card",
        popularity_score: 8.5
      },
      {
        card_id: "hdfc_moneyback",
        card_name: "HDFC MoneyBack Credit Card",
        issuer: "HDFC Bank",
        card_type: "cashback",
        card_tier: "Classic",
        joining_fee: 500,
        annual_fee: 500,
        renewal_fee: 500,
        interest_rate: 45.0,
        interest_free_period: 50,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 950,
        fee_waiver_condition: "Annual fee waived on spending ₹50,000 in the previous year",
        reward_rate: 2.0,
        cashback_rate: 0.5,
        reward_categories: ["groceries", "utility", "telecom"],
        lounge_access: false,
        lounge_access_count: 0,
        fuel_surcharge_waiver: true,
        movie_benefits: false,
        dining_benefits: false,
        travel_benefits: false,
        shopping_benefits: true,
        insurance_coverage: false,
        welcome_benefits: "₹500 cashback on spending ₹5,000 in the first 30 days",
        milestone_benefits: "",
        min_income: 300000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 700,
        employment_type: ["Salaried", "Self-employed Professional", "Business Owner"],
        residence_status: ["Indian Resident"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "Mastercard",
        contactless: true,
        virtual_card: true,
        card_description: "HDFC MoneyBack Credit Card offers cashback on everyday spends like groceries, utility bills, and telecom bills.",
        card_image_url: "https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/5a3c9a2d-2e0c-4e1c-a9b7-f5e5e7c5c8c9/Personal/Pay/Cards/Credit-Card/Credit-Cards/MoneyBack/moneyback-card.png",
        apply_url: "https://www.hdfcbank.com/personal/pay/cards/credit-cards/moneyback-credit-card",
        popularity_score: 7.8
      },
      {
        card_id: "sbi_simplysave",
        card_name: "SBI SimplySAVE Credit Card",
        issuer: "SBI Card",
        card_type: "rewards",
        card_tier: "Classic",
        joining_fee: 499,
        annual_fee: 499,
        renewal_fee: 499,
        interest_rate: 45.0,
        interest_free_period: 45,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 900,
        fee_waiver_condition: "Annual fee waived on spending ₹1,00,000 in the previous year",
        reward_rate: 10.0,
        cashback_rate: 0.0,
        reward_categories: ["groceries", "dining", "entertainment", "utility"],
        lounge_access: true,
        lounge_access_count: 4,
        fuel_surcharge_waiver: true,
        movie_benefits: true,
        dining_benefits: true,
        travel_benefits: false,
        shopping_benefits: true,
        insurance_coverage: false,
        welcome_benefits: "2,000 reward points on card activation",
        milestone_benefits: "",
        min_income: 300000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 700,
        employment_type: ["Salaried", "Self-employed Professional", "Business Owner"],
        residence_status: ["Indian Resident"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "Visa",
        contactless: true,
        virtual_card: true,
        card_description: "SBI SimplySAVE Credit Card offers accelerated rewards on everyday spends like groceries, dining, and entertainment.",
        card_image_url: "https://www.sbicard.com/sbi-card-en/assets/media/images/personal/credit-cards/shopping/simplysave-sbi-card/simplysave-sbi-card.png",
        apply_url: "https://www.sbicard.com/en/personal/credit-cards/shopping/simplysave-sbi-card.page",
        popularity_score: 8.0
      },
      {
        card_id: "sbi_simplyclick",
        card_name: "SBI SimplyCLICK Credit Card",
        issuer: "SBI Card",
        card_type: "rewards",
        card_tier: "Classic",
        joining_fee: 499,
        annual_fee: 499,
        renewal_fee: 499,
        interest_rate: 45.0,
        interest_free_period: 45,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 900,
        fee_waiver_condition: "Annual fee waived on spending ₹1,00,000 in the previous year",
        reward_rate: 10.0,
        cashback_rate: 0.0,
        reward_categories: ["online shopping", "entertainment", "food delivery"],
        lounge_access: true,
        lounge_access_count: 4,
        fuel_surcharge_waiver: true,
        movie_benefits: true,
        dining_benefits: false,
        travel_benefits: false,
        shopping_benefits: true,
        insurance_coverage: false,
        welcome_benefits: "₹500 worth of Amazon gift card on card activation",
        milestone_benefits: "",
        min_income: 300000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 700,
        employment_type: ["Salaried", "Self-employed Professional", "Business Owner"],
        residence_status: ["Indian Resident"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "Mastercard",
        contactless: true,
        virtual_card: true,
        card_description: "SBI SimplyCLICK Credit Card offers accelerated rewards on online spends, making it ideal for digital-first customers.",
        card_image_url: "https://www.sbicard.com/sbi-card-en/assets/media/images/personal/credit-cards/shopping/simplyclick-sbi-card/simplyclick-sbi-card.png",
        apply_url: "https://www.sbicard.com/en/personal/credit-cards/shopping/simplyclick-sbi-card.page",
        popularity_score: 8.2
      },
      {
        card_id: "sbi_prime",
        card_name: "SBI Card PRIME",
        issuer: "SBI Card",
        card_type: "lifestyle",
        card_tier: "Premium",
        joining_fee: 2999,
        annual_fee: 2999,
        renewal_fee: 2999,
        interest_rate: 45.0,
        interest_free_period: 45,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 950,
        fee_waiver_condition: "Annual fee waived on spending ₹3,00,000 in the previous year",
        reward_rate: 5.0,
        cashback_rate: 0.0,
        reward_categories: ["dining", "entertainment", "travel", "shopping"],
        lounge_access: true,
        lounge_access_count: 12,
        fuel_surcharge_waiver: true,
        movie_benefits: true,
        dining_benefits: true,
        travel_benefits: true,
        shopping_benefits: true,
        insurance_coverage: true,
        welcome_benefits: "5,000 reward points on card activation",
        milestone_benefits: "10,000 bonus points on spending ₹6,00,000 in a year",
        min_income: 1200000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 750,
        employment_type: ["Salaried", "Self-employed Professional"],
        residence_status: ["Indian Resident", "NRI"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "Visa",
        contactless: true,
        virtual_card: true,
        card_description: "SBI Card PRIME is a premium lifestyle credit card offering comprehensive benefits across dining, entertainment, travel, and shopping.",
        card_image_url: "https://www.sbicard.com/sbi-card-en/assets/media/images/personal/credit-cards/travel-and-fuel/sbi-card-prime/sbi-card-prime.png",
        apply_url: "https://www.sbicard.com/en/personal/credit-cards/travel-and-fuel/sbi-card-prime.page",
        popularity_score: 8.5
      },
      {
        card_id: "icici_amazon_pay",
        card_name: "Amazon Pay ICICI Credit Card",
        issuer: "ICICI Bank",
        card_type: "cashback",
        card_tier: "Classic",
        joining_fee: 0,
        annual_fee: 0,
        renewal_fee: 0,
        interest_rate: 44.0,
        interest_free_period: 50,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 900,
        fee_waiver_condition: "Lifetime free card",
        reward_rate: 0.0,
        cashback_rate: 5.0,
        reward_categories: ["amazon", "online shopping", "utility"],
        lounge_access: false,
        lounge_access_count: 0,
        fuel_surcharge_waiver: true,
        movie_benefits: false,
        dining_benefits: false,
        travel_benefits: false,
        shopping_benefits: true,
        insurance_coverage: false,
        welcome_benefits: "₹500 Amazon Pay balance on card activation",
        milestone_benefits: "",
        min_income: 300000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 700,
        employment_type: ["Salaried", "Self-employed Professional", "Business Owner"],
        residence_status: ["Indian Resident"],
        co_branded: true,
        co_brand_partner: "Amazon",
        card_network: "Visa",
        contactless: true,
        virtual_card: true,
        card_description: "Amazon Pay ICICI Credit Card offers unlimited 5% cashback on Amazon.in shopping for Prime members and 3% for non-Prime members.",
        card_image_url: "https://www.icicibank.com/content/dam/icicibank/india/managed-assets/images/credit-card/amazon-pay-icici-bank-credit-card.png",
        apply_url: "https://www.icicibank.com/personal-banking/cards/credit-cards/amazon-pay-credit-card",
        popularity_score: 9.0
      },
      {
        card_id: "icici_coral",
        card_name: "ICICI Bank Coral Credit Card",
        issuer: "ICICI Bank",
        card_type: "rewards",
        card_tier: "Classic",
        joining_fee: 500,
        annual_fee: 500,
        renewal_fee: 500,
        interest_rate: 44.0,
        interest_free_period: 50,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 900,
        fee_waiver_condition: "Annual fee waived on spending ₹1,50,000 in the previous year",
        reward_rate: 2.0,
        cashback_rate: 0.0,
        reward_categories: ["dining", "entertainment", "utility"],
        lounge_access: true,
        lounge_access_count: 4,
        fuel_surcharge_waiver: true,
        movie_benefits: true,
        dining_benefits: true,
        travel_benefits: false,
        shopping_benefits: true,
        insurance_coverage: false,
        welcome_benefits: "1,000 reward points on spending ₹10,000 in the first 30 days",
        milestone_benefits: "",
        min_income: 300000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 700,
        employment_type: ["Salaried", "Self-employed Professional", "Business Owner"],
        residence_status: ["Indian Resident"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "Mastercard",
        contactless: true,
        virtual_card: true,
        card_description: "ICICI Bank Coral Credit Card is an entry-level rewards card offering benefits on dining, entertainment, and utility bill payments.",
        card_image_url: "https://www.icicibank.com/content/dam/icicibank/india/managed-assets/images/credit-card/coral-credit-card.png",
        apply_url: "https://www.icicibank.com/personal-banking/cards/credit-cards/coral-credit-card",
        popularity_score: 7.5
      },
      {
        card_id: "icici_emeralde",
        card_name: "ICICI Bank Emeralde Credit Card",
        issuer: "ICICI Bank",
        card_type: "premium",
        card_tier: "Super Premium",
        joining_fee: 12000,
        annual_fee: 12000,
        renewal_fee: 12000,
        interest_rate: 44.0,
        interest_free_period: 50,
        forex_markup: 2.0,
        cash_advance_fee: 2.5,
        late_payment_fee: 950,
        fee_waiver_condition: "Annual fee waived on spending ₹12,00,000 in the previous year",
        reward_rate: 4.0,
        cashback_rate: 0.0,
        reward_categories: ["travel", "dining", "shopping", "entertainment"],
        lounge_access: true,
        lounge_access_count: 24,
        fuel_surcharge_waiver: true,
        movie_benefits: true,
        dining_benefits: true,
        travel_benefits: true,
        shopping_benefits: true,
        insurance_coverage: true,
        welcome_benefits: "10,000 reward points on card activation",
        milestone_benefits: "20,000 bonus points on spending ₹15,00,000 in a year",
        min_income: 3000000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 800,
        employment_type: ["Salaried", "Self-employed Professional"],
        residence_status: ["Indian Resident", "NRI"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "Visa",
        contactless: true,
        virtual_card: true,
        card_description: "ICICI Bank Emeralde Credit Card is a super premium card offering exclusive privileges including concierge services, golf benefits, and premium lounge access.",
        card_image_url: "https://www.icicibank.com/content/dam/icicibank/india/managed-assets/images/credit-card/emeralde-credit-card.png",
        apply_url: "https://www.icicibank.com/personal-banking/cards/credit-cards/emeralde-credit-card",
        popularity_score: 8.8
      },
      {
        card_id: "axis_ace",
        card_name: "Axis Bank ACE Credit Card",
        issuer: "Axis Bank",
        card_type: "cashback",
        card_tier: "Classic",
        joining_fee: 499,
        annual_fee: 499,
        renewal_fee: 499,
        interest_rate: 52.86,
        interest_free_period: 50,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 900,
        fee_waiver_condition: "Annual fee waived on spending ₹2,00,000 in the previous year",
        reward_rate: 0.0,
        cashback_rate: 5.0,
        reward_categories: ["utility", "bill payments", "insurance"],
        lounge_access: true,
        lounge_access_count: 4,
        fuel_surcharge_waiver: true,
        movie_benefits: false,
        dining_benefits: false,
        travel_benefits: false,
        shopping_benefits: false,
        insurance_coverage: false,
        welcome_benefits: "₹500 cashback on spending ₹5,000 in the first 30 days",
        milestone_benefits: "",
        min_income: 300000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 700,
        employment_type: ["Salaried", "Self-employed Professional", "Business Owner"],
        residence_status: ["Indian Resident"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "Visa",
        contactless: true,
        virtual_card: true,
        card_description: "Axis Bank ACE Credit Card offers 5% cashback on bill payments, making it ideal for managing monthly expenses.",
        card_image_url: "https://www.axisbank.com/images/default-source/default-album/ace-credit-card.jpg",
        apply_url: "https://www.axisbank.com/retail/cards/credit-card/ace-credit-card",
        popularity_score: 8.3
      },
      {
        card_id: "axis_flipkart",
        card_name: "Flipkart Axis Bank Credit Card",
        issuer: "Axis Bank",
        card_type: "cashback",
        card_tier: "Classic",
        joining_fee: 500,
        annual_fee: 500,
        renewal_fee: 500,
        interest_rate: 52.86,
        interest_free_period: 50,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 900,
        fee_waiver_condition: "Annual fee waived on spending ₹2,00,000 in the previous year",
        reward_rate: 0.0,
        cashback_rate: 5.0,
        reward_categories: ["flipkart", "online shopping", "travel", "dining"],
        lounge_access: true,
        lounge_access_count: 4,
        fuel_surcharge_waiver: true,
        movie_benefits: true,
        dining_benefits: true,
        travel_benefits: false,
        shopping_benefits: true,
        insurance_coverage: false,
        welcome_benefits: "₹500 Flipkart voucher on card activation",
        milestone_benefits: "",
        min_income: 300000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 700,
        employment_type: ["Salaried", "Self-employed Professional", "Business Owner"],
        residence_status: ["Indian Resident"],
        co_branded: true,
        co_brand_partner: "Flipkart",
        card_network: "Visa",
        contactless: true,
        virtual_card: true,
        card_description: "Flipkart Axis Bank Credit Card offers unlimited 5% cashback on Flipkart and Myntra, and 4% on preferred partners including Swiggy and PVR.",
        card_image_url: "https://www.axisbank.com/images/default-source/default-album/flipkart-axis-bank-credit-card.jpg",
        apply_url: "https://www.axisbank.com/retail/cards/credit-card/flipkart-axis-bank-credit-card",
        popularity_score: 8.7
      },
      {
        card_id: "idfc_first_select",
        card_name: "IDFC FIRST Select Credit Card",
        issuer: "IDFC FIRST Bank",
        card_type: "rewards",
        card_tier: "Classic",
        joining_fee: 0,
        annual_fee: 0,
        renewal_fee: 0,
        interest_rate: 47.88,
        interest_free_period: 50,
        forex_markup: 1.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 600,
        fee_waiver_condition: "Lifetime free card",
        reward_rate: 10.0,
        cashback_rate: 0.0,
        reward_categories: ["dining", "shopping", "travel", "utility"],
        lounge_access: true,
        lounge_access_count: 4,
        fuel_surcharge_waiver: true,
        movie_benefits: true,
        dining_benefits: true,
        travel_benefits: true,
        shopping_benefits: true,
        insurance_coverage: false,
        welcome_benefits: "2,000 reward points on spending ₹10,000 in the first 30 days",
        milestone_benefits: "",
        min_income: 300000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 700,
        employment_type: ["Salaried", "Self-employed Professional", "Business Owner"],
        residence_status: ["Indian Resident"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "Visa",
        contactless: true,
        virtual_card: true,
        card_description: "IDFC FIRST Select Credit Card is a lifetime free card offering 10X rewards on dining, shopping, and travel, with a low forex markup of 1.5%.",
        card_image_url: "https://www.idfcfirstbank.com/content/dam/idfcfirstbank/images/personal-banking/cards/credit-cards/select-credit-card/select-credit-card.png",
        apply_url: "https://www.idfcfirstbank.com/personal-banking/cards/credit-cards/select-credit-card",
        popularity_score: 8.9
      },
      {
        card_id: "amex_membership_rewards",
        card_name: "American Express Membership Rewards Credit Card",
        issuer: "American Express",
        card_type: "rewards",
        card_tier: "Classic",
        joining_fee: 1000,
        annual_fee: 1000,
        renewal_fee: 1000,
        interest_rate: 42.0,
        interest_free_period: 52,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 900,
        fee_waiver_condition: "Annual fee waived on spending ₹1,50,000 in the previous year",
        reward_rate: 1.0,
        cashback_rate: 0.0,
        reward_categories: ["dining", "shopping", "travel", "entertainment"],
        lounge_access: true,
        lounge_access_count: 4,
        fuel_surcharge_waiver: true,
        movie_benefits: true,
        dining_benefits: true,
        travel_benefits: true,
        shopping_benefits: true,
        insurance_coverage: true,
        welcome_benefits: "4,000 membership rewards points on spending ₹20,000 in the first 90 days",
        milestone_benefits: "",
        min_income: 600000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 750,
        employment_type: ["Salaried", "Self-employed Professional"],
        residence_status: ["Indian Resident", "NRI"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "American Express",
        contactless: true,
        virtual_card: true,
        card_description: "American Express Membership Rewards Credit Card offers flexible rewards points that can be redeemed for a variety of options including travel, shopping, and dining.",
        card_image_url: "https://www.americanexpress.com/content/dam/amex/in/benefits/MR_Card.png",
        apply_url: "https://www.americanexpress.com/in/credit-cards/membership-rewards-card/",
        popularity_score: 8.0
      },
      {
        card_id: "rbl_shoprite",
        card_name: "RBL Bank ShopRite Credit Card",
        issuer: "RBL Bank",
        card_type: "cashback",
        card_tier: "Classic",
        joining_fee: 0,
        annual_fee: 0,
        renewal_fee: 0,
        interest_rate: 36.0,
        interest_free_period: 50,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 750,
        fee_waiver_condition: "Lifetime free card",
        reward_rate: 0.0,
        cashback_rate: 5.0,
        reward_categories: ["groceries", "shopping", "utility"],
        lounge_access: false,
        lounge_access_count: 0,
        fuel_surcharge_waiver: true,
        movie_benefits: false,
        dining_benefits: false,
        travel_benefits: false,
        shopping_benefits: true,
        insurance_coverage: false,
        welcome_benefits: "₹500 cashback on spending ₹5,000 in the first 30 days",
        milestone_benefits: "",
        min_income: 240000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 700,
        employment_type: ["Salaried", "Self-employed Professional", "Business Owner"],
        residence_status: ["Indian Resident"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "Mastercard",
        contactless: true,
        virtual_card: true,
        card_description: "RBL Bank ShopRite Credit Card is a lifetime free card offering 5% cashback on groceries and shopping.",
        card_image_url: "https://www.rblbank.com/sites/default/files/shoprite-credit-card.png",
        apply_url: "https://www.rblbank.com/credit-cards/shoprite-credit-card",
        popularity_score: 7.5
      },
      {
        card_id: "indusind_platinum",
        card_name: "IndusInd Bank Platinum Credit Card",
        issuer: "IndusInd Bank",
        card_type: "rewards",
        card_tier: "Platinum",
        joining_fee: 1000,
        annual_fee: 1000,
        renewal_fee: 1000,
        interest_rate: 36.0,
        interest_free_period: 50,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 900,
        fee_waiver_condition: "Annual fee waived on spending ₹1,50,000 in the previous year",
        reward_rate: 2.0,
        cashback_rate: 0.0,
        reward_categories: ["dining", "shopping", "travel", "entertainment"],
        lounge_access: true,
        lounge_access_count: 8,
        fuel_surcharge_waiver: true,
        movie_benefits: true,
        dining_benefits: true,
        travel_benefits: true,
        shopping_benefits: true,
        insurance_coverage: true,
        welcome_benefits: "2,000 reward points on card activation",
        milestone_benefits: "",
        min_income: 600000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 750,
        employment_type: ["Salaried", "Self-employed Professional"],
        residence_status: ["Indian Resident", "NRI"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "Visa",
        contactless: true,
        virtual_card: true,
        card_description: "IndusInd Bank Platinum Credit Card offers comprehensive benefits across dining, shopping, travel, and entertainment.",
        card_image_url: "https://www.indusind.com/content/dam/indusind/personal-banking/credit-cards/platinum-credit-card.jpg",
        apply_url: "https://www.indusind.com/personal-banking/cards/credit-cards/platinum-credit-card.html",
        popularity_score: 7.8
      },
      {
        card_id: "kotak_811",
        card_name: "Kotak 811 #DreamDifferent Credit Card",
        issuer: "Kotak Mahindra Bank",
        card_type: "cashback",
        card_tier: "Classic",
        joining_fee: 0,
        annual_fee: 0,
        renewal_fee: 0,
        interest_rate: 42.0,
        interest_free_period: 50,
        forex_markup: 3.5,
        cash_advance_fee: 2.5,
        late_payment_fee: 900,
        fee_waiver_condition: "Lifetime free card",
        reward_rate: 0.0,
        cashback_rate: 1.0,
        reward_categories: ["dining", "shopping", "entertainment", "utility"],
        lounge_access: false,
        lounge_access_count: 0,
        fuel_surcharge_waiver: true,
        movie_benefits: false,
        dining_benefits: false,
        travel_benefits: false,
        shopping_benefits: true,
        insurance_coverage: false,
        welcome_benefits: "₹500 cashback on spending ₹5,000 in the first 30 days",
        milestone_benefits: "",
        min_income: 240000,
        min_age: 21,
        max_age: 65,
        credit_score_required: 700,
        employment_type: ["Salaried", "Self-employed Professional", "Business Owner"],
        residence_status: ["Indian Resident"],
        co_branded: false,
        co_brand_partner: "",
        card_network: "Visa",
        contactless: true,
        virtual_card: true,
        card_description: "Kotak 811 #DreamDifferent Credit Card is a lifetime free card offering 1% cashback on all spends with no minimum spend requirement.",
        card_image_url: "https://www.kotak.com/content/dam/Kotak/product_assets/credit_cards/811-dream-different-credit-card.jpg",
        apply_url: "https://www.kotak.com/en/personal-banking/cards/credit-cards/811-dreamdifferent-credit-card.html",
        popularity_score: 7.5
      },
    ];
    */
      }
    }
    mergeCardData(newCardsData);
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

/**
 * Indian Merchant Database for Transaction Categorization
 * Contains mappings of popular Indian merchants to their categories
 */

import type { TransactionCategory } from '@finmatter/types';

export interface MerchantMapping {
  merchantName: string;
  category: TransactionCategory;
  aliases: string[];
  confidence: number; // 0-1
  subcategory?: string;
}

/**
 * Comprehensive database of Indian merchants and their categories
 * Organized by category for easy maintenance
 */
export const INDIAN_MERCHANT_DATABASE: MerchantMapping[] = [
  // DINING
  {
    merchantName: 'SWIGGY',
    category: 'dining',
    aliases: ['SWIGGY FOOD', 'SWIGGY INSTAMART', 'SWIGGY GENIE'],
    confidence: 0.95,
    subcategory: 'food_delivery',
  },
  {
    merchantName: 'ZOMATO',
    category: 'dining',
    aliases: ['ZOMATO FOOD', 'ZOMATO GOLD', 'ZOMATO PRO'],
    confidence: 0.95,
    subcategory: 'food_delivery',
  },
  {
    merchantName: 'UBER EATS',
    category: 'dining',
    aliases: ['UBER EATS INDIA'],
    confidence: 0.95,
    subcategory: 'food_delivery',
  },
  {
    merchantName: 'DUNZO',
    category: 'dining',
    aliases: ['DUNZO DAILY'],
    confidence: 0.9,
    subcategory: 'food_delivery',
  },
  {
    merchantName: 'DOMINOS',
    category: 'dining',
    aliases: ['DOMINOS PIZZA', 'DOMINOS INDIA'],
    confidence: 0.95,
    subcategory: 'restaurant',
  },
  {
    merchantName: 'PIZZA HUT',
    category: 'dining',
    aliases: ['PIZZA HUT INDIA'],
    confidence: 0.95,
    subcategory: 'restaurant',
  },
  {
    merchantName: 'KFC',
    category: 'dining',
    aliases: ['KFC INDIA'],
    confidence: 0.95,
    subcategory: 'restaurant',
  },
  {
    merchantName: 'MCDONALDS',
    category: 'dining',
    aliases: ['MCDONALDS INDIA'],
    confidence: 0.95,
    subcategory: 'restaurant',
  },
  {
    merchantName: 'SUBWAY',
    category: 'dining',
    aliases: ['SUBWAY INDIA'],
    confidence: 0.95,
    subcategory: 'restaurant',
  },
  {
    merchantName: 'STARBUCKS',
    category: 'dining',
    aliases: ['STARBUCKS INDIA'],
    confidence: 0.95,
    subcategory: 'cafe',
  },
  {
    merchantName: 'COFFEE DAY',
    category: 'dining',
    aliases: ['CAFE COFFEE DAY', 'CCD'],
    confidence: 0.95,
    subcategory: 'cafe',
  },

  // GROCERIES
  {
    merchantName: 'BIGBAZAAR',
    category: 'groceries',
    aliases: ['BIG BAZAAR'],
    confidence: 0.95,
    subcategory: 'supermarket',
  },
  {
    merchantName: 'RELIANCE FRESH',
    category: 'groceries',
    aliases: ['RELIANCE SMART', 'RELIANCE TRENDS'],
    confidence: 0.95,
    subcategory: 'supermarket',
  },
  {
    merchantName: 'DMART',
    category: 'groceries',
    aliases: ['D MART', 'DMART INDIA'],
    confidence: 0.95,
    subcategory: 'supermarket',
  },
  {
    merchantName: 'MORE',
    category: 'groceries',
    aliases: ['MORE SUPERMARKET'],
    confidence: 0.9,
    subcategory: 'supermarket',
  },
  {
    merchantName: 'SPAR',
    category: 'groceries',
    aliases: ['SPAR SUPERMARKET'],
    confidence: 0.9,
    subcategory: 'supermarket',
  },
  {
    merchantName: 'GROFERS',
    category: 'groceries',
    aliases: ['GROFERS INDIA', 'BLINKIT'],
    confidence: 0.95,
    subcategory: 'online_grocery',
  },
  {
    merchantName: 'BIGBASKET',
    category: 'groceries',
    aliases: ['BIG BASKET'],
    confidence: 0.95,
    subcategory: 'online_grocery',
  },
  {
    merchantName: 'AMAZON FRESH',
    category: 'groceries',
    aliases: ['AMAZON FRESH INDIA'],
    confidence: 0.95,
    subcategory: 'online_grocery',
  },

  // SHOPPING
  {
    merchantName: 'AMAZON',
    category: 'shopping',
    aliases: ['AMAZON INDIA', 'AMAZON PRIME'],
    confidence: 0.95,
    subcategory: 'online_shopping',
  },
  {
    merchantName: 'FLIPKART',
    category: 'shopping',
    aliases: ['FLIPKART INDIA'],
    confidence: 0.95,
    subcategory: 'online_shopping',
  },
  {
    merchantName: 'MYNTRA',
    category: 'shopping',
    aliases: ['MYNTRA INDIA'],
    confidence: 0.95,
    subcategory: 'fashion',
  },
  {
    merchantName: 'AJIO',
    category: 'shopping',
    aliases: ['AJIO INDIA'],
    confidence: 0.95,
    subcategory: 'fashion',
  },
  {
    merchantName: 'NYKAA',
    category: 'shopping',
    aliases: ['NYKAA INDIA'],
    confidence: 0.95,
    subcategory: 'beauty',
  },
  {
    merchantName: 'LENSKART',
    category: 'shopping',
    aliases: ['LENSKART INDIA'],
    confidence: 0.95,
    subcategory: 'eyewear',
  },
  {
    merchantName: 'TITAN',
    category: 'shopping',
    aliases: ['TITAN WATCHES'],
    confidence: 0.9,
    subcategory: 'watches',
  },
  {
    merchantName: 'CROMA',
    category: 'shopping',
    aliases: ['CROMA INDIA'],
    confidence: 0.95,
    subcategory: 'electronics',
  },
  {
    merchantName: 'VIVO',
    category: 'shopping',
    aliases: ['VIVO INDIA'],
    confidence: 0.9,
    subcategory: 'electronics',
  },
  {
    merchantName: 'OPPO',
    category: 'shopping',
    aliases: ['OPPO INDIA'],
    confidence: 0.9,
    subcategory: 'electronics',
  },
  {
    merchantName: 'SAMSUNG',
    category: 'shopping',
    aliases: ['SAMSUNG INDIA'],
    confidence: 0.9,
    subcategory: 'electronics',
  },
  {
    merchantName: 'APPLE',
    category: 'shopping',
    aliases: ['APPLE INDIA', 'APPLE STORE'],
    confidence: 0.95,
    subcategory: 'electronics',
  },

  // FUEL
  {
    merchantName: 'INDIAN OIL',
    category: 'fuel',
    aliases: ['IOCL', 'INDIAN OIL CORPORATION'],
    confidence: 0.95,
    subcategory: 'petrol_pump',
  },
  {
    merchantName: 'HP',
    category: 'fuel',
    aliases: ['HP PETROLEUM', 'HINDUSTAN PETROLEUM'],
    confidence: 0.95,
    subcategory: 'petrol_pump',
  },
  {
    merchantName: 'BPCL',
    category: 'fuel',
    aliases: ['BHARAT PETROLEUM', 'BP PETROLEUM'],
    confidence: 0.95,
    subcategory: 'petrol_pump',
  },
  {
    merchantName: 'SHELL',
    category: 'fuel',
    aliases: ['SHELL INDIA'],
    confidence: 0.95,
    subcategory: 'petrol_pump',
  },
  {
    merchantName: 'RELIANCE PETROLEUM',
    category: 'fuel',
    aliases: ['RELIANCE PETROL'],
    confidence: 0.9,
    subcategory: 'petrol_pump',
  },

  // TRAVEL
  {
    merchantName: 'IRCTC',
    category: 'travel',
    aliases: ['INDIAN RAILWAYS'],
    confidence: 0.95,
    subcategory: 'railway',
  },
  {
    merchantName: 'MAKEMYTRIP',
    category: 'travel',
    aliases: ['MAKE MY TRIP', 'MMT'],
    confidence: 0.95,
    subcategory: 'travel_booking',
  },
  {
    merchantName: 'YATRA',
    category: 'travel',
    aliases: ['YATRA INDIA'],
    confidence: 0.95,
    subcategory: 'travel_booking',
  },
  {
    merchantName: 'CLEARTRIP',
    category: 'travel',
    aliases: ['CLEAR TRIP'],
    confidence: 0.95,
    subcategory: 'travel_booking',
  },
  {
    merchantName: 'OYO',
    category: 'travel',
    aliases: ['OYO ROOMS'],
    confidence: 0.95,
    subcategory: 'hotel',
  },
  {
    merchantName: 'GOIBIBO',
    category: 'travel',
    aliases: ['GO IBIBO'],
    confidence: 0.9,
    subcategory: 'travel_booking',
  },
  {
    merchantName: 'UBER',
    category: 'travel',
    aliases: ['UBER INDIA'],
    confidence: 0.95,
    subcategory: 'ride_sharing',
  },
  {
    merchantName: 'OLA',
    category: 'travel',
    aliases: ['OLA INDIA'],
    confidence: 0.95,
    subcategory: 'ride_sharing',
  },
  {
    merchantName: 'RAPIDO',
    category: 'travel',
    aliases: ['RAPIDO INDIA'],
    confidence: 0.9,
    subcategory: 'ride_sharing',
  },

  // ENTERTAINMENT
  {
    merchantName: 'NETFLIX',
    category: 'entertainment',
    aliases: ['NETFLIX INDIA'],
    confidence: 0.95,
    subcategory: 'streaming',
  },
  {
    merchantName: 'AMAZON PRIME',
    category: 'entertainment',
    aliases: ['PRIME VIDEO'],
    confidence: 0.95,
    subcategory: 'streaming',
  },
  {
    merchantName: 'DISNEY HOTSTAR',
    category: 'entertainment',
    aliases: ['HOTSTAR', 'DISNEY PLUS'],
    confidence: 0.95,
    subcategory: 'streaming',
  },
  {
    merchantName: 'ZEE5',
    category: 'entertainment',
    aliases: ['ZEE 5'],
    confidence: 0.9,
    subcategory: 'streaming',
  },
  {
    merchantName: 'SONY LIV',
    category: 'entertainment',
    aliases: ['SONYLIV'],
    confidence: 0.9,
    subcategory: 'streaming',
  },
  {
    merchantName: 'BOOKMYSHOW',
    category: 'entertainment',
    aliases: ['BOOK MY SHOW', 'BMS'],
    confidence: 0.95,
    subcategory: 'movies',
  },
  {
    merchantName: 'PVR',
    category: 'entertainment',
    aliases: ['PVR CINEMAS'],
    confidence: 0.95,
    subcategory: 'movies',
  },
  {
    merchantName: 'INOX',
    category: 'entertainment',
    aliases: ['INOX CINEMAS'],
    confidence: 0.95,
    subcategory: 'movies',
  },
  {
    merchantName: 'CINEPOLIS',
    category: 'entertainment',
    aliases: ['CINEPOLIS INDIA'],
    confidence: 0.9,
    subcategory: 'movies',
  },

  // BILLS & UTILITIES
  {
    merchantName: 'AIRTEL',
    category: 'bills',
    aliases: ['AIRTEL INDIA'],
    confidence: 0.95,
    subcategory: 'mobile',
  },
  {
    merchantName: 'JIO',
    category: 'bills',
    aliases: ['RELIANCE JIO'],
    confidence: 0.95,
    subcategory: 'mobile',
  },
  {
    merchantName: 'VODAFONE',
    category: 'bills',
    aliases: ['VODAFONE IDEA', 'VI'],
    confidence: 0.95,
    subcategory: 'mobile',
  },
  {
    merchantName: 'BSNL',
    category: 'bills',
    aliases: ['BSNL INDIA'],
    confidence: 0.9,
    subcategory: 'mobile',
  },
  {
    merchantName: 'ELECTRICITY',
    category: 'utilities',
    aliases: ['POWER', 'ELECTRIC BILL'],
    confidence: 0.8,
    subcategory: 'electricity',
  },
  {
    merchantName: 'WATER',
    category: 'utilities',
    aliases: ['WATER BILL'],
    confidence: 0.8,
    subcategory: 'water',
  },
  {
    merchantName: 'GAS',
    category: 'utilities',
    aliases: ['LPG', 'GAS BILL'],
    confidence: 0.8,
    subcategory: 'gas',
  },

  // HEALTHCARE
  {
    merchantName: 'APOLLO',
    category: 'healthcare',
    aliases: ['APOLLO HOSPITALS'],
    confidence: 0.95,
    subcategory: 'hospital',
  },
  {
    merchantName: 'FORTIS',
    category: 'healthcare',
    aliases: ['FORTIS HEALTHCARE'],
    confidence: 0.95,
    subcategory: 'hospital',
  },
  {
    merchantName: 'MAX',
    category: 'healthcare',
    aliases: ['MAX HEALTHCARE'],
    confidence: 0.9,
    subcategory: 'hospital',
  },
  {
    merchantName: 'MEDPLUS',
    category: 'healthcare',
    aliases: ['MEDPLUS PHARMACY'],
    confidence: 0.95,
    subcategory: 'pharmacy',
  },
  {
    merchantName: 'APOLLO PHARMACY',
    category: 'healthcare',
    aliases: ['APOLLO PHARMA'],
    confidence: 0.95,
    subcategory: 'pharmacy',
  },
  {
    merchantName: 'NETMEDS',
    category: 'healthcare',
    aliases: ['NETMEDS INDIA'],
    confidence: 0.95,
    subcategory: 'online_pharmacy',
  },
  {
    merchantName: '1MG',
    category: 'healthcare',
    aliases: ['1 MG', 'ONE MG'],
    confidence: 0.95,
    subcategory: 'online_pharmacy',
  },

  // EDUCATION
  {
    merchantName: 'BYJUS',
    category: 'education',
    aliases: ["BYJU'S", 'BYJUS INDIA'],
    confidence: 0.95,
    subcategory: 'online_learning',
  },
  {
    merchantName: 'UNACADEMY',
    category: 'education',
    aliases: ['UNACADEMY INDIA'],
    confidence: 0.95,
    subcategory: 'online_learning',
  },
  {
    merchantName: 'VEDANTU',
    category: 'education',
    aliases: ['VEDANTU INDIA'],
    confidence: 0.9,
    subcategory: 'online_learning',
  },
  {
    merchantName: 'TOPPR',
    category: 'education',
    aliases: ['TOPPR INDIA'],
    confidence: 0.9,
    subcategory: 'online_learning',
  },

  // TRANSPORT
  {
    merchantName: 'METRO',
    category: 'transport',
    aliases: ['DELHI METRO', 'BANGALORE METRO', 'MUMBAI METRO'],
    confidence: 0.9,
    subcategory: 'public_transport',
  },
  {
    merchantName: 'BMTC',
    category: 'transport',
    aliases: ['BANGALORE METRO TRANSPORT'],
    confidence: 0.9,
    subcategory: 'public_transport',
  },
  {
    merchantName: 'DTC',
    category: 'transport',
    aliases: ['DELHI TRANSPORT CORPORATION'],
    confidence: 0.9,
    subcategory: 'public_transport',
  },

  // INSURANCE
  {
    merchantName: 'LIC',
    category: 'insurance',
    aliases: ['LIFE INSURANCE CORPORATION'],
    confidence: 0.95,
    subcategory: 'life_insurance',
  },
  {
    merchantName: 'BAJAJ ALLIANZ',
    category: 'insurance',
    aliases: ['BAJAJ ALLIANZ GENERAL'],
    confidence: 0.95,
    subcategory: 'general_insurance',
  },
  {
    merchantName: 'ICICI LOMBARD',
    category: 'insurance',
    aliases: ['ICICI LOMBARD GENERAL'],
    confidence: 0.95,
    subcategory: 'general_insurance',
  },
  {
    merchantName: 'HDFC ERGO',
    category: 'insurance',
    aliases: ['HDFC ERGO GENERAL'],
    confidence: 0.95,
    subcategory: 'general_insurance',
  },

  // INVESTMENT
  {
    merchantName: 'ZERODHA',
    category: 'investment',
    aliases: ['ZERODHA INDIA'],
    confidence: 0.95,
    subcategory: 'trading',
  },
  {
    merchantName: 'UPSTOX',
    category: 'investment',
    aliases: ['UPSTOX INDIA'],
    confidence: 0.95,
    subcategory: 'trading',
  },
  {
    merchantName: 'ANGEL BROKING',
    category: 'investment',
    aliases: ['ANGEL ONE'],
    confidence: 0.9,
    subcategory: 'trading',
  },
  {
    merchantName: 'GROWW',
    category: 'investment',
    aliases: ['GROWW INDIA'],
    confidence: 0.9,
    subcategory: 'mutual_funds',
  },
  {
    merchantName: 'KUVERA',
    category: 'investment',
    aliases: ['KUVERA INDIA'],
    confidence: 0.9,
    subcategory: 'mutual_funds',
  },
];

/**
 * Get merchant mapping by name (case-insensitive)
 */
export function getMerchantMapping(
  merchantName: string,
): MerchantMapping | null {
  const normalizedName = merchantName.toUpperCase().trim();

  return (
    INDIAN_MERCHANT_DATABASE.find(
      mapping =>
        mapping.merchantName === normalizedName ||
        mapping.aliases.includes(normalizedName),
    ) || null
  );
}

/**
 * Search for merchant mappings by partial name match
 */
export function searchMerchantMappings(searchTerm: string): MerchantMapping[] {
  const normalizedSearch = searchTerm.toUpperCase().trim();

  return INDIAN_MERCHANT_DATABASE.filter(
    mapping =>
      mapping.merchantName.includes(normalizedSearch) ||
      mapping.aliases.some(alias => alias.includes(normalizedSearch)),
  );
}

/**
 * Get all merchants for a specific category
 */
export function getMerchantsByCategory(
  category: TransactionCategory,
): MerchantMapping[] {
  return INDIAN_MERCHANT_DATABASE.filter(
    mapping => mapping.category === category,
  );
}

/**
 * Get category statistics
 */
export function getCategoryStats(): Record<TransactionCategory, number> {
  const stats: Record<TransactionCategory, number> = {
    dining: 0,
    shopping: 0,
    groceries: 0,
    fuel: 0,
    travel: 0,
    entertainment: 0,
    bills: 0,
    healthcare: 0,
    education: 0,
    transport: 0,
    utilities: 0,
    insurance: 0,
    investment: 0,
    others: 0,
  };

  INDIAN_MERCHANT_DATABASE.forEach(mapping => {
    stats[mapping.category]++;
  });

  return stats;
}

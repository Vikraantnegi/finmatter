/**
 * Keyword-based Transaction Categorization
 * Fallback categorization using keyword matching when merchant database doesn't have a match
 */

import type { TransactionCategory } from '@finmatter/types';

export interface KeywordRule {
  keywords: string[];
  category: TransactionCategory;
  subcategory?: string;
  confidence: number; // 0-1
  priority: number; // Higher priority rules are applied first
}

/**
 * Keyword-based categorization rules
 * Organized by category with common keywords
 */
export const KEYWORD_RULES: KeywordRule[] = [
  // DINING - High priority
  {
    keywords: [
      'restaurant',
      'cafe',
      'food',
      'dining',
      'meal',
      'lunch',
      'dinner',
      'breakfast',
      'snack',
      'pizza',
      'burger',
      'coffee',
      'tea',
      'bakery',
      'sweet',
      'dessert',
      'ice cream',
      'bar',
      'pub',
      'hotel',
      'buffet',
      'catering',
    ],
    category: 'dining',
    subcategory: 'restaurant',
    confidence: 0.8,
    priority: 10,
  },
  {
    keywords: [
      'swiggy',
      'zomato',
      'uber eats',
      'dunzo',
      'food delivery',
      'delivery',
      'takeaway',
      'order',
    ],
    category: 'dining',
    subcategory: 'food_delivery',
    confidence: 0.9,
    priority: 9,
  },

  // GROCERIES - High priority
  {
    keywords: [
      'grocery',
      'supermarket',
      'mart',
      'store',
      'vegetable',
      'fruit',
      'milk',
      'bread',
      'rice',
      'dal',
      'oil',
      'spice',
      'masala',
      'fresh',
      'organic',
      'provision',
    ],
    category: 'groceries',
    subcategory: 'supermarket',
    confidence: 0.85,
    priority: 10,
  },
  {
    keywords: [
      'bigbazaar',
      'dmart',
      'reliance fresh',
      'more',
      'spar',
      'grocers',
      'bigbasket',
      'amazon fresh',
    ],
    category: 'groceries',
    subcategory: 'online_grocery',
    confidence: 0.9,
    priority: 9,
  },

  // SHOPPING - Medium priority
  {
    keywords: [
      'shop',
      'store',
      'mall',
      'market',
      'buy',
      'purchase',
      'sale',
      'discount',
      'offer',
      'deal',
    ],
    category: 'shopping',
    subcategory: 'general',
    confidence: 0.6,
    priority: 5,
  },
  {
    keywords: [
      'amazon',
      'flipkart',
      'myntra',
      'ajio',
      'nykaa',
      'lenskart',
      'croma',
      'electronics',
      'mobile',
      'phone',
      'laptop',
      'computer',
      'tv',
      'refrigerator',
      'washing machine',
      'ac',
    ],
    category: 'shopping',
    subcategory: 'electronics',
    confidence: 0.85,
    priority: 8,
  },
  {
    keywords: [
      'clothes',
      'clothing',
      'fashion',
      'shirt',
      'pant',
      'dress',
      'shoes',
      'bag',
      'watch',
      'jewelry',
      'cosmetics',
      'beauty',
      'skincare',
    ],
    category: 'shopping',
    subcategory: 'fashion',
    confidence: 0.8,
    priority: 7,
  },

  // FUEL - High priority
  {
    keywords: [
      'petrol',
      'diesel',
      'fuel',
      'gas',
      'gasoline',
      'oil',
      'pump',
      'station',
      'filling',
      'bunk',
    ],
    category: 'fuel',
    subcategory: 'petrol_pump',
    confidence: 0.9,
    priority: 10,
  },
  {
    keywords: [
      'indian oil',
      'hp',
      'bpcl',
      'shell',
      'reliance petroleum',
      'iocl',
      'hindustan petroleum',
      'bharat petroleum',
    ],
    category: 'fuel',
    subcategory: 'petrol_pump',
    confidence: 0.95,
    priority: 9,
  },

  // TRAVEL - High priority
  {
    keywords: [
      'travel',
      'trip',
      'journey',
      'flight',
      'airline',
      'airport',
      'hotel',
      'booking',
      'reservation',
      'ticket',
      'fare',
    ],
    category: 'travel',
    subcategory: 'travel_booking',
    confidence: 0.8,
    priority: 8,
  },
  {
    keywords: [
      'irctc',
      'railway',
      'train',
      'metro',
      'bus',
      'taxi',
      'cab',
      'uber',
      'ola',
      'rapido',
      'ride',
    ],
    category: 'travel',
    subcategory: 'transport',
    confidence: 0.85,
    priority: 9,
  },
  {
    keywords: [
      'makemytrip',
      'yatra',
      'cleartrip',
      'goibibo',
      'oyo',
      'booking.com',
      'agoda',
    ],
    category: 'travel',
    subcategory: 'travel_booking',
    confidence: 0.9,
    priority: 8,
  },

  // ENTERTAINMENT - Medium priority
  {
    keywords: [
      'movie',
      'cinema',
      'theater',
      'theatre',
      'film',
      'entertainment',
      'fun',
      'game',
      'play',
      'show',
      'concert',
      'event',
    ],
    category: 'entertainment',
    subcategory: 'movies',
    confidence: 0.8,
    priority: 7,
  },
  {
    keywords: [
      'netflix',
      'amazon prime',
      'hotstar',
      'disney',
      'zee5',
      'sony liv',
      'streaming',
      'subscription',
    ],
    category: 'entertainment',
    subcategory: 'streaming',
    confidence: 0.9,
    priority: 8,
  },
  {
    keywords: ['bookmyshow', 'pvr', 'inox', 'cinepolis', 'multiplex'],
    category: 'entertainment',
    subcategory: 'movies',
    confidence: 0.9,
    priority: 8,
  },

  // BILLS - High priority
  {
    keywords: [
      'bill',
      'payment',
      'due',
      'recharge',
      'prepaid',
      'postpaid',
      'mobile',
      'phone',
      'internet',
      'broadband',
      'wifi',
    ],
    category: 'bills',
    subcategory: 'mobile',
    confidence: 0.7,
    priority: 6,
  },
  {
    keywords: ['airtel', 'jio', 'vodafone', 'bsnl', 'vi', 'reliance jio'],
    category: 'bills',
    subcategory: 'mobile',
    confidence: 0.9,
    priority: 8,
  },

  // UTILITIES - High priority
  {
    keywords: [
      'electricity',
      'power',
      'electric',
      'energy',
      'meter',
      'eb',
      'discom',
    ],
    category: 'utilities',
    subcategory: 'electricity',
    confidence: 0.9,
    priority: 9,
  },
  {
    keywords: ['water', 'municipal', 'corporation', 'municipality'],
    category: 'utilities',
    subcategory: 'water',
    confidence: 0.8,
    priority: 7,
  },
  {
    keywords: ['gas', 'lpg', 'cylinder', 'cooking gas'],
    category: 'utilities',
    subcategory: 'gas',
    confidence: 0.9,
    priority: 9,
  },

  // HEALTHCARE - High priority
  {
    keywords: [
      'hospital',
      'clinic',
      'doctor',
      'medical',
      'health',
      'pharmacy',
      'medicine',
      'drug',
      'prescription',
      'treatment',
      'surgery',
      'test',
      'lab',
    ],
    category: 'healthcare',
    subcategory: 'medical',
    confidence: 0.85,
    priority: 8,
  },
  {
    keywords: [
      'apollo',
      'fortis',
      'max',
      'medplus',
      'netmeds',
      '1mg',
      'pharmacy',
    ],
    category: 'healthcare',
    subcategory: 'pharmacy',
    confidence: 0.9,
    priority: 8,
  },

  // EDUCATION - Medium priority
  {
    keywords: [
      'school',
      'college',
      'university',
      'education',
      'tuition',
      'fees',
      'course',
      'training',
      'learning',
      'study',
      'book',
      'stationery',
    ],
    category: 'education',
    subcategory: 'education',
    confidence: 0.8,
    priority: 7,
  },
  {
    keywords: [
      'byjus',
      'unacademy',
      'vedantu',
      'toppr',
      'online learning',
      'e-learning',
    ],
    category: 'education',
    subcategory: 'online_learning',
    confidence: 0.9,
    priority: 8,
  },

  // TRANSPORT - Medium priority
  {
    keywords: [
      'metro',
      'bus',
      'transport',
      'public transport',
      'bmtc',
      'dtc',
      'municipal transport',
    ],
    category: 'transport',
    subcategory: 'public_transport',
    confidence: 0.8,
    priority: 7,
  },

  // INSURANCE - High priority
  {
    keywords: [
      'insurance',
      'premium',
      'policy',
      'claim',
      'coverage',
      'lic',
      'bajaj allianz',
      'icici lombard',
      'hdfc ergo',
    ],
    category: 'insurance',
    subcategory: 'general_insurance',
    confidence: 0.9,
    priority: 9,
  },

  // INVESTMENT - High priority
  {
    keywords: [
      'investment',
      'mutual fund',
      'sip',
      'equity',
      'stock',
      'trading',
      'brokerage',
      'demat',
      'portfolio',
    ],
    category: 'investment',
    subcategory: 'investment',
    confidence: 0.85,
    priority: 8,
  },
  {
    keywords: [
      'zerodha',
      'upstox',
      'angel broking',
      'groww',
      'kuvera',
      'trading',
      'broker',
    ],
    category: 'investment',
    subcategory: 'trading',
    confidence: 0.9,
    priority: 8,
  },

  // BANKING & FINANCIAL SERVICES
  {
    keywords: [
      'bank',
      'atm',
      'withdrawal',
      'deposit',
      'transfer',
      'emi',
      'loan',
      'credit',
      'debit',
      'charges',
      'fee',
      'interest',
    ],
    category: 'others',
    subcategory: 'banking',
    confidence: 0.7,
    priority: 5,
  },

  // GOVERNMENT & TAXES
  {
    keywords: [
      'government',
      'tax',
      'gst',
      'income tax',
      'property tax',
      'road tax',
      'registration',
      'license',
      'permit',
    ],
    category: 'others',
    subcategory: 'government',
    confidence: 0.8,
    priority: 6,
  },

  // CHARITY & DONATIONS
  {
    keywords: [
      'donation',
      'charity',
      'ngo',
      'foundation',
      'trust',
      'help',
      'support',
      'contribution',
    ],
    category: 'others',
    subcategory: 'donation',
    confidence: 0.8,
    priority: 6,
  },

  // AUTOMOTIVE
  {
    keywords: [
      'car',
      'bike',
      'vehicle',
      'automobile',
      'service',
      'repair',
      'maintenance',
      'garage',
      'workshop',
      'spare',
      'parts',
    ],
    category: 'others',
    subcategory: 'automotive',
    confidence: 0.7,
    priority: 5,
  },

  // HOME & GARDEN
  {
    keywords: [
      'home',
      'house',
      'furniture',
      'decoration',
      'garden',
      'plant',
      'flower',
      'kitchen',
      'bathroom',
      'bedroom',
    ],
    category: 'others',
    subcategory: 'home_garden',
    confidence: 0.6,
    priority: 4,
  },

  // SPORTS & FITNESS
  {
    keywords: [
      'sports',
      'fitness',
      'gym',
      'yoga',
      'exercise',
      'workout',
      'training',
      'sport',
      'game',
      'tournament',
    ],
    category: 'others',
    subcategory: 'sports_fitness',
    confidence: 0.7,
    priority: 5,
  },

  // PETS
  {
    keywords: [
      'pet',
      'dog',
      'cat',
      'animal',
      'veterinary',
      'vet',
      'pet care',
      'pet food',
      'pet shop',
    ],
    category: 'others',
    subcategory: 'pets',
    confidence: 0.8,
    priority: 6,
  },

  // BOOKS & MEDIA
  {
    keywords: [
      'book',
      'magazine',
      'newspaper',
      'media',
      'publishing',
      'library',
      'bookstore',
    ],
    category: 'others',
    subcategory: 'books_media',
    confidence: 0.7,
    priority: 5,
  },

  // PROFESSIONAL SERVICES
  {
    keywords: [
      'consultant',
      'lawyer',
      'advocate',
      'ca',
      'accountant',
      'audit',
      'legal',
      'professional',
      'service',
      'consultation',
    ],
    category: 'others',
    subcategory: 'professional_services',
    confidence: 0.7,
    priority: 5,
  },
];

/**
 * Categorize transaction based on keywords in merchant name
 */
export function categorizeByKeywords(merchantName: string): {
  category: TransactionCategory;
  subcategory?: string;
  confidence: number;
  matchedKeywords: string[];
} | null {
  const normalizedMerchant = merchantName.toLowerCase().trim();

  // Sort rules by priority (highest first)
  const sortedRules = [...KEYWORD_RULES].sort(
    (a, b) => b.priority - a.priority,
  );

  for (const rule of sortedRules) {
    const matchedKeywords = rule.keywords.filter(keyword =>
      normalizedMerchant.includes(keyword.toLowerCase()),
    );

    if (matchedKeywords.length > 0) {
      return {
        category: rule.category,
        subcategory: rule.subcategory || undefined,
        confidence: rule.confidence,
        matchedKeywords,
      };
    }
  }

  return null;
}

/**
 * Get all keywords for a specific category
 */
export function getKeywordsByCategory(category: TransactionCategory): string[] {
  const keywords: string[] = [];

  KEYWORD_RULES.filter(rule => rule.category === category).forEach(rule => {
    keywords.push(...rule.keywords);
  });

  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Get category statistics from keyword rules
 */
export function getKeywordCategoryStats(): Record<TransactionCategory, number> {
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

  KEYWORD_RULES.forEach(rule => {
    stats[rule.category]++;
  });

  return stats;
}

/**
 * Test keyword matching for a merchant name
 */
export function testKeywordMatching(merchantName: string): {
  result: ReturnType<typeof categorizeByKeywords>;
  allMatches: Array<{
    rule: KeywordRule;
    matchedKeywords: string[];
  }>;
} {
  const normalizedMerchant = merchantName.toLowerCase().trim();
  const allMatches: Array<{
    rule: KeywordRule;
    matchedKeywords: string[];
  }> = [];

  KEYWORD_RULES.forEach(rule => {
    const matchedKeywords = rule.keywords.filter(keyword =>
      normalizedMerchant.includes(keyword.toLowerCase()),
    );

    if (matchedKeywords.length > 0) {
      allMatches.push({
        rule,
        matchedKeywords,
      });
    }
  });

  // Sort by priority and return the highest priority match
  allMatches.sort((a, b) => b.rule.priority - a.rule.priority);

  const result =
    allMatches.length > 0
      ? {
          category: allMatches[0]!.rule.category,
          subcategory: allMatches[0]!.rule.subcategory || undefined,
          confidence: allMatches[0]!.rule.confidence,
          matchedKeywords: allMatches[0]!.matchedKeywords,
        }
      : null;

  return {
    result,
    allMatches,
  };
}

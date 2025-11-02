/**
 * Reward Mapping Service
 *
 * Maps transaction categories to optimal reward categories for card selection
 * and transaction analysis.
 */

export type TransactionCategory =
  | 'dining'
  | 'shopping'
  | 'groceries'
  | 'fuel'
  | 'travel'
  | 'entertainment'
  | 'bills'
  | 'utilities'
  | 'healthcare'
  | 'education'
  | 'transfer'
  | 'other';

export type RewardCategory =
  | 'shopping_dining'
  | 'default'
  | 'lounge'
  | 'fuel'
  | 'amazon'
  | 'dining_travel'
  | 'airline'
  | 'hotel'
  | 'entertainment'
  | 'grocery'
  | 'bills'
  | 'healthcare'
  | 'education'
  | 'travel'
  | 'dining'
  | 'shopping'
  | 'cashback'
  | 'none';

/**
 * Map transaction category to reward category
 */
export function mapTransactionToRewardCategory(
  transactionCategory: TransactionCategory,
): RewardCategory {
  const mapping: Record<TransactionCategory, RewardCategory> = {
    // Food & Dining → shopping_dining or dining
    dining: 'dining',

    // Shopping → shopping_dining or shopping
    shopping: 'shopping',

    // Groceries → grocery
    groceries: 'grocery',

    // Fuel → fuel
    fuel: 'fuel',

    // Travel → dining_travel or travel
    travel: 'dining_travel',

    // Entertainment → entertainment
    entertainment: 'entertainment',

    // Bills & Utilities → bills
    bills: 'bills',
    utilities: 'bills',

    // Healthcare → healthcare
    healthcare: 'healthcare',

    // Education → education
    education: 'education',

    // Transfers → none
    transfer: 'none',

    // Other → default
    other: 'default',
  };

  return mapping[transactionCategory];
}

/**
 * Get optimal reward category for a merchant
 * Can be enhanced with merchant name analysis
 */
export function getRewardCategoryForMerchant(
  merchantName: string,
): RewardCategory {
  const merchant = merchantName.toLowerCase();

  // Travel & Airlines
  if (
    merchant.includes('airline') ||
    merchant.includes('indigo') ||
    merchant.includes('air india') ||
    merchant.includes('vistara') ||
    merchant.includes('spicejet') ||
    merchant.includes('goair')
  ) {
    return 'airline';
  }

  // Hotels
  if (
    merchant.includes('hotel') ||
    merchant.includes('oyo') ||
    merchant.includes('marriott') ||
    merchant.includes('taj') ||
    merchant.includes('hyatt')
  ) {
    return 'hotel';
  }

  // Dining
  if (
    merchant.includes('restaurant') ||
    merchant.includes('zomato') ||
    merchant.includes('swiggy') ||
    merchant.includes('uber eats') ||
    merchant.includes('dominos') ||
    merchant.includes('kfc') ||
    merchant.includes('pizza hut') ||
    merchant.includes('mcdonalds')
  ) {
    return 'dining';
  }

  // E-commerce (Shopping)
  if (
    merchant.includes('amazon') ||
    merchant.includes('flipkart') ||
    merchant.includes('myntra') ||
    merchant.includes('nykaa') ||
    merchant.includes('meesho')
  ) {
    return 'shopping';
  }

  // Groceries
  if (
    merchant.includes('grocery') ||
    merchant.includes('dmart') ||
    merchant.includes('big basket') ||
    merchant.includes('grofers') ||
    merchant.includes('jiomart')
  ) {
    return 'grocery';
  }

  // Fuel
  if (
    merchant.includes('petrol') ||
    merchant.includes('fuel') ||
    merchant.includes('bpcl') ||
    merchant.includes('hpcl') ||
    merchant.includes('indian oil')
  ) {
    return 'fuel';
  }

  // Entertainment
  if (
    merchant.includes('movie') ||
    merchant.includes('plex') ||
    merchant.includes('theatre') ||
    merchant.includes('netflix') ||
    merchant.includes('prime') ||
    merchant.includes('spotify') ||
    merchant.includes('disney')
  ) {
    return 'entertainment';
  }

  // Healthcare
  if (
    merchant.includes('pharmacy') ||
    merchant.includes('apollo') ||
    merchant.includes('fortis') ||
    merchant.includes('max hospital') ||
    merchant.includes('hospital')
  ) {
    return 'healthcare';
  }

  // Education
  if (
    merchant.includes('education') ||
    merchant.includes('university') ||
    merchant.includes('school') ||
    merchant.includes('college') ||
    merchant.includes('course')
  ) {
    return 'education';
  }

  // Default fallback
  return 'default';
}

/**
 * Get reward rate for a transaction on a specific card
 */
export function getRewardRate(
  transactionCategory: TransactionCategory,
  cardRewardRules: any,
): number {
  const rewardCategory = mapTransactionToRewardCategory(transactionCategory);

  // Find matching reward rule in card's benefits
  if (!cardRewardRules?.benefits) {
    return 0;
  }

  const matchingBenefit = cardRewardRules.benefits.find(
    (benefit: any) =>
      benefit.category === rewardCategory || benefit.category === 'default',
  );

  return matchingBenefit?.rewardRate || 0;
}

/**
 * Suggest best card for a transaction category
 */
export function suggestBestCard(
  transactionCategory: TransactionCategory,
  availableCards: any[],
): { card: any; rewardRate: number } | null {
  if (!availableCards || availableCards.length === 0) {
    return null;
  }

  let bestCard = null;
  let bestRewardRate = 0;

  for (const card of availableCards) {
    const rewardRate = getRewardRate(transactionCategory, card.metadata || {});

    if (rewardRate > bestRewardRate) {
      bestRewardRate = rewardRate;
      bestCard = card;
    }
  }

  return bestCard ? { card: bestCard, rewardRate: bestRewardRate } : null;
}

/**
 * Calculate potential rewards for a transaction amount
 */
export function calculatePotentialRewards(
  amount: number,
  rewardRate: number,
  rewardType: 'points' | 'cashback' | 'none' = 'points',
): { points?: number; cashback?: number; value?: number } {
  if (rewardRate === 0) {
    return {};
  }

  const multiplier = rewardRate / 100;

  switch (rewardType) {
    case 'cashback': {
      const cashback = (amount * multiplier) / 100;
      return { cashback, value: cashback };
    }

    case 'points': {
      const points = Math.floor((amount * multiplier) / 100);
      // Assuming 1 point = ₹0.25 (can be customized per card)
      const value = points * 0.25;
      return { points, value };
    }

    default:
      return {};
  }
}

/**
 * Export utility types
 */
export type RewardMapping = {
  transactionCategory: TransactionCategory;
  rewardCategory: RewardCategory;
  estimatedRate: number;
};

export type CardSuggestion = {
  cardId: string;
  cardName: string;
  bankName: string;
  rewardCategory: RewardCategory;
  rewardRate: number;
  estimatedRewards: number;
};

/**
 * Card types for FinMatter
 * FUTURE: These types are prepared for when cards feature is implemented
 * Currently not in use - no cards table in database
 */

export type CardType = 'credit' | 'debit' | 'prepaid';
export type CardNetwork = 'visa' | 'mastercard' | 'rupay' | 'amex' | 'discover';
export type RewardType = 'cashback' | 'points' | 'miles' | 'none';
export type CardStatus = 'active' | 'inactive' | 'blocked' | 'expired';

export type Card = {
  id: string;
  userId: string;
  bankName: string;
  cardName: string;
  lastFourDigits: string;
  cardType: CardType;
  network: CardNetwork;
  rewardType: RewardType;
  annualFee: number;
  currency: string;
  status: CardStatus;
  issueDate?: Date | string;
  expiryDate?: Date | string;
  creditLimit?: number;
  availableCredit?: number;
  billingDay?: number;
  primaryColor?: string;
  secondaryColor?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type CardBenefit = {
  id: string;
  cardId: string;
  category: string;
  description?: string;
  value?: string;
  rewardRate?: number;
  rewardType?: RewardType;
  rewardCap?: number;
  conditions?: string[];
  isActive?: boolean;
};

// Database types (snake_case from Supabase)
// Minimal set - will expand when feature is implemented
export type DatabaseCard = {
  id: string;
  user_id: string;
  bank_name: string;
  card_name: string;
  last_four_digits: string;
  card_type: CardType;
  network: CardNetwork;
  reward_type: RewardType;
  annual_fee: number;
  currency: string;
  status: CardStatus;
  created_at: string;
  updated_at: string;
};

export type DatabaseCardBenefit = {
  id: string;
  card_id: string;
  category: string;
  reward_rate?: number;
  reward_type?: RewardType;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Card types for FinMatter
 * Updated to match the database schema
 */
export type CardType = 'credit' | 'debit' | 'prepaid';
export type CardNetwork =
  | 'visa'
  | 'mastercard'
  | 'rupay'
  | 'amex'
  | 'discover'
  | 'diners';
export type RewardType = 'cashback' | 'points' | 'miles' | 'none';
export type CardStatus = 'active' | 'inactive' | 'blocked' | 'expired';
export type BinLookupSource = 'internal' | 'binlist_api' | 'manual';
export type Card = {
  id: string;
  userId: string;
  bankId?: string;
  bankName?: string;
  cardMetadataId?: string;
  cardName?: string;
  cardHolderName?: string;
  lastFourDigits: string;
  cardType: CardType;
  network: CardNetwork | null;
  rewardType?: RewardType;
  annualFee: number;
  currency: string;
  status: CardStatus;
  expiryMonth?: number;
  expiryYear?: number;
  detectedFromBin: boolean;
  binLookupSource: BinLookupSource;
  issueDate?: Date | string;
  billingDay?: number;
  creditLimit?: number;
  availableCredit?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  bank?: Bank;
  cardMetadata?: CardMetadata;
};
export type CardBenefitRecord = {
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
export type DatabaseCard = {
  id: string;
  user_id: string;
  bank_id?: string | null;
  bank_name?: string | null;
  card_metadata_id?: string | null;
  card_name?: string | null;
  card_holder_name?: string | null;
  last_four_digits: string;
  card_type: CardType;
  network: CardNetwork | null;
  reward_type?: RewardType | null;
  annual_fee: number;
  currency: string;
  status: CardStatus;
  expiry_month?: number | null;
  expiry_year?: number | null;
  detected_from_bin: boolean;
  bin_lookup_source: BinLookupSource;
  issue_date?: string | null;
  billing_day?: number | null;
  credit_limit?: number | null;
  available_credit?: number | null;
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
export type Bank = {
  id: string;
  name: string;
  displayName: string;
  logoUrl?: string | null;
  logoWithNameUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type DatabaseBank = {
  id: string;
  name: string;
  display_name: string;
  logo_url?: string | null;
  logo_with_name_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type Network = {
  id: string;
  name: string;
  displayName: string;
  iconUrl?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type DatabaseNetwork = {
  id: string;
  name: string;
  display_name: string;
  icon_url?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type CardMetadata = {
  id: string;
  bankId: string;
  cardName: string;
  displayName: string;
  cardType: CardType;
  network: CardNetwork;
  rewardType?: RewardType | null;
  annualFee: number;
  joiningFee: number;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  cardLogoUrl?: string | null;
  benefits: CardBenefit[];
  offers: CardOffer[];
  rewards: CardRewards;
  milestones: CardMilestone[];
  metadata?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  bank?: Bank;
};
export type DatabaseCardMetadata = {
  id: string;
  bank_id: string;
  card_name: string;
  display_name: string;
  card_type: CardType;
  network: CardNetwork;
  reward_type?: RewardType | null;
  annual_fee: number;
  joining_fee: number;
  primary_color?: string | null;
  secondary_color?: string | null;
  card_logo_url?: string | null;
  benefits: CardBenefit[] | Json;
  offers: CardOffer[] | Json;
  rewards: CardRewards | Json;
  milestones: CardMilestone[] | Json;
  metadata?: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type CardBenefit = {
  category: string;
  description: string;
  rewardRate?: number;
  rewardType?: RewardType;
  rewardCap?: number;
  rewardCapPeriod?: 'monthly' | 'quarterly' | 'annual';
  conditions?: string[];
  isActive: boolean;
};
export type CardOffer = {
  title: string;
  description: string;
  category: string;
  validity?: string;
  terms?: string[];
  isActive: boolean;
};
export type CardRewards = {
  baseRate?: number;
  baseRewardType?: RewardType;
  acceleratedRates?: Array<{
    category: string;
    rate: number;
    rewardType: RewardType;
    cap?: number;
  }>;
  redemption?: {
    cashback?: boolean;
    points?: boolean;
    miles?: boolean;
  };
};
export type CardMilestone = {
  spendingThreshold: number;
  reward: string;
  description: string;
  type: 'monthly' | 'quarterly' | 'annual';
  isActive: boolean;
};
export type BinLookup = {
  id: string;
  binStart: string;
  binEnd?: string | null;
  bankId: string;
  cardMetadataId?: string | null;
  cardType: CardType;
  network: CardNetwork;
  country: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  bank?: Bank;
  cardMetadata?: CardMetadata;
};
export type DatabaseBinLookup = {
  id: string;
  bin_start: string;
  bin_end?: string | null;
  bank_id: string;
  card_metadata_id?: string | null;
  card_type: CardType;
  network: CardNetwork;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type Json =
  | string
  | number
  | boolean
  | null
  | {
      [key: string]: Json | undefined;
    }
  | Json[];
//# sourceMappingURL=card.d.ts.map

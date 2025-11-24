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
  bankName?: string; // Legacy field, prefer bankId
  cardMetadataId?: string;
  cardName?: string;
  cardHolderName?: string;
  lastFourDigits: string;
  cardType: CardType;
  network: CardNetwork | null; // Nullable - can be unknown if BIN lookup fails
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
  // Joined data (not in DB)
  bank?: Bank;
  cardMetadata?: CardMetadata;
};

// Legacy CardBenefit type (for card_benefits table - separate from JSONB benefits)
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

// Database types (snake_case from Supabase)
export type DatabaseCard = {
  id: string;
  user_id: string;
  bank_id?: string | null;
  bank_name?: string | null; // Legacy field
  card_metadata_id?: string | null;
  card_name?: string | null;
  card_holder_name?: string | null;
  last_four_digits: string;
  card_type: CardType;
  network: CardNetwork | null; // Nullable - can be unknown if BIN lookup fails
  reward_type?: RewardType | null;
  annual_fee: number;
  currency: string;
  status: CardStatus;
  expiry_month?: number | null;
  expiry_year?: number | null;
  detected_from_bin: boolean;
  bin_lookup_source: BinLookupSource;
  issue_date?: string | null; // DATE type
  billing_day?: number | null;
  credit_limit?: number | null;
  available_credit?: number | null;
  created_at: string;
  updated_at: string;
};

// Database type for card_benefits table (legacy, separate table)
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

// Bank types
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

// Network types
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

// Card Metadata types (benefits, offers, rewards, milestones stored as JSONB)
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
  benefits: CardBenefit[]; // JSONB array
  offers: CardOffer[]; // JSONB array
  rewards: CardRewards; // JSONB object
  milestones: CardMilestone[]; // JSONB array
  metadata?: Record<string, any>; // JSONB object
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined data
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

// Card Benefit (part of cards_metadata.benefits JSONB array)
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

// Card Offer (part of cards_metadata.offers JSONB)
export type CardOffer = {
  title: string;
  description: string;
  category: string;
  validity?: string; // Date string
  terms?: string[];
  isActive: boolean;
};

// Card Rewards (part of cards_metadata.rewards JSONB)
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

// Card Milestone (part of cards_metadata.milestones JSONB)
export type CardMilestone = {
  spendingThreshold: number;
  reward: string;
  description: string;
  type: 'monthly' | 'quarterly' | 'annual';
  isActive: boolean;
};

// BIN Lookup types
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
  // Joined data
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

// JSON type for JSONB fields
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

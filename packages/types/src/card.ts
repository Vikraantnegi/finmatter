import type { AuditFields, Currency } from './common';
import { Transaction } from './transaction';

/**
 * Credit Card related types for FinMatter
 */

export type CardType = 'credit' | 'debit' | 'prepaid';
export type CardNetwork = 'visa' | 'mastercard' | 'rupay' | 'amex' | 'discover';
export type RewardType = 'cashback' | 'points' | 'miles' | 'none';

export type CardStatus = 'active' | 'inactive' | 'blocked' | 'expired';

export type Card = AuditFields & {
  id: string;
  userId: string;
  bankName: string;
  cardName: string;
  lastFourDigits: string; // Encrypted in database
  cardType: CardType;
  network: CardNetwork;
  rewardType: RewardType;
  annualFee: number;
  currency: Currency;
  status: CardStatus;
  issueDate?: Date;
  expiryDate?: Date | string;
  creditLimit?: number;
  availableCredit?: number;
  billingDay?: number; // Billing day of the month (1-31)
  benefits?: CardBenefit[];
  usage?: CardUsage;
  // Card metadata fields
  cardMetadataId?: string; // Reference to card metadata
  bankId?: string; // Reference to bank metadata
  primaryColor?: string; // Card's primary color
  secondaryColor?: string; // Card's secondary color
  isCustom?: boolean; // Whether this is a custom card vs from metadata
  hasStatement?: boolean; // Whether the card has a statement uploaded
  parsingInProgress?: boolean; // Whether any statement is currently being parsed
};

export type CardBenefit = {
  id: string;
  cardId: string;
  category: TransactionCategory | string; // Allow custom categories
  description: string; // Benefit description
  value?: string; // Optional value (e.g., "5%" or "₹500")
  rewardRate?: number; // e.g., 5 for 5% or 5 points per ₹100
  rewardType?: RewardType;
  rewardCap?: number; // Monthly/yearly cap
  conditions?: string[]; // Additional conditions
  isActive?: boolean;
  validFrom?: Date;
  validUntil?: Date;
};

export type TransactionCategory =
  | 'dining'
  | 'shopping'
  | 'groceries'
  | 'fuel'
  | 'travel'
  | 'entertainment'
  | 'bills'
  | 'healthcare'
  | 'education'
  | 'transport'
  | 'utilities'
  | 'insurance'
  | 'investment'
  | 'others';

export type CardUsage = {
  totalSpent: number;
  totalTransactions: number;
  averageTransactionValue: number;
  mostUsedCategory: TransactionCategory;
  monthlySpending: Record<string, number>; // YYYY-MM format
  categoryBreakdown: Record<TransactionCategory, number>;
  lastUsedDate?: Date;
};

export type CardRecommendation = {
  card: Card;
  expectedReward: number;
  reasoning: string;
  confidence: number; // 0-100
  alternatives?: Array<{
    card: Card;
    reward: number;
    reasoning: string;
  }>;
};

export type CreateCardRequest = {
  bankName: string;
  cardName: string;
  lastFourDigits: string;
  cardType: CardType;
  network: CardNetwork;
  rewardType: RewardType;
  annualFee: number;
  currency?: Currency;
  expiryDate?: string;
  // Optional fields that will be populated from statements later
  creditLimit?: number;
  availableCredit?: number;
  billingDay?: number;
  // Metadata fields (optional)
  cardMetadataId?: string;
  bankId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isCustom?: boolean;
  benefits?: Partial<CardBenefit>[];
};

export type UpdateCardRequest = Partial<
  Pick<
    Card,
    | 'cardName'
    | 'rewardType'
    | 'annualFee'
    | 'status'
    | 'creditLimit'
    | 'availableCredit'
  >
> & {
  benefits?: Partial<CardBenefit>[];
};

export type CardStatement = {
  id: string;
  cardId: string;
  userId: string;
  statementPeriod: {
    startDate: Date;
    endDate: Date;
  };
  dueDate: Date;
  minimumPayment: number;
  totalDue: number;
  transactions: Transaction[];
  filePath?: string; // Path to uploaded PDF
  status: 'pending' | 'processed' | 'failed';
  createdAt: Date;
};

export type Bank = {
  id: string;
  name: string;
  code: string; // Bank code for identification
  logo?: string;
  website?: string;
  supportedCards: CardType[];
  supportedNetworks: CardNetwork[];
  isActive: boolean;
};

export type PopularCard = {
  id: string;
  bankName: string;
  cardName: string;
  cardType: CardType;
  network: CardNetwork;
  rewardType: RewardType;
  annualFee: number;
  highlights: string[];
  benefits: Omit<CardBenefit, 'id' | 'cardId'>[];
  eligibility?: {
    minIncome?: number;
    minAge?: number;
    employmentType?: string[];
  };
  isRecommended: boolean;
  popularityScore: number; // 0-100
};

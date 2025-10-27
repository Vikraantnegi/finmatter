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
  lastFourDigits: string;
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
  billingDay?: number;
  benefits?: CardBenefit[];
  usage?: CardUsage;
  cardMetadataId?: string;
  bankId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  isCustom?: boolean;
  hasStatement?: boolean;
  parsingInProgress?: boolean;
};
export type CardBenefit = {
  id: string;
  cardId: string;
  category: TransactionCategory | string;
  description: string;
  value?: string;
  rewardRate?: number;
  rewardType?: RewardType;
  rewardCap?: number;
  conditions?: string[];
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
  monthlySpending: Record<string, number>;
  categoryBreakdown: Record<TransactionCategory, number>;
  lastUsedDate?: Date;
};
export type CardRecommendation = {
  card: Card;
  expectedReward: number;
  reasoning: string;
  confidence: number;
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
  creditLimit?: number;
  availableCredit?: number;
  billingDay?: number;
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
  filePath?: string;
  status: 'pending' | 'processed' | 'failed';
  createdAt: Date;
};
export type Bank = {
  id: string;
  name: string;
  code: string;
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
  popularityScore: number;
};
//# sourceMappingURL=card.d.ts.map

/**
 * Types for PDF statement parsing
 */

export interface ParsedTransaction {
  date: Date;
  merchantName: string;
  amount: number;
  category?: string;
  rawText: string;
  type: 'debit' | 'credit' | 'refund' | 'fee' | 'interest';
  // Enhanced fields
  location?: 'domestic' | 'international';
  rewardPoints?: number; // Points earned for this transaction
  referenceNumber?: string;
  isEMI?: boolean;
  emiDetails?: {
    tenure: number;
    principalAmount: number;
    interestRate: number;
  };
  gstAmount?: number;
}

export interface RewardPointsSummary {
  opening: number;
  earned: number;
  redeemed: number;
  expired: number;
  closing: number;
  earnedByCategory?: Record<string, number>; // e.g., { dining: 500, fuel: 200 }
}

export interface EMISummary {
  emiCount: number;
  totalEMIAmount: number;
  loans: Array<{
    loanNumber: string;
    principalAmount: number;
    emiAmount: number;
    remainingTenure: number;
    interestRate: number;
  }>;
}

export interface SpendsOverview {
  totalSpends: number;
  domesticSpends: number;
  internationalSpends: number;
  atmWithdrawals: number;
  numberOfTransactions: number;
  categoryWiseSpends?: Record<string, { amount: number; percentage: number }>;
}

export interface StatementMetadata {
  // Card identification
  cardLastFourDigits?: string;

  // Statement dates
  statementDate?: Date; // When statement was generated
  statementPeriodStart?: Date;
  statementPeriodEnd?: Date;

  // Billing cycle information
  billingDay?: number; // Day of month when billing cycle starts (e.g., 17th)
  statementDay?: number; // Day of month when statement is generated (e.g., 18th)

  // Payment information
  dueDate?: Date;
  minimumPayment?: number;
  totalDue?: number;

  // Credit information
  creditLimit?: number;
  availableCredit?: number;

  // Reward points
  rewardPoints?: RewardPointsSummary;

  // EMI information
  emiSummary?: EMISummary;

  // Spending overview
  spendsOverview?: SpendsOverview;

  // Additional indicators
  cashAdvanceLimit?: number;
  latePaymentFee?: number;
  interestCharges?: number;

  // Statement summary
  previousBalance?: number;
  purchasesCharges?: number;
  cashAdvances?: number;
  paymentsCredits?: number;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  metadata: StatementMetadata;
  success: boolean;
  errors: string[];
  warnings: string[];
  rawText?: string; // For debugging - first 5000 chars of extracted text
}

export type BankName =
  | 'hdfc'
  | 'icici'
  | 'sbi'
  | 'axis'
  | 'kotak'
  | 'citi'
  | 'amex'
  | 'hsbc';

export interface ParserConfig {
  bankName: BankName;
  dateFormats: string[];
  transactionPatterns: RegExp[];
  amountPatterns: RegExp[];
  merchantPatterns: RegExp[];
  categoryKeywords?: Record<string, string[]>;
}

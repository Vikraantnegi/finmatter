/**
 * Types for credit card statement parsing
 */

export interface ParsedTransaction {
  transactionDate: Date;
  postingDate?: Date;
  merchantName: string;
  merchantCategory?: string;
  amount: number;
  type: 'debit' | 'credit' | 'refund';
  currency: string;
  description?: string;
  rawText: string;
}

export interface StatementMetadata {
  cardLastFour?: string;
  statementPeriodStart?: Date;
  statementPeriodEnd?: Date;
  billingCycleStart?: Date;
  billingCycleEnd?: Date;
  totalAmount?: number;
  minimumDue?: number;
  paymentDueDate?: Date;
  statementDate?: Date;
  cardName?: string;
  bankName?: string;
  // Reward Points
  rewardPoints?: number;
  rewardPointsOpeningBalance?: number;
  rewardPointsEarned?: number;
  rewardPointsDisbursed?: number;
  rewardPointsAdjustedLapsed?: number;
  rewardPointsExpiring30Days?: number;
  rewardPointsExpiring60Days?: number;
  // NeuCoins (Tata Neu Plus cards)
  neuCoins?: number;
  neuCoinsOpeningBalance?: number;
  neuCoinsEarned?: number;
  neuCoinsTransferredToTataNeu?: number;
  neuCoinsAdjustedLapsed?: number;
  bonusNeuCoinsSummary?: {
    program: string;
    bonusNeuCoins: number;
  }[];
  bonusNeuCoinsTotal?: number;
  // Spending Categories/Insights
  spendingCategories?: {
    category: string;
    percentage: number;
  }[];
  // Rewards Program Summary
  rewardsProgramSummary?: {
    program: string;
    points: number;
  }[];
  rewardsTotalPoints?: number;
  // Financial Summary
  previousStatementDues?: number;
  paymentsCreditsReceived?: number;
  purchasesDebit?: number;
  financeCharges?: number;
  totalCreditLimit?: number;
  availableCreditLimit?: number;
  availableCashLimit?: number;
  // EMI Summary
  emiLoans?: {
    loanNumber: string;
    bookedDate: Date;
    amount: number;
    tenure: string;
    rateOfInterest: number;
    balancePrincipal: number;
    outstandingBalance: number;
    interestPayable: number;
    balanceTenure: string;
  }[];
  // GST Summary
  gstSummary?: {
    igst: number;
    cgst: number;
    sgst: number;
    reversal: number;
    total: number;
  };
}

export interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  metadata: StatementMetadata;
  errors?: string[];
  warnings?: string[];
}

export type BankName = 'hdfc' | 'icici' | 'amex' | 'sbi' | 'axis';

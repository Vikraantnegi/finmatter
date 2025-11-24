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
}

export interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  metadata: StatementMetadata;
  errors?: string[];
  warnings?: string[];
}

export type BankName = 'hdfc' | 'icici' | 'amex' | 'sbi' | 'axis';

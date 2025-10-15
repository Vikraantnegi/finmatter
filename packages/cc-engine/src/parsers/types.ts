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
}

export interface StatementMetadata {
  cardLastFourDigits?: string;
  statementPeriod?: {
    startDate: Date;
    endDate: Date;
  };
  totalAmount?: number;
  dueDate?: Date;
  minimumPayment?: number;
  creditLimit?: number;
  availableCredit?: number;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  metadata: StatementMetadata;
  success: boolean;
  errors: string[];
  warnings: string[];
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

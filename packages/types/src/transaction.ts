import type { AuditFields, Currency } from './common';
import type { TransactionCategory } from './card';

/**
 * Transaction related types for FinMatter
 */

export type TransactionType =
  | 'debit'
  | 'credit'
  | 'refund'
  | 'fee'
  | 'interest';

export type TransactionStatus =
  | 'completed'
  | 'pending'
  | 'failed'
  | 'cancelled';

export type Transaction = AuditFields & {
  id: string;
  userId: string;
  cardId?: string; // Optional for manual entries
  amount: number;
  currency: Currency;
  type: TransactionType;
  status: TransactionStatus;
  merchantName: string;
  merchantCategory?: TransactionCategory;
  description?: string;
  reference?: string; // Transaction reference from bank
  date: Date;
  category: TransactionCategory;
  subcategory?: string;
  tags?: string[];
  notes?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
  statementId?: string; // If from PDF statement
  emailId?: string; // If from email alert
  isSplit?: boolean;
  splitTransactions?: SplitTransaction[];
  attachments?: TransactionAttachment[];
  rewardPoints?: number; // Points earned from this transaction
};

export type RecurringPattern = {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  interval: number; // Every N periods
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
};

export type SplitTransaction = {
  id: string;
  transactionId: string;
  amount: number;
  category: TransactionCategory;
  description?: string;
  tags?: string[];
};

export type TransactionAttachment = {
  id: string;
  transactionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedAt: Date;
};

export type TransactionFilter = {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  categories?: TransactionCategory[];
  cards?: string[];
  cardId?: string; // Single card filter
  amountRange?: {
    min: number;
    max: number;
  };
  merchants?: string[];
  tags?: string[];
  status?: TransactionStatus[];
  type?: TransactionType[];
  search?: string; // Search in merchant name, description, notes
};

export type TransactionSummary = {
  totalSpent: number;
  totalEarned: number; // Refunds, cashback
  transactionCount: number;
  averageTransactionValue: number;
  topCategories: Array<{
    category: TransactionCategory;
    amount: number;
    percentage: number;
    count: number;
  }>;
  topMerchants: Array<{
    merchant: string;
    amount: number;
    count: number;
  }>;
  topCards: Array<{
    cardId: string;
    cardName: string;
    amount: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string; // YYYY-MM format
    amount: number;
    count: number;
    categories: Record<TransactionCategory, number>;
  }>;
};

export type CreateTransactionRequest = {
  cardId?: string;
  amount: number;
  currency?: Currency;
  type: TransactionType;
  merchantName: string;
  description?: string;
  date: Date;
  category: TransactionCategory;
  subcategory?: string;
  tags?: string[];
  notes?: string;
  location?: Transaction['location'];
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
};

export type UpdateTransactionRequest = Partial<
  Pick<
    Transaction,
    | 'amount'
    | 'type'
    | 'merchantName'
    | 'description'
    | 'category'
    | 'subcategory'
    | 'tags'
    | 'notes'
    | 'location'
  >
>;

export type BulkTransactionImport = {
  transactions: CreateTransactionRequest[];
  source: 'pdf' | 'email' | 'csv' | 'manual';
  metadata?: {
    fileName?: string;
    statementId?: string;
    emailId?: string;
    importDate: Date;
  };
  options?: {
    skipDuplicates?: boolean;
    autoCategorize?: boolean;
    validateAmounts?: boolean;
  };
};

export type TransactionExport = {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  filters?: TransactionFilter;
  includeAttachments?: boolean;
  customFields?: string[];
};

export type TransactionInsight = {
  id: string;
  type:
    | 'spending_pattern'
    | 'unusual_transaction'
    | 'savings_opportunity'
    | 'goal_progress';
  title: string;
  description: string;
  actionItems?: string[];
  relatedTransactions?: string[];
  severity: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
};

export type Merchant = {
  id: string;
  name: string;
  aliases: string[]; // Alternative names
  category: TransactionCategory;
  subcategory?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  confidence: number; // 0-100 for categorization confidence
  userCorrections?: Array<{
    userId: string;
    category: TransactionCategory;
    correctedAt: Date;
  }>;
};

export type CategoryRule = {
  id: string;
  merchantPattern: string; // Regex pattern
  category: TransactionCategory;
  subcategory?: string;
  priority: number; // Higher priority rules are applied first
  isActive: boolean;
  createdBy: 'system' | 'user';
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
};

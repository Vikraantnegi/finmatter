/**
 * Transaction Types
 * Types for transactions in FinMatter
 */
export type TransactionType = 'debit' | 'credit' | 'refund';
export interface Transaction {
  id: string;
  user_id: string;
  card_id: string;
  statement_id?: string | null;
  transaction_date: string;
  posting_date?: string | null;
  merchant_name: string;
  merchant_category?: string | null;
  amount: number;
  type: TransactionType;
  currency: string;
  description?: string | null;
  category?: string | null;
  notes?: string | null;
  raw_text?: string | null;
  created_at: string;
  updated_at: string;
  cards?: {
    id: string;
    last_four_digits: string;
    card_name: string | null;
    bank_name: string | null;
  };
  statements?: {
    id: string;
    file_name: string;
    upload_date: string;
  };
}
export interface GroupedTransactions {
  [monthKey: string]: {
    transactions: Transaction[];
    totalDebits: number;
    totalCredits: number;
    netSpending: number;
  };
}
export interface TransactionFilters {
  card_id?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  type?: TransactionType;
  merchant?: string;
  limit?: number;
  offset?: number;
}
export interface TransactionsResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}
//# sourceMappingURL=transaction.d.ts.map

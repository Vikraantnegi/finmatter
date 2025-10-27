/**
 * Transaction Hooks
 * Custom hooks for fetching and managing transaction data
 */

'use client';

import useSWR from 'swr';
import { Transaction, TransactionFilter } from '@finmatter/types';
import { apiClient } from '@/lib/apiClient';

interface UseTransactionsOptions {
  filters?: TransactionFilter;
  page?: number;
  limit?: number;
  groupBy?: 'date' | 'category' | 'card' | 'none';
  sortBy?: 'date' | 'amount' | 'merchant';
  sortOrder?: 'asc' | 'desc';
}

interface UseTransactionsResponse {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mutate: () => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
}

/**
 * Hook to fetch transactions with filtering and pagination
 */
export function useTransactions(
  options: UseTransactionsOptions = {},
): UseTransactionsResponse {
  const {
    filters = {},
    page = 1,
    limit = 20,
    groupBy = 'date',
    sortBy = 'date',
    sortOrder = 'desc',
  } = options;

  // Build query parameters
  const queryParams = new URLSearchParams();

  // Pagination
  queryParams.set('page', page.toString());
  queryParams.set('limit', limit.toString());

  // Sorting
  queryParams.set('sortBy', sortBy);
  queryParams.set('sortOrder', sortOrder);

  // Grouping
  queryParams.set('groupBy', groupBy);

  // Filters
  if (filters.cardId) queryParams.set('cardId', filters.cardId);
  if (filters.categories && filters.categories.length > 0) {
    queryParams.set('category', filters.categories[0]); // API only supports single category for now
  }
  if (filters.dateRange) {
    queryParams.set('startDate', filters.dateRange.startDate.toISOString());
    queryParams.set('endDate', filters.dateRange.endDate.toISOString());
  }
  if (filters.amountRange) {
    queryParams.set('minAmount', filters.amountRange.min.toString());
    queryParams.set('maxAmount', filters.amountRange.max.toString());
  }
  if (filters.merchants && filters.merchants.length > 0) {
    queryParams.set('merchant', filters.merchants[0]); // API only supports single merchant for now
  }
  if (filters.search) {
    queryParams.set('search', filters.search);
  }

  const { data, error, mutate } = useSWR(
    `/api/transactions?${queryParams.toString()}`,
    async (url: string) => {
      const response = await apiClient.get<any>(url);
      return response.data;
    },
  );

  return {
    transactions: data?.data?.transactions || [],
    loading: !data && !error,
    error: error?.message || null,
    mutate,
    pagination: data?.data?.pagination || null,
  };
}

interface UseTransactionStatsOptions {
  period?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
  cardId?: string;
  category?: string;
  groupBy?: 'category' | 'card' | 'month' | 'week' | 'day';
}

interface TransactionStats {
  summary: {
    totalTransactions: number;
    totalSpent: number;
    averageTransactionValue: number;
    period: {
      start: string;
      end: string;
      type: string;
    };
  };
  breakdown: Array<{
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  trends: Array<{
    period: string;
    amount: number;
    count: number;
  }>;
  topMerchants: Array<{
    merchant: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
}

/**
 * Hook to fetch transaction statistics
 */
export function useTransactionStats(options: UseTransactionStatsOptions = {}): {
  stats: TransactionStats | null;
  loading: boolean;
  error: string | null;
  mutate: () => void;
} {
  const {
    period = 'month',
    startDate,
    endDate,
    cardId,
    category,
    groupBy = 'category',
  } = options;

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.set('period', period);
  queryParams.set('groupBy', groupBy);

  if (startDate) queryParams.set('startDate', startDate.toISOString());
  if (endDate) queryParams.set('endDate', endDate.toISOString());
  if (cardId) queryParams.set('cardId', cardId);
  if (category) queryParams.set('category', category);

  const { data, error, mutate } = useSWR(
    `/api/transactions/stats?${queryParams.toString()}`,
    async (url: string) => {
      const response = await apiClient.get<any>(url);
      return response.data;
    },
  );

  return {
    stats: data?.data || null,
    loading: !data && !error,
    error: error?.message || null,
    mutate,
  };
}

interface UseTransactionSearchOptions {
  query: string;
  page?: number;
  limit?: number;
  fields?: string[];
  filters?: Partial<TransactionFilter>;
}

/**
 * Hook to search transactions
 */
export function useTransactionSearch(options: UseTransactionSearchOptions): {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  mutate: () => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
} {
  const {
    query,
    page = 1,
    limit = 20,
    fields = ['merchant_name', 'description', 'notes'],
    filters = {},
  } = options;

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.set('q', query);
  queryParams.set('page', page.toString());
  queryParams.set('limit', limit.toString());
  queryParams.set('fields', fields.join(','));

  // Apply filters
  if (filters.cardId) queryParams.set('cardId', filters.cardId);
  if (filters.categories && filters.categories.length > 0) {
    queryParams.set('category', filters.categories[0]);
  }
  if (filters.dateRange) {
    queryParams.set('startDate', filters.dateRange.startDate.toISOString());
    queryParams.set('endDate', filters.dateRange.endDate.toISOString());
  }
  if (filters.amountRange) {
    queryParams.set('minAmount', filters.amountRange.min.toString());
    queryParams.set('maxAmount', filters.amountRange.max.toString());
  }

  const { data, error, mutate } = useSWR(
    query ? `/api/transactions/search?${queryParams.toString()}` : null,
    async (url: string) => {
      const response = await apiClient.get<any>(url);
      return response.data;
    },
  );

  return {
    transactions: data?.data?.transactions || [],
    loading: !data && !error,
    error: error?.message || null,
    mutate,
    pagination: data?.data?.pagination || null,
  };
}

/**
 * Hook to update transaction category
 */
export function useUpdateTransactionCategory() {
  const updateCategory = async (
    transactionId: string,
    category: string,
    subcategory?: string,
    learnFromCorrection: boolean = true,
  ) => {
    const response = await apiClient.put<any>(
      `/api/transactions/${transactionId}/category`,
      {
        category,
        subcategory,
        learnFromCorrection,
      },
    );
    return response.data;
  };

  return { updateCategory };
}

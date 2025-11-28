/**
 * Custom hook for fetching and managing card transactions
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import type {
  Transaction,
  TransactionsResponse,
  TransactionFilters,
} from '@finmatter/types';
import { toast } from 'react-hot-toast';

interface UseCardTransactionsOptions {
  cardId?: string;
  filters?: Omit<TransactionFilters, 'card_id'>;
  autoFetch?: boolean;
}

interface UseCardTransactionsReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  total: number;
  hasMore: boolean;
}

export function useCardTransactions(
  options: UseCardTransactionsOptions = {},
): UseCardTransactionsReturn {
  const { cardId, filters = {}, autoFetch = true } = options;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!cardId) {
      setTransactions([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        card_id: cardId,
        ...(filters.limit && { limit: filters.limit.toString() }),
        ...(filters.offset && { offset: filters.offset.toString() }),
        ...(filters.category && { category: filters.category }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
        ...(filters.type && { type: filters.type }),
        ...(filters.merchant && { merchant: filters.merchant }),
      });

      const response = await apiClient.get<TransactionsResponse>(
        `/api/transactions?${queryParams.toString()}`,
      );

      if (response.success) {
        setTransactions(response.data.transactions);
        setTotal(response.data.pagination.total);
        setHasMore(response.data.pagination.hasMore);
      } else {
        throw new Error('Failed to fetch transactions');
      }
    } catch (err: any) {
      const errorMessage =
        err?.message || err?.error?.message || 'Failed to load transactions';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cardId, filters]);

  useEffect(() => {
    if (autoFetch) {
      fetchTransactions();
    }
  }, [autoFetch, fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
    total,
    hasMore,
  };
}

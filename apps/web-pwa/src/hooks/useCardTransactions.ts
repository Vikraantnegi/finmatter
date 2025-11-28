/**
 * Custom hook for fetching and managing card transactions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(
    () => filters,
    [
      filters.limit,
      filters.offset,
      filters.category,
      filters.start_date,
      filters.end_date,
      filters.type,
      filters.merchant,
    ],
  );

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
        ...(memoizedFilters.limit && {
          limit: memoizedFilters.limit.toString(),
        }),
        ...(memoizedFilters.offset && {
          offset: memoizedFilters.offset.toString(),
        }),
        ...(memoizedFilters.category && { category: memoizedFilters.category }),
        ...(memoizedFilters.start_date && {
          start_date: memoizedFilters.start_date,
        }),
        ...(memoizedFilters.end_date && { end_date: memoizedFilters.end_date }),
        ...(memoizedFilters.type && { type: memoizedFilters.type }),
        ...(memoizedFilters.merchant && { merchant: memoizedFilters.merchant }),
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
  }, [cardId, memoizedFilters]);

  useEffect(() => {
    if (autoFetch && cardId) {
      fetchTransactions();
    }
  }, [autoFetch, cardId, fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
    total,
    hasMore,
  };
}

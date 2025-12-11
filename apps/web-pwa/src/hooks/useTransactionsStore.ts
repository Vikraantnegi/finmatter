/**
 * Transactions Hook
 * Consumes the shared transactions store (Zustand) so transaction state is consistent
 * across dashboard, list, detail views, and widgets.
 */

import { useCallback, useEffect } from 'react';
import type { TransactionFilters } from '@finmatter/types';
import { shallow } from 'zustand/shallow';
import {
  useTransactionsStore,
  type TransactionsState,
} from '@/stores/transactionsStore';

interface UseTransactionsStoreOptions {
  filters?: TransactionFilters;
  autoFetch?: boolean;
}

interface UseTransactionsStoreReturn {
  transactions: TransactionsState['transactions'];
  isLoading: TransactionsState['isLoading'];
  error: TransactionsState['error'];
  total: TransactionsState['total'];
  hasMore: TransactionsState['hasMore'];
  fetchTransactions: (
    filters?: TransactionFilters,
    options?: { force?: boolean },
  ) => Promise<void>;
  clearError: () => void;
}

const selector = (state: TransactionsState) => ({
  transactions: state.transactions,
  isLoading: state.isLoading,
  error: state.error,
  total: state.total,
  hasMore: state.hasMore,
  fetchTransactionsInternal: state.fetchTransactions,
  clearError: state.clearError,
});

export function useTransactionsFromStore(
  options: UseTransactionsStoreOptions = {},
): UseTransactionsStoreReturn {
  const { filters = {}, autoFetch = false } = options;

  const {
    transactions,
    isLoading,
    error,
    total,
    hasMore,
    fetchTransactionsInternal,
    clearError,
  } = useTransactionsStore(selector, shallow);

  const fetchTransactions = useCallback(
    (newFilters?: TransactionFilters, fetchOptions?: { force?: boolean }) =>
      fetchTransactionsInternal(newFilters || filters, fetchOptions),
    [fetchTransactionsInternal, filters],
  );

  useEffect(() => {
    if (autoFetch) {
      fetchTransactions(filters);
    }
  }, [autoFetch, fetchTransactions, filters]);

  return {
    transactions,
    isLoading,
    error,
    total,
    hasMore,
    fetchTransactions,
    clearError,
  };
}

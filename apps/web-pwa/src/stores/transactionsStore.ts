'use client';

import { create } from 'zustand';
import type {
  Transaction,
  TransactionsResponse,
  TransactionFilters,
} from '@finmatter/types';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'react-hot-toast';

export interface TransactionsState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  lastFetchedAt: number | null;
  currentFilters: TransactionFilters | null;
  fetchTransactions: (
    filters?: TransactionFilters,
    options?: { force?: boolean },
  ) => Promise<void>;
  clearError: () => void;
}

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  total: 0,
  hasMore: false,
  lastFetchedAt: null,
  currentFilters: null,

  clearError: () => set({ error: null }),

  fetchTransactions: async (filters = {}, { force = false } = {}) => {
    const { lastFetchedAt, isLoading, currentFilters } = get();

    // Check if filters have changed
    const filtersChanged =
      JSON.stringify(currentFilters) !== JSON.stringify(filters);

    // Skip refetch if:
    // 1. Not forced
    // 2. Currently loading
    // 3. Fetched within last 30 seconds
    // 4. Filters haven't changed
    if (!force && !isLoading && lastFetchedAt && !filtersChanged) {
      const elapsed = Date.now() - lastFetchedAt;
      if (elapsed < 30_000) {
        return;
      }
    }

    try {
      set({ isLoading: true, error: null });

      const queryParams = new URLSearchParams({
        ...(filters.limit && { limit: filters.limit.toString() }),
        ...(filters.offset && { offset: filters.offset.toString() }),
        ...(filters.category && { category: filters.category }),
        ...(filters.start_date && { start_date: filters.start_date }),
        ...(filters.end_date && { end_date: filters.end_date }),
        ...(filters.type && { type: filters.type }),
        ...(filters.merchant && { merchant: filters.merchant }),
        ...(filters.card_id && { card_id: filters.card_id }),
      });

      const apiUrl = `/api/transactions?${queryParams.toString()}`;
      const response = await apiClient.get<TransactionsResponse>(apiUrl);

      if (response.success) {
        set({
          transactions: response.data.transactions,
          total: response.data.pagination.total,
          hasMore: response.data.pagination.hasMore,
          lastFetchedAt: Date.now(),
          currentFilters: filters,
        });
      } else {
        throw new Error('Failed to fetch transactions');
      }
    } catch (err: any) {
      const errorMessage =
        err?.message || err?.error?.message || 'Failed to load transactions';
      set({ error: errorMessage });
      toast.error(errorMessage);
      console.error('Error fetching transactions:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
}));

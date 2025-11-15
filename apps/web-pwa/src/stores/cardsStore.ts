'use client';

import { create } from 'zustand';
import type { Card } from '@finmatter/types';
import { apiClient } from '@/lib/apiClient';
import { CARD_ROUTES } from '@/constants/apiRoutes';

type AddCardPayload = {
  cardNumber: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  bankId?: string;
  cardMetadataId?: string;
};

export interface CardsState {
  cards: Card[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  fetchCards: (options?: { force?: boolean }) => Promise<void>;
  addCard: (payload: AddCardPayload) => Promise<Card | null>;
  deleteCard: (cardId: string) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<Card | null>;
  clearError: () => void;
}

export const useCardsStore = create<CardsState>((set, get) => ({
  cards: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  clearError: () => set({ error: null }),

  fetchCards: async ({ force = false } = {}) => {
    const { lastFetchedAt, isLoading } = get();

    if (!force && !isLoading && lastFetchedAt) {
      const elapsed = Date.now() - lastFetchedAt;
      // Skip refetch if we fetched within the last 30 seconds
      if (elapsed < 30_000) {
        return;
      }
    }

    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.get<{
        success: boolean;
        cards: Card[];
        error?: string | { message?: string };
      }>(CARD_ROUTES.LIST);

      if (response.success && Array.isArray(response.cards)) {
        set({
          cards: response.cards,
          lastFetchedAt: Date.now(),
        });
      } else if (response && 'error' in response) {
        const message =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || 'Failed to fetch cards';
        set({ error: message });
      }
    } catch (error: unknown) {
      console.error('Error fetching cards:', error);
      const apiError = error as any;
      set({
        error:
          apiError?.response?.data?.error ||
          apiError?.message ||
          'Failed to fetch cards',
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addCard: async payload => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.post<{
        success: boolean;
        card?: Card;
        error?: string;
      }>(CARD_ROUTES.ADD, payload);

      if (response.success && response.card) {
        set(state => ({
          cards: [response.card!, ...state.cards],
        }));
        return response.card;
      }

      const message =
        response.error ||
        'Unable to add this card. Please verify the details and try again.';
      set({ error: message });
      throw new Error(message);
    } catch (error: unknown) {
      console.error('Error adding card:', error);
      const apiError = error as any;
      const message =
        apiError?.response?.data?.error ||
        apiError?.message ||
        'Failed to add card';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCard: async cardId => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.delete(CARD_ROUTES.DELETE(cardId));
      set(state => ({
        cards: state.cards.filter(card => card.id !== cardId),
      }));
    } catch (error: unknown) {
      console.error('Error deleting card:', error);
      const apiError = error as any;
      const message =
        apiError?.response?.data?.error ||
        apiError?.message ||
        'Failed to delete card';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateCard: async (cardId, updates) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.put<{
        success: boolean;
        card?: Card;
        error?: string;
      }>(CARD_ROUTES.UPDATE(cardId), updates);

      if (response.success && response.card) {
        set(state => ({
          cards: state.cards.map(card =>
            card.id === cardId ? response.card! : card,
          ),
        }));
        return response.card;
      }

      const message =
        response.error ||
        'Unable to update this card. Please verify the details and try again.';
      set({ error: message });
      throw new Error(message);
    } catch (error: unknown) {
      console.error('Error updating card:', error);
      const apiError = error as any;
      const message =
        apiError?.response?.data?.error ||
        apiError?.message ||
        'Failed to update card';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

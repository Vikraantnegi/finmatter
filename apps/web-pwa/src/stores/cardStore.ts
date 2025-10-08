'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card } from '@finmatter/types';
import { cardService } from '@/services/cardService';
import toast from 'react-hot-toast';

interface CardState {
  cards: Card[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCards: (cards: Card[]) => void;
  addCard: (card: Card) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  removeCard: (cardId: string) => void;
  deleteCard: (cardId: string) => Promise<void>;
  fetchCards: () => Promise<void>;
  clearCards: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed values
  getTotalLimit: () => number;
  getTotalUsed: () => number;
  getTotalAvailable: () => number;
  getAverageUtilization: () => number;
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      cards: [],
      isLoading: false,
      error: null,

      setCards: cards => {
        set({ cards, error: null });
      },

      addCard: card => {
        set(state => ({
          cards: [...state.cards, card],
          error: null,
        }));
      },

      updateCard: async (cardId, updates) => {
        try {
          // Call API to update card
          const updatedCard = await cardService.updateCard(cardId, updates);

          // Update local state with server response
          set(state => ({
            cards: state.cards.map(card =>
              card.id === cardId ? updatedCard : card,
            ),
            error: null,
          }));

          toast.success('Card updated successfully!');
        } catch (error) {
          console.error('Failed to update card:', error);
          set({ error: 'Failed to update card' });
          toast.error('Failed to update card. Please try again.');
          throw error;
        }
      },

      removeCard: cardId => {
        set(state => ({
          cards: state.cards.filter(card => card.id !== cardId),
          error: null,
        }));
      },

      deleteCard: async cardId => {
        try {
          // Call API to delete card (soft delete on backend)
          await cardService.deleteCard(cardId);

          // Remove from local state
          set(state => ({
            cards: state.cards.filter(card => card.id !== cardId),
            error: null,
          }));

          toast.success('Card deleted successfully!');
        } catch (error) {
          console.error('Failed to delete card:', error);
          set({ error: 'Failed to delete card' });
          toast.error('Failed to delete card. Please try again.');
          throw error;
        }
      },

      fetchCards: async () => {
        set({ isLoading: true, error: null });
        try {
          const cards = await cardService.getCards();
          set({ cards, isLoading: false, error: null });
        } catch (error) {
          console.error('Failed to fetch cards:', error);
          set({
            cards: [],
            error: 'Failed to fetch cards',
            isLoading: false,
          });
        }
      },

      clearCards: () => {
        set({ cards: [], error: null });
      },

      setLoading: loading => {
        set({ isLoading: loading });
      },

      setError: error => {
        set({ error });
      },

      getTotalLimit: () => {
        return get().cards.reduce(
          (total, card) => total + (card.creditLimit || 0),
          0,
        );
      },

      getTotalUsed: () => {
        return get().cards.reduce((total, card) => {
          const limit = card.creditLimit || 0;
          const used = limit - (card.availableCredit || 0);
          return total + used;
        }, 0);
      },

      getTotalAvailable: () => {
        const state = get();
        return state.getTotalLimit() - state.getTotalUsed();
      },

      getAverageUtilization: () => {
        const state = get();
        const totalLimit = state.getTotalLimit();
        const totalUsed = state.getTotalUsed();

        if (totalLimit === 0) return 0;
        return (totalUsed / totalLimit) * 100;
      },
    }),
    {
      name: 'card-storage',
      partialize: state => ({ cards: state.cards }),
    },
  ),
);

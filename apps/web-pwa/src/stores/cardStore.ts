'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card } from '@finmatter/types';

interface CardState {
  cards: Card[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCards: (cards: Card[]) => void;
  addCard: (card: Card) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  removeCard: (cardId: string) => void;
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

      setCards: (cards) => {
        set({ cards, error: null });
      },

      addCard: (card) => {
        set((state) => ({ 
          cards: [...state.cards, card],
          error: null 
        }));
      },

      updateCard: (cardId, updates) => {
        set((state) => ({
          cards: state.cards.map(card =>
            card.id === cardId ? { ...card, ...updates } : card
          ),
          error: null
        }));
      },

      removeCard: (cardId) => {
        set((state) => ({
          cards: state.cards.filter(card => card.id !== cardId),
          error: null
        }));
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      getTotalLimit: () => {
        return get().cards.reduce((total, card) => total + (card.creditLimit || 0), 0);
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
      partialize: (state) => ({ cards: state.cards }),
    }
  )
);

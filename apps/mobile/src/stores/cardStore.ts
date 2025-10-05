/**
 * Card Store - Zustand State Management
 * Handles card portfolio state with CRUD operations and optimistic updates
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Card, CardBenefit, CreateCardRequest } from '@finmatter/types';
import { cardService } from '../services/cardService';

interface CardState {
  // State
  cards: Card[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Actions
  fetchCards: () => Promise<void>;
  createCard: (cardData: CreateCardRequest) => Promise<Card | null>;
  updateCard: (cardId: string, updates: Partial<CreateCardRequest>) => Promise<Card | null>;
  deleteCard: (cardId: string) => Promise<boolean>;
  refreshCards: () => Promise<void>;
  clearError: () => void;
  
  // Optimistic updates
  addCardOptimistic: (card: Card) => void;
  updateCardOptimistic: (cardId: string, updates: Partial<Card>) => void;
  removeCardOptimistic: (cardId: string) => void;
  
  // Benefits management
  addCardBenefit: (cardId: string, benefitData: {
    category: string;
    rewardRate: number;
    rewardCap?: number;
    conditions?: Record<string, any>;
    isActive?: boolean;
  }) => Promise<CardBenefit | null>;
  
  updateCardBenefit: (cardId: string, benefitId: string, updates: {
    category?: string;
    rewardRate?: number;
    rewardCap?: number;
    conditions?: Record<string, any>;
    isActive?: boolean;
  }) => Promise<CardBenefit | null>;
  
  deleteCardBenefit: (cardId: string, benefitId: string) => Promise<boolean>;
}

export const useCardStore = create<CardState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        cards: [],
        loading: false,
        error: null,
        lastFetched: null,

        // Fetch cards from API
        fetchCards: async () => {
          const state = get();
          
          // Skip if already loading or recently fetched (within 30 seconds)
          if (state.loading || (state.lastFetched && Date.now() - state.lastFetched < 30000)) {
            return;
          }

          set({ loading: true, error: null });

          try {
            const response = await cardService.getCards();
            
            if (response.success && response.data) {
              set({ 
                cards: response.data.cards, 
                loading: false,
                lastFetched: Date.now(),
                error: null 
              });
            } else {
              set({ 
                error: response.error?.message || 'Failed to fetch cards',
                loading: false 
              });
            }
          } catch (error) {
            console.error('Fetch cards error:', error);
            set({ 
              error: 'An unexpected error occurred',
              loading: false 
            });
          }
        },

        // Create new card
        createCard: async (cardData: CreateCardRequest) => {
          set({ loading: true, error: null });

          try {
            const response = await cardService.createCard(cardData);
            
            if (response.success && response.data) {
              const newCard = response.data.card;
              set(state => ({
                cards: [...state.cards, newCard],
                loading: false,
                error: null,
                lastFetched: Date.now()
              }));
              return newCard;
            } else {
              set({ 
                error: response.error?.message || 'Failed to create card',
                loading: false 
              });
              return null;
            }
          } catch (error) {
            console.error('Create card error:', error);
            set({ 
              error: 'An unexpected error occurred',
              loading: false 
            });
            return null;
          }
        },

        // Update existing card
        updateCard: async (cardId: string, updates: Partial<CreateCardRequest>) => {
          set({ loading: true, error: null });

          try {
            const response = await cardService.updateCard(cardId, updates);
            
            if (response.success && response.data) {
              const updatedCard = response.data.card;
              set(state => ({
                cards: state.cards.map(card => 
                  card.id === cardId ? updatedCard : card
                ),
                loading: false,
                error: null,
                lastFetched: Date.now()
              }));
              return updatedCard;
            } else {
              set({ 
                error: response.error?.message || 'Failed to update card',
                loading: false 
              });
              return null;
            }
          } catch (error) {
            console.error('Update card error:', error);
            set({ 
              error: 'An unexpected error occurred',
              loading: false 
            });
            return null;
          }
        },

        // Delete card
        deleteCard: async (cardId: string) => {
          set({ loading: true, error: null });

          try {
            const response = await cardService.deleteCard(cardId);
            
            if (response.success) {
              set(state => ({
                cards: state.cards.filter(card => card.id !== cardId),
                loading: false,
                error: null,
                lastFetched: Date.now()
              }));
              return true;
            } else {
              set({ 
                error: response.error?.message || 'Failed to delete card',
                loading: false 
              });
              return false;
            }
          } catch (error) {
            console.error('Delete card error:', error);
            set({ 
              error: 'An unexpected error occurred',
              loading: false 
            });
            return false;
          }
        },

        // Refresh cards (force fetch)
        refreshCards: async () => {
          set({ lastFetched: null });
          await get().fetchCards();
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        },

        // Optimistic updates for better UX
        addCardOptimistic: (card: Card) => {
          set(state => ({
            cards: [...state.cards, card]
          }));
        },

        updateCardOptimistic: (cardId: string, updates: Partial<Card>) => {
          set(state => ({
            cards: state.cards.map(card => 
              card.id === cardId ? { ...card, ...updates } : card
            )
          }));
        },

        removeCardOptimistic: (cardId: string) => {
          set(state => ({
            cards: state.cards.filter(card => card.id !== cardId)
          }));
        },

        // Benefits management
        addCardBenefit: async (cardId: string, benefitData) => {
          try {
            const response = await cardService.addCardBenefit(cardId, benefitData);
            
            if (response.success && response.data) {
              const newBenefit = response.data.benefit;
              set(state => ({
                cards: state.cards.map(card => 
                  card.id === cardId 
                    ? { ...card, benefits: [...(card.benefits || []), newBenefit] }
                    : card
                )
              }));
              return newBenefit;
            }
            return null;
          } catch (error) {
            console.error('Add card benefit error:', error);
            return null;
          }
        },

        updateCardBenefit: async (cardId: string, benefitId: string, updates) => {
          try {
            const response = await cardService.updateCardBenefit(cardId, benefitId, updates);
            
            if (response.success && response.data) {
              const updatedBenefit = response.data.benefit;
              set(state => ({
                cards: state.cards.map(card => 
                  card.id === cardId 
                    ? { 
                        ...card, 
                        benefits: card.benefits?.map(benefit => 
                          benefit.id === benefitId ? updatedBenefit : benefit
                        ) || []
                      }
                    : card
                )
              }));
              return updatedBenefit;
            }
            return null;
          } catch (error) {
            console.error('Update card benefit error:', error);
            return null;
          }
        },

        deleteCardBenefit: async (cardId: string, benefitId: string) => {
          try {
            const response = await cardService.deleteCardBenefit(cardId, benefitId);
            
            if (response.success) {
              set(state => ({
                cards: state.cards.map(card => 
                  card.id === cardId 
                    ? { 
                        ...card, 
                        benefits: card.benefits?.filter(benefit => benefit.id !== benefitId) || []
                      }
                    : card
                )
              }));
              return true;
            }
            return false;
          } catch (error) {
            console.error('Delete card benefit error:', error);
            return false;
          }
        },
      }),
      {
        name: 'card-store',
        partialize: (state) => ({ 
          cards: state.cards,
          lastFetched: state.lastFetched 
        }),
      }
    ),
    {
      name: 'card-store',
    }
  )
);

// Selectors for common use cases
export const useCards = () => useCardStore(state => state.cards);
export const useCardLoading = () => useCardStore(state => state.loading);
export const useCardError = () => useCardStore(state => state.error);
export const useCardActions = () => useCardStore(state => ({
  fetchCards: state.fetchCards,
  createCard: state.createCard,
  updateCard: state.updateCard,
  deleteCard: state.deleteCard,
  refreshCards: state.refreshCards,
  clearError: state.clearError,
  addCardBenefit: state.addCardBenefit,
  updateCardBenefit: state.updateCardBenefit,
  deleteCardBenefit: state.deleteCardBenefit,
}));

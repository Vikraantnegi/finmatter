/**
 * Cards Hook
 * Consumes the shared cards store (Zustand) so card state is consistent
 * across dashboard, list, detail views, and sheets.
 */

import { useCallback } from 'react';
import type { Card } from '@finmatter/types';
import { shallow } from 'zustand/shallow';
import { useCardsStore, type CardsState } from '@/stores/cardsStore';

interface UseCardsReturn {
  cards: Card[];
  isLoading: boolean;
  error: string | null;
  fetchCards: (options?: { force?: boolean }) => Promise<void>;
  addCard: (payload: {
    cardNumber: string;
    cardHolderName: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    bankId?: string;
    cardMetadataId?: string;
  }) => Promise<Card | null>;
  deleteCard: (cardId: string) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<Card | null>;
  clearError: () => void;
}

const selector = (state: CardsState) => ({
  cards: state.cards,
  isLoading: state.isLoading,
  error: state.error,
  fetchCardsInternal: state.fetchCards,
  addCardInternal: state.addCard,
  deleteCardInternal: state.deleteCard,
  updateCardInternal: state.updateCard,
  clearError: state.clearError,
});

export function useCards(): UseCardsReturn {
  const {
    cards,
    isLoading,
    error,
    fetchCardsInternal,
    addCardInternal,
    deleteCardInternal,
    updateCardInternal,
    clearError,
  } = useCardsStore(selector, shallow);

  const fetchCards = useCallback(
    (options?: { force?: boolean }) => fetchCardsInternal(options),
    [fetchCardsInternal],
  );

  const addCard = useCallback(
    (payload: {
      cardNumber: string;
      cardHolderName: string;
      expiryMonth: number;
      expiryYear: number;
      cvv: string;
      bankId?: string;
      cardMetadataId?: string;
    }) => addCardInternal(payload),
    [addCardInternal],
  );

  const deleteCard = useCallback(
    (cardId: string) => deleteCardInternal(cardId),
    [deleteCardInternal],
  );

  const updateCard = useCallback(
    (cardId: string, updates: Partial<Card>) =>
      updateCardInternal(cardId, updates),
    [updateCardInternal],
  );

  return {
    cards,
    isLoading,
    error,
    fetchCards,
    addCard,
    deleteCard,
    updateCard,
    clearError,
  };
}

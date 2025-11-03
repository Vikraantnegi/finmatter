/**
 * Cards Hook
 * Manages card operations and state
 */

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { CARD_ROUTES } from '@/constants/apiRoutes';
import type { Card } from '@finmatter/types';

interface UseCardsReturn {
  cards: Card[];
  isLoading: boolean;
  error: string | null;
  addCard: (cardData: {
    cardNumber: string;
    cardHolderName: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
    bankId?: string;
    cardMetadataId?: string;
  }) => Promise<Card | null>;
  fetchCards: () => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<Card | null>;
}

export function useCards(): UseCardsReturn {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<{
        success: boolean;
        cards: Card[];
      }>(CARD_ROUTES.LIST);

      if (response.success && response.cards) {
        setCards(response.cards);
      }
    } catch (err: any) {
      console.error('Error fetching cards:', err);
      setError(err.message || 'Failed to fetch cards');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCard = useCallback(
    async (cardData: {
      cardNumber: string;
      cardHolderName: string;
      expiryMonth: number;
      expiryYear: number;
      cvv: string;
      bankId?: string;
      cardMetadataId?: string;
    }): Promise<Card | null> => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.post<{
          success: boolean;
          card: Card;
        }>(CARD_ROUTES.ADD, cardData);

        if (response.success && response.card) {
          setCards(prev => [response.card!, ...prev]);
          return response.card;
        }
        return null;
      } catch (err: any) {
        console.error('Error adding card:', err);
        setError(err.message || 'Failed to add card');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deleteCard = useCallback(async (cardId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await apiClient.delete(CARD_ROUTES.DELETE(cardId));
      setCards(prev => prev.filter(card => card.id !== cardId));
    } catch (err: any) {
      console.error('Error deleting card:', err);
      setError(err.message || 'Failed to delete card');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCard = useCallback(
    async (cardId: string, updates: Partial<Card>): Promise<Card | null> => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.put<{
          success: boolean;
          card: Card;
        }>(CARD_ROUTES.UPDATE(cardId), updates);

        if (response.success && response.card) {
          setCards(prev =>
            prev.map(card => (card.id === cardId ? response.card! : card)),
          );
          return response.card;
        }
        return null;
      } catch (err: any) {
        console.error('Error updating card:', err);
        setError(err.message || 'Failed to update card');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    cards,
    isLoading,
    error,
    addCard,
    fetchCards,
    deleteCard,
    updateCard,
  };
}

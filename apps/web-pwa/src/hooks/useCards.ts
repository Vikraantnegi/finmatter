'use client';

import { useCallback, useEffect } from 'react';
import { useCardStore } from '@/stores/cardStore';
import { cardService } from '@/services/cardService';
import toast from 'react-hot-toast';

export function useCards() {
  const {
    cards,
    isLoading,
    error,
    setCards,
    setLoading,
    setError,
    addCard,
    updateCard,
    removeCard,
    clearCards,
  } = useCardStore();

  const loadCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cards = await cardService.getCards();
      setCards(cards);
    } catch (error) {
      // Error handled by toast
      setError('Failed to load cards');
      // Don't retry on error to prevent infinite loops
    } finally {
      setLoading(false);
    }
  }, [setCards, setLoading, setError]);

  // Load cards on mount only once
  useEffect(() => {
    // Only load if we don't have cards and no error
    if (cards.length === 0 && !error && !isLoading) {
      loadCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  const createCard = useCallback(
    async (cardData: any) => {
      try {
        setLoading(true);
        const card = await cardService.createCard(cardData);
        addCard(card);
        toast.success('Card added successfully!');
        return { success: true, card };
      } catch (error) {
        // Error handled by toast
        toast.error('Failed to add card. Please try again.');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [addCard, setLoading],
  );

  const editCard = useCallback(
    async (cardId: string, cardData: any) => {
      try {
        setLoading(true);
        const card = await cardService.updateCard(cardId, cardData);
        updateCard(cardId, card);
        toast.success('Card updated successfully!');
        return { success: true, card };
      } catch (error) {
        // Error handled by toast
        toast.error('Failed to update card. Please try again.');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [updateCard, setLoading],
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      try {
        setLoading(true);
        await cardService.deleteCard(cardId);
        removeCard(cardId);
        toast.success('Card deleted successfully!');
        return { success: true };
      } catch (error) {
        // Error handled by toast
        toast.error('Failed to delete card. Please try again.');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [removeCard, setLoading],
  );

  const getCardById = useCallback(
    async (cardId: string) => {
      try {
        setLoading(true);
        const card = await cardService.getCardById(cardId);
        return { success: true, card };
      } catch (error) {
        // Error handled by toast
        setError('Failed to load card');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  const getCardBenefits = useCallback(
    async (cardId: string) => {
      try {
        const benefits = await cardService.getCardBenefits(cardId);
        return { success: true, benefits };
      } catch (error) {
        // Error handled by toast
        setError('Failed to load benefits');
        return { success: false, error };
      }
    },
    [setError],
  );

  // Computed values
  const totalCards = cards.length;
  const totalCreditLimit = cards.reduce(
    (sum, card) => sum + (card.creditLimit || 0),
    0,
  );
  const totalUtilizedAmount = cards.reduce((sum, card) => {
    const limit = card.creditLimit || 0;
    const used = limit - (card.availableCredit || 0);
    return sum + used;
  }, 0);
  const averageUtilization =
    totalCreditLimit > 0 ? (totalUtilizedAmount / totalCreditLimit) * 100 : 0;
  const highUtilizationCards = cards.filter(card => {
    if (!card.creditLimit || !card.availableCredit) return false;
    const utilization =
      ((card.creditLimit - card.availableCredit) / card.creditLimit) * 100;
    return utilization > 80;
  });

  // Manual refresh function for when user wants to reload
  const refreshCards = useCallback(async () => {
    setError(null);
    await loadCards();
  }, [loadCards, setError]);

  return {
    // State
    cards,
    isLoading,
    error,

    // Actions
    loadCards: refreshCards, // Expose refresh function instead of internal loadCards
    createCard,
    editCard,
    deleteCard,
    getCardById,
    getCardBenefits,
    clearCards,

    // Computed values
    totalCards,
    totalCreditLimit,
    totalUtilizedAmount,
    averageUtilization,
    highUtilizationCards,
  };
}

'use client';

import { useCallback, useEffect } from 'react';
import { useCardStore } from '@/stores/cardStore';
import { cardService } from '@/services/cardService';
import toast from 'react-hot-toast';
import { CardBenefit } from '@finmatter/types';

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
    // Don't load if already loading or if we have cards/error
    if (isLoading || cards.length > 0 || error) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const cards = await cardService.getCards();
      setCards(cards);
    } catch (error) {
      console.error('Load cards error:', error);
      setError('Failed to load cards');
      // Don't retry on error to prevent infinite loops
    } finally {
      setLoading(false);
    }
  }, [setCards, setLoading, setError, isLoading, cards.length, error]);

  // Load cards on mount
  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const createCard = useCallback(
    async (cardData: any) => {
      try {
        setLoading(true);
        const card = await cardService.createCard(cardData);
        addCard(card);
        toast.success('Card added successfully!');
        return { success: true, card };
      } catch (error) {
        console.error('Create card error:', error);
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
        console.error('Update card error:', error);
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
        console.error('Delete card error:', error);
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
        console.error('Get card error:', error);
        setError('Failed to load card');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  const getCardBenefits = useCallback(async (cardId: string) => {
    try {
      const benefits = await cardService.getCardBenefits(cardId);
      return { success: true, benefits };
    } catch (error) {
      console.error('Get card benefits error:', error);
      return { success: false, error };
    }
  }, []);

  const addCardBenefit = useCallback(
    async (cardId: string, benefit: Omit<CardBenefit, 'id'>) => {
      try {
        setLoading(true);
        const newBenefit = await cardService.addCardBenefit(cardId, benefit);

        // Update the card in the store with the new benefit
        const card = cards.find(c => c.id === cardId);
        if (card) {
          const updatedCard = {
            ...card,
            benefits: [...(card.benefits || []), newBenefit],
          };
          updateCard(cardId, updatedCard);
        }
        toast.success('Benefit added successfully!');
        return { success: true, benefit: newBenefit };
      } catch (error) {
        console.error('Add benefit error:', error);
        toast.error('Failed to add benefit. Please try again.');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [cards, updateCard, setLoading],
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

  return {
    // State
    cards,
    isLoading,
    error,

    // Actions
    loadCards,
    createCard,
    editCard,
    deleteCard,
    getCardById,
    getCardBenefits,
    addCardBenefit,
    clearCards,

    // Computed values
    totalCards,
    totalCreditLimit,
    totalUtilizedAmount,
    averageUtilization,
    highUtilizationCards,
  };
}

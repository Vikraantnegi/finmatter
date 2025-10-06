/**
 * Custom hooks for card data fetching with SWR
 * Provides caching, revalidation, and error handling
 */

import useSWR from 'swr';
import { useCardStore } from '../stores/cardStore';
import { cardService } from '../services/cardService';
import { Card } from '@finmatter/types';

// SWR fetcher functions
const cardsFetcher = async (): Promise<Card[]> => {
  const response = await cardService.getCards() as Record<string, any>;
  if (response.success && response.data) {
    return response.data.cards;
  }
  throw new Error(response.error?.message || 'Failed to fetch cards');
};

const cardFetcher = async (cardId: string): Promise<Card> => {
  const response = await cardService.getCard(cardId);
  if (response.success && response.data) {
    return response.data.card;
  }
  throw new Error(response.error?.message || 'Failed to fetch card');
};

// Custom hook for cards list with SWR
export const useCardsSWR = (options?: {
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
}) => {
  const { cards, loading, error } = useCardStore();

  const swrConfig = {
    refreshInterval: options?.refreshInterval || 0, // Disabled by default
    revalidateOnFocus: options?.revalidateOnFocus || false,
    revalidateOnReconnect: options?.revalidateOnReconnect || true,
    dedupingInterval: 30000, // 30 seconds
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    onError: (error: Error) => {
      console.error('SWR Cards Error:', error);
    },
  };

  const {
    data: swrData,
    error: swrError,
    isLoading,
    isValidating,
    mutate,
  } = useSWR('cards', cardsFetcher, swrConfig);

  // Sync SWR data with Zustand store
  React.useEffect(() => {
    if (swrData && !loading) {
      // Update store with fresh data from SWR
      useCardStore.setState({ cards: swrData, lastFetched: Date.now() });
    }
  }, [swrData, loading]);

  return {
    cards,
    loading: isLoading || loading,
    isValidating,
    error: error || swrError?.message,
    mutate,
    refresh: () => mutate(),
  };
};

// Custom hook for individual card with SWR
export const useCardSWR = (cardId: string | null) => {
  const { cards } = useCardStore();

  const {
    data: card,
    error,
    isLoading,
    mutate,
  } = useSWR(
    cardId ? `card-${cardId}` : null,
    () => cardId ? cardFetcher(cardId) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 2,
      fallbackData: cardId ? cards.find(c => c.id === cardId) : undefined,
    }
  );

  return {
    card,
    loading: isLoading,
    error: error?.message,
    mutate,
    refresh: () => mutate(),
  };
};

// Custom hook for cards with filters
export const useFilteredCards = (filters?: {
  status?: 'active' | 'inactive' | 'blocked' | 'expired';
  cardType?: 'credit' | 'debit' | 'prepaid';
  bankName?: string;
}) => {
  const { cards } = useCardStore();

  const filteredCards = React.useMemo(() => {
    if (!filters) return cards;

    return cards.filter(card => {
      if (filters.status && card.status !== filters.status) return false;
      if (filters.cardType && card.cardType !== filters.cardType) return false;
      if (filters.bankName && !card.bankName.toLowerCase().includes(filters.bankName.toLowerCase())) return false;
      return true;
    });
  }, [cards, filters]);

  return filteredCards;
};

// Custom hook for card statistics
export const useCardStats = () => {
  const { cards } = useCardStore();

  const stats = React.useMemo(() => {
    const total = cards.length;
    const active = cards.filter(c => c.status === 'active').length;
    const credit = cards.filter(c => c.cardType === 'credit').length;
    const debit = cards.filter(c => c.cardType === 'debit').length;
    const prepaid = cards.filter(c => c.cardType === 'prepaid').length;

    // Bank distribution
    const bankDistribution = cards.reduce((acc, card) => {
      acc[card.bankName] = (acc[card.bankName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Reward type distribution
    const rewardDistribution = cards.reduce((acc, card) => {
      acc[card.rewardType] = (acc[card.rewardType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      credit,
      debit,
      prepaid,
      bankDistribution,
      rewardDistribution,
    };
  }, [cards]);

  return stats;
};

// Import React for useEffect and useMemo
import React from 'react';

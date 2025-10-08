'use client';

import { useState, useCallback, useMemo } from 'react';
import { CardMetadata, BankMetadata } from '@finmatter/cc-engine';

export type SearchFilters = {
  bank?: string;
  cardType?: string;
  rewardType?: string;
  minCreditLimit?: number;
  maxAnnualFee?: number;
  hasWelcomeOffer?: boolean;
  hasLoungeAccess?: boolean;
  hasFuelSurcharge?: boolean;
};

export function useCardSearch(
  cardsData: CardMetadata[],
  banksData: BankMetadata[],
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<
    'name' | 'annualFee' | 'creditLimit' | 'rewards'
  >('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedCards = useMemo(() => {
    const filtered = cardsData.filter(card => {
      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = card.cardName.toLowerCase().includes(query);
        const matchesBank = banksData
          .find(bank => bank.id === card.bankId)
          ?.name.toLowerCase()
          .includes(query);
        const matchesFeatures = card.benefits?.some((benefit: string) =>
          benefit.toLowerCase().includes(query),
        );

        if (!matchesName && !matchesBank && !matchesFeatures) {
          return false;
        }
      }

      // Bank filter
      if (filters.bank && card.bankId !== filters.bank) {
        return false;
      }

      // Card type filter
      if (filters.cardType && card.cardType !== filters.cardType) {
        return false;
      }

      // Reward type filter
      if (filters.rewardType && card.rewardType !== filters.rewardType) {
        return false;
      }

      // Credit limit filter - CardMetadata doesn't have creditLimit
      // if (
      //   filters.minCreditLimit &&
      //   (card.creditLimit || 0) < filters.minCreditLimit
      // ) {
      //   return false;
      // }

      // Annual fee filter
      if (
        filters.maxAnnualFee &&
        (card.annualFee || 0) > filters.maxAnnualFee
      ) {
        return false;
      }

      // Welcome offer filter - CardMetadata doesn't have welcomeOffer
      // if (filters.hasWelcomeOffer && !card.welcomeOffer) {
      //   return false;
      // }

      // Lounge access filter
      if (
        filters.hasLoungeAccess &&
        !card.benefits?.some((benefit: string) =>
          benefit.toLowerCase().includes('lounge'),
        )
      ) {
        return false;
      }

      // Fuel surcharge filter
      if (
        filters.hasFuelSurcharge &&
        !card.benefits?.some(
          (benefit: string) =>
            benefit.toLowerCase().includes('fuel') ||
            benefit.toLowerCase().includes('surcharge'),
        )
      ) {
        return false;
      }

      return true;
    });

    // Sort cards
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.cardName.toLowerCase();
          bValue = b.cardName.toLowerCase();
          break;
        case 'annualFee':
          aValue = a.annualFee || 0;
          bValue = b.annualFee || 0;
          break;
        case 'creditLimit':
          // CardMetadata doesn't have creditLimit, use annualFee as fallback
          aValue = a.annualFee || 0;
          bValue = b.annualFee || 0;
          break;
        case 'rewards':
          // Sort by reward rate (simplified)
          aValue = a.rewardRules?.[0]?.rewardRate || 0;
          bValue = b.rewardRules?.[0]?.rewardRate || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [cardsData, banksData, searchQuery, filters, sortBy, sortOrder]);

  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  const updateSort = useCallback(
    (field: typeof sortBy, order: typeof sortOrder) => {
      setSortBy(field);
      setSortOrder(order);
    },
    [],
  );

  const toggleSort = useCallback(
    (field: typeof sortBy) => {
      if (sortBy === field) {
        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(field);
        setSortOrder('asc');
      }
    },
    [sortBy],
  );

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const banks = Array.from(new Set(cardsData.map(card => card.bankId)))
      .map(bankId => banksData.find(bank => bank.id === bankId))
      .filter(Boolean) as BankMetadata[];

    const cardTypes = Array.from(
      new Set(cardsData.map(card => card.cardType)),
    ).filter(Boolean);
    const rewardTypes = Array.from(
      new Set(cardsData.map(card => card.rewardType)),
    ).filter(Boolean);

    return {
      banks,
      cardTypes,
      rewardTypes,
    };
  }, [cardsData, banksData]);

  return {
    // State
    searchQuery,
    filters,
    sortBy,
    sortOrder,
    filteredAndSortedCards,
    filterOptions,

    // Actions
    updateSearchQuery,
    updateFilters,
    clearFilters,
    updateSort,
    toggleSort,

    // Computed
    totalResults: filteredAndSortedCards.length,
    hasActiveFilters: Object.keys(filters).length > 0 || searchQuery.length > 0,
  };
}

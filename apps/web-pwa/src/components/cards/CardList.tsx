'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { CARD_ROUTES } from '@/constants/apiRoutes';
import type { Card } from '@finmatter/types';

export const CardList = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
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
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-gray-400'>Loading cards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-red-400'>Error: {error}</div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-gray-400'>No cards found</div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold text-white mb-4'>
        Card List Screen
      </h2>
      <div className='text-gray-400 text-sm'>
        {cards.length} card{cards.length !== 1 ? 's' : ''} found
      </div>
      {/* TODO: Implement card list UI */}
      <div className='grid grid-cols-1 gap-4'>
        {cards.map(card => (
          <div
            key={card.id}
            className='p-4 bg-gray-800 rounded-xl border border-gray-700'
          >
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-white font-semibold'>
                  **** **** **** {card.lastFourDigits}
                </div>
                <div className='text-gray-400 text-sm mt-1'>
                  {card.bank?.displayName || card.bank?.name || 'Unknown Bank'}
                </div>
              </div>
              <div className='text-gray-400 text-sm'>{card.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

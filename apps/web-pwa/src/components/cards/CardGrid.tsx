'use client';

import { Card } from '@finmatter/types';
import { CreditCardVisual } from './CreditCardVisual';
import { CardStats } from './CardStats';

interface CardGridProps {
  cards: Card[];
}

export function CardGrid({ cards }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-gray-400 mb-4'>
          <svg
            className='mx-auto h-12 w-12'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1}
              d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
            />
          </svg>
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>
          No cards found
        </h3>
        <p className='text-gray-500'>
          Add your first credit card to get started.
        </p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
      {cards.map(card => (
        <div key={card.id} className='group relative'>
          <div className='space-y-4'>
            {/* Card Visual */}
            <CreditCardVisual card={card} />

            {/* Card Stats */}
            <CardStats card={card} />
          </div>
        </div>
      ))}
    </div>
  );
}

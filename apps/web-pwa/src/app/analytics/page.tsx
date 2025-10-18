'use client';

import { useState } from 'react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { useCards } from '@/hooks/useCards';
import { BarChart3, Filter } from 'lucide-react';

export default function AnalyticsPage() {
  const { cards } = useCards();
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>();

  return (
    <div className='min-h-screen bg-white'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <BarChart3 className='w-8 h-8 text-primary-500' />
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>Analytics</h1>
                <p className='text-gray-500'>
                  Insights into your spending patterns and card usage
                </p>
              </div>
            </div>

            {/* Card Filter */}
            <div className='flex items-center space-x-2'>
              <Filter className='w-4 h-4 text-gray-500' />
              <select
                value={selectedCardId || ''}
                onChange={e => setSelectedCardId(e.target.value || undefined)}
                className='px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              >
                <option value=''>All Cards</option>
                {cards.map(card => (
                  <option key={card.id} value={card.id}>
                    {card.bankName} • {card.cardName} • ****
                    {card.lastFourDigits}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <AnalyticsDashboard cardId={selectedCardId} />
      </div>
    </div>
  );
}

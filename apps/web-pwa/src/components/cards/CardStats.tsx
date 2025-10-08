'use client';

import { Card } from '@finmatter/types';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface CardStatsProps {
  card: Card;
}

export function CardStats({ card }: CardStatsProps) {
  const router = useRouter();

  const limit = card.creditLimit || 0;
  const used = limit - (card.availableCredit || 0);
  const utilization = limit > 0 ? (used / limit) * 100 : 0;
  const available = card.availableCredit || 0;

  const handleCardClick = () => {
    router.push(`/cards/${card.id}`);
  };

  return (
    <div
      className='card cursor-pointer hover:shadow-md transition-shadow'
      onClick={handleCardClick}
    >
      <div className='space-y-4'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-gray-900'>{card.cardName}</h3>
          <span className='text-sm text-gray-500'>
            {card.network?.toUpperCase()}
          </span>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Limit</p>
            <p className='text-lg font-semibold text-gray-900'>
              {formatCurrency(limit)}
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Used</p>
            <p className='text-lg font-semibold text-gray-900'>
              {formatCurrency(used)}
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Available</p>
            <p className='text-lg font-semibold text-success-600'>
              {formatCurrency(available)}
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Utilization</p>
            <p
              className={`text-lg font-semibold ${
                utilization > 80
                  ? 'text-error-600'
                  : utilization > 50
                    ? 'text-warning-600'
                    : 'text-success-600'
              }`}
            >
              {formatPercentage(utilization)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600'>Usage</span>
            <span className='text-gray-900'>
              {formatPercentage(utilization)}
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                utilization > 80
                  ? 'bg-error-500'
                  : utilization > 50
                    ? 'bg-warning-500'
                    : 'bg-success-500'
              }`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className='flex space-x-2 pt-2'>
          <button
            onClick={e => {
              e.stopPropagation();
              router.push(`/cards/${card.id}/edit`);
            }}
            className='flex-1 text-sm text-primary-600 hover:text-primary-700 font-medium'
          >
            Edit
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              router.push(`/transactions?card=${card.id}`);
            }}
            className='flex-1 text-sm text-primary-600 hover:text-primary-700 font-medium'
          >
            Transactions
          </button>
        </div>
      </div>
    </div>
  );
}

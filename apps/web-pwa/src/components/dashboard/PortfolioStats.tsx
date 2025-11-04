'use client';

import React from 'react';
import { CreditCard, TrendingUp, Wallet, Calendar } from 'lucide-react';
import type { Card } from '@finmatter/types';
import { formatCurrency } from '@/lib/utils';

interface PortfolioStatsProps {
  cards: Card[];
  className?: string;
}

interface StatItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}

export const PortfolioStats = ({ cards, className }: PortfolioStatsProps) => {
  // Calculate stats
  const totalCards = cards.length;

  const totalCreditLimit = cards.reduce((sum, card) => {
    return sum + (card.creditLimit || 0);
  }, 0);

  const totalAvailableCredit = cards.reduce((sum, card) => {
    return sum + (card.availableCredit || 0);
  }, 0);

  // Find next billing date (simplified - would need actual billing logic)
  const nextBillingDate = cards.length > 0 ? '15th' : 'N/A';

  const stats: StatItem[] = [
    {
      icon: CreditCard,
      label: 'Total Cards',
      value: totalCards.toString(),
      color: 'text-primary',
    },
    {
      icon: TrendingUp,
      label: 'Credit Limit',
      value: totalCreditLimit > 0 ? formatCurrency(totalCreditLimit) : 'N/A',
      color: 'text-primary',
    },
    {
      icon: Wallet,
      label: 'Available Credit',
      value:
        totalAvailableCredit > 0 ? formatCurrency(totalAvailableCredit) : 'N/A',
      color: 'text-primary',
    },
    {
      icon: Calendar,
      label: 'Next Billing',
      value: nextBillingDate,
      color: 'text-primary',
    },
  ];

  return (
    <div className={className}>
      <h2 className='text-xl font-bold text-white mb-4 px-6'>
        Portfolio Stats
      </h2>
      <div className='grid grid-cols-2 gap-4 px-6'>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className='bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors'
            >
              <div className='flex items-center gap-3 mb-2'>
                <div className={`p-2 rounded-lg bg-gray-700/50 ${stat.color}`}>
                  <Icon className='w-5 h-5' />
                </div>
                <div className='flex-1'>
                  <p className='text-xs text-gray-400 mb-1'>{stat.label}</p>
                  <p className='text-xl font-bold text-white'>{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

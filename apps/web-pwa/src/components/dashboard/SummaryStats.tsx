/**
 * Dashboard Summary Stats Component
 * Shows key metrics at a glance
 */

'use client';

import React from 'react';
import { useTransactionStats } from '@/hooks/useTransactions';
import { useCards } from '@/hooks/useCards';
import { formatLargeNumber } from '@finmatter/shared';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Target,
  AlertCircle,
} from 'lucide-react';
import { MotionDiv } from '@/components/ui/Motion';

interface SummaryStatsProps {
  className?: string;
}

export function SummaryStats({ className = '' }: SummaryStatsProps) {
  const { stats, loading } = useTransactionStats({ period: 'month' });
  const { totalCards } = useCards();

  if (loading || !stats) {
    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
      >
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'
          >
            <div className='animate-pulse'>
              <div className='h-12 w-12 bg-gray-200 rounded-lg mb-4'></div>
              <div className='h-6 w-20 bg-gray-200 rounded mb-2'></div>
              <div className='h-4 w-16 bg-gray-200 rounded'></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: 'Total Spent',
      value: formatLargeNumber(stats.summary.totalSpent, 'INR'),
      icon: Wallet,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      trend: stats.summary.totalSpent > 0 ? '+12.5%' : '0%',
      trendUp: true,
    },
    {
      title: 'Transactions',
      value: stats.summary.totalTransactions,
      icon: CreditCard,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      trend: '+8.2%',
      trendUp: true,
    },
    {
      title: 'Avg Transaction',
      value: formatLargeNumber(stats.summary.averageTransactionValue, 'INR'),
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      trend: '-3.1%',
      trendUp: false,
    },
    {
      title: 'Cards',
      value: totalCards,
      icon: Target,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      trend: totalCards > 0 ? 'Active' : 'Add Card',
      trendUp: true,
    },
  ];

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      {metrics.map((metric, index) => (
        <MotionDiv
          key={metric.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'>
            <div className='flex items-start justify-between mb-4'>
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} shadow-sm`}
              >
                <metric.icon className='w-6 h-6 text-white' />
              </div>
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  metric.trendUp
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {metric.trendUp ? (
                  <TrendingUp className='w-3 h-3' />
                ) : (
                  <AlertCircle className='w-3 h-3' />
                )}
                <span>{metric.trend}</span>
              </div>
            </div>

            <div>
              <p className='text-sm text-gray-600 mb-1'>{metric.title}</p>
              <p className='text-2xl font-bold text-gray-900'>{metric.value}</p>
            </div>
          </div>
        </MotionDiv>
      ))}
    </div>
  );
}

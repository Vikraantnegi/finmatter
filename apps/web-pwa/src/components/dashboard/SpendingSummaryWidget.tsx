'use client';

import React from 'react';
import { TrendingUp, Award } from 'lucide-react';
import { formatCurrency } from '@finmatter/shared';
import { useTransactions } from '@/hooks/useTransactions';
import { calculateMonthlySpending } from '@finmatter/shared';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface SpendingSummaryWidgetProps {
  className?: string;
}

export function SpendingSummaryWidget({
  className = '',
}: SpendingSummaryWidgetProps) {
  const { transactions, isLoading } = useTransactions({
    autoFetch: true,
  });

  const monthlyStats = React.useMemo(() => {
    return calculateMonthlySpending(transactions);
  }, [transactions]);

  if (isLoading) {
    return (
      <div className={`px-6 ${className}`}>
        <div className='bg-gray-800 rounded-xl p-6 border border-gray-700'>
          <LoadingSpinner size='sm' />
        </div>
      </div>
    );
  }

  return (
    <div className={`px-6 ${className}`}>
      <div className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
        <div className='flex items-center gap-6'>
          {/* This Month's Spend */}
          <div className='flex-1 flex items-center gap-4'>
            <div className='w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0'>
              <TrendingUp className='w-6 h-6 text-primary' />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm text-gray-400 mb-1'>
                This Month&apos;s Spend
              </p>
              <p className='text-2xl font-bold text-white'>
                {formatCurrency(monthlyStats.totalSpend)}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className='w-px h-16 bg-gray-700' />

          {/* Total Rewards Earned */}
          <div className='flex-1 flex items-center gap-4'>
            <div className='w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0'>
              <Award className='w-6 h-6 text-green-400' />
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm text-gray-400 mb-1'>Total Rewards Earned</p>
              <p className='text-2xl font-bold text-green-400'>
                {formatCurrency(monthlyStats.totalRewards)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

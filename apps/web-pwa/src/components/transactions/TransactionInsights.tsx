/**
 * Transaction Insights Component
 * Shows spending analytics and insights on the dashboard
 */

'use client';

import React from 'react';
import { useTransactionStats } from '@/hooks/useTransactions';
import { CategoryIcon } from '@/components/transactions/CategoryIcon';
import { formatCurrency } from '@finmatter/shared';
import { TrendingUp, TrendingDown, AlertCircle, Target } from 'lucide-react';

interface TransactionInsightsProps {
  className?: string;
}

export function TransactionInsights({
  className = '',
}: TransactionInsightsProps) {
  const { stats, loading, error } = useTransactionStats({
    period: 'month',
    groupBy: 'category',
  });

  if (loading) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className='animate-pulse'>
          <div className='h-6 w-48 bg-gray-200 rounded mb-4'></div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className='h-16 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className='flex items-center space-x-2 text-gray-500'>
          <AlertCircle className='w-5 h-5' />
          <span>Unable to load transaction insights</span>
        </div>
      </div>
    );
  }

  const topCategories = stats.breakdown.slice(0, 4);
  const totalSpent = stats.summary.totalSpent;
  const avgTransaction = stats.summary.averageTransactionValue;

  // Calculate spending trends (mock data for now)
  const spendingTrend = {
    direction: 'up' as const,
    percentage: 12.5,
    period: 'vs last month',
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            Spending Insights
          </h3>
          <p className='text-sm text-gray-600'>
            This month&apos;s transaction analysis
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          {spendingTrend.direction === 'up' ? (
            <TrendingUp className='w-5 h-5 text-red-500' />
          ) : (
            <TrendingDown className='w-5 h-5 text-green-500' />
          )}
          <span
            className={`text-sm font-medium ${
              spendingTrend.direction === 'up'
                ? 'text-red-600'
                : 'text-green-600'
            }`}
          >
            {spendingTrend.direction === 'up' ? '+' : '-'}
            {spendingTrend.percentage}%
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <Target className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Total Spent</p>
              <p className='text-xl font-semibold text-gray-900'>
                {formatCurrency(totalSpent, 'INR')}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-green-100 rounded-lg'>
              <TrendingUp className='w-5 h-5 text-green-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Avg Transaction</p>
              <p className='text-xl font-semibold text-gray-900'>
                {formatCurrency(avgTransaction, 'INR')}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-purple-100 rounded-lg'>
              <AlertCircle className='w-5 h-5 text-purple-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Transactions</p>
              <p className='text-xl font-semibold text-gray-900'>
                {stats.summary.totalTransactions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div>
        <h4 className='text-sm font-medium text-gray-900 mb-3'>
          Top Spending Categories
        </h4>
        <div className='space-y-3'>
          {topCategories.map(category => (
            <div
              key={category.category}
              className='flex items-center justify-between'
            >
              <div className='flex items-center space-x-3'>
                <CategoryIcon category={category.category as any} size='sm' />
                <div>
                  <p className='text-sm font-medium text-gray-900 capitalize'>
                    {category.category}
                  </p>
                  <p className='text-xs text-gray-500'>
                    {category.count} transactions
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <p className='text-sm font-semibold text-gray-900'>
                  {formatCurrency(category.amount, 'INR')}
                </p>
                <p className='text-xs text-gray-500'>
                  {category.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className='mt-6 pt-4 border-t border-gray-200'>
        <div className='flex items-center justify-between'>
          <p className='text-sm text-gray-600'>
            {stats.summary.totalTransactions > 0
              ? `${stats.summary.totalTransactions} transactions categorized automatically`
              : 'Upload a statement to see transaction insights'}
          </p>
          <button className='text-sm text-blue-600 hover:text-blue-700 font-medium'>
            View All Transactions →
          </button>
        </div>
      </div>
    </div>
  );
}

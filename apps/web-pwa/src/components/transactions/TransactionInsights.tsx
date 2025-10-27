/**
 * Transaction Insights Component
 * Shows spending analytics and insights on the dashboard
 */

'use client';

import React, { useState } from 'react';
import { useTransactionStats } from '@/hooks/useTransactions';
import { CategoryIcon } from '@/components/transactions/CategoryIcon';
import { formatCurrency } from '@finmatter/shared';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Target,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { SpendingPieChart, CategoryBarChart } from '@/components/charts';

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
  const [activeView, setActiveView] = useState<'list' | 'pie' | 'bar'>('pie');

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

  const topCategories = stats.breakdown;
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
        <div className='flex items-center space-x-4'>
          {/* View Toggle */}
          <div className='flex items-center space-x-2 bg-gray-100 rounded-lg p-1'>
            <button
              onClick={() => setActiveView('pie')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeView === 'pie'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PieChart className='w-4 h-4' />
            </button>
            <button
              onClick={() => setActiveView('bar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeView === 'bar'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className='w-4 h-4' />
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeView === 'list'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
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
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-blue-500 rounded-lg'>
              <Target className='w-5 h-5 text-white' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Total Spent</p>
              <p className='text-xl font-bold text-gray-900'>
                {formatCurrency(totalSpent, 'INR')}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-green-500 rounded-lg'>
              <TrendingUp className='w-5 h-5 text-white' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Avg Transaction</p>
              <p className='text-xl font-bold text-gray-900'>
                {formatCurrency(avgTransaction, 'INR')}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4'>
          <div className='flex items-center space-x-3'>
            <div className='p-2 bg-purple-500 rounded-lg'>
              <AlertCircle className='w-5 h-5 text-white' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Transactions</p>
              <p className='text-xl font-bold text-gray-900'>
                {stats.summary.totalTransactions}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts or List View */}
      {activeView === 'pie' && topCategories.length > 0 && (
        <div className='mb-6'>
          <h4 className='text-sm font-medium text-gray-900 mb-4'>
            Spending Distribution
          </h4>
          <SpendingPieChart data={topCategories} />
        </div>
      )}

      {activeView === 'bar' && topCategories.length > 0 && (
        <div className='mb-6'>
          <h4 className='text-sm font-medium text-gray-900 mb-4'>
            Category-wise Spending
          </h4>
          <CategoryBarChart data={topCategories} />
        </div>
      )}

      {activeView === 'list' && (
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
      )}

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

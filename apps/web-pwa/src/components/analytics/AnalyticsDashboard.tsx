'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  analyticsService,
  CardUsageStats,
  MonthlySpending,
  TopMerchant,
} from '@/services/analyticsService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, ShoppingBag, BarChart3 } from 'lucide-react';

interface AnalyticsDashboardProps {
  cardId?: string;
}

export function AnalyticsDashboard({ cardId }: AnalyticsDashboardProps) {
  console.log('AnalyticsDashboard render:', { cardId });

  const [usageStats, setUsageStats] = useState<CardUsageStats[]>([]);
  const [monthlySpending, setMonthlySpending] = useState<MonthlySpending[]>([]);
  const [topMerchants, setTopMerchants] = useState<TopMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!cardId || hasFetched.current === cardId) {
      console.log('Skipping fetch - already fetched for cardId:', cardId);
      return;
    }

    try {
      setLoading(true);
      hasFetched.current = cardId;
      console.log('Fetching analytics for cardId:', cardId);

      const [usage, spending, merchants] = await Promise.all([
        analyticsService.getCardUsageStats({ cardId, limit: 10 }),
        analyticsService.getMonthlySpending({ cardId, limit: 20 }),
        analyticsService.getTopMerchants({ cardId, limit: 10 }),
      ]);

      console.log('Analytics data fetched:', {
        usage: usage.length,
        spending: spending.length,
        merchants: merchants.length,
        usageData: usage,
        spendingData: spending,
        merchantsData: merchants,
      });

      setUsageStats(usage);
      setMonthlySpending(spending);
      setTopMerchants(merchants);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      hasFetched.current = null; // Reset on error to allow retry
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    // Reset the fetched state when cardId changes
    if (hasFetched.current !== cardId) {
      hasFetched.current = null;
      setUsageStats([]);
      setMonthlySpending([]);
      setTopMerchants([]);
    }

    if (cardId) {
      fetchAnalytics();
    }
  }, [cardId, fetchAnalytics]);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  console.log('AnalyticsDashboard render state:', {
    usageStats: usageStats.length,
    monthlySpending: monthlySpending.length,
    topMerchants: topMerchants.length,
    loading,
  });

  // Show empty state if no data at all
  if (
    usageStats.length === 0 &&
    monthlySpending.length === 0 &&
    topMerchants.length === 0
  ) {
    return (
      <div className='text-center py-12'>
        <div className='text-gray-400 mb-2'>📊</div>
        <p className='text-gray-600'>No analytics data available yet.</p>
        <p className='text-sm text-gray-500 mt-1'>
          Upload statements or add transactions to see analytics.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Card Usage Stats */}
      {usageStats.length > 0 && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center space-x-2 mb-4'>
            <CreditCard className='w-5 h-5 text-primary-500' />
            <h3 className='text-lg font-semibold text-gray-900'>
              Card Usage Statistics
            </h3>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {usageStats.map(stat => (
              <div
                key={stat.card_id}
                className='border border-gray-200 rounded-lg p-4'
              >
                <div className='flex items-center justify-between mb-2'>
                  <h4 className='font-medium text-gray-900'>
                    {stat.card_name}
                  </h4>
                  <span className='text-sm text-gray-500'>
                    {stat.bank_name}
                  </span>
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Total Spent</span>
                    <span className='font-medium'>
                      {formatCurrency(stat.total_spent)}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Transactions</span>
                    <span className='font-medium'>
                      {stat.transaction_count}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Avg Transaction</span>
                    <span className='font-medium'>
                      {formatCurrency(stat.avg_transaction)}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>This Month</span>
                    <span className='font-medium'>
                      {formatCurrency(stat.current_month_spent)}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-600'>Last Used</span>
                    <span className='font-medium'>
                      {formatDate(stat.last_used_date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Spending by Category */}
      {monthlySpending.length > 0 && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center space-x-2 mb-4'>
            <BarChart3 className='w-5 h-5 text-primary-500' />
            <h3 className='text-lg font-semibold text-gray-900'>
              Monthly Spending by Category
            </h3>
          </div>

          <div className='space-y-3'>
            {monthlySpending.map((spending, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 border border-gray-200 rounded-lg'
              >
                <div className='flex items-center space-x-3'>
                  <div className='w-3 h-3 bg-primary-500 rounded-full'></div>
                  <div>
                    <div className='font-medium text-gray-900 capitalize'>
                      {spending.category.replace(/_/g, ' ')}
                    </div>
                    <div className='text-sm text-gray-500'>
                      {formatDate(spending.month)} •{' '}
                      {spending.transaction_count} transactions
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='font-medium text-gray-900'>
                    {formatCurrency(spending.total_amount)}
                  </div>
                  <div className='text-sm text-gray-500'>
                    Avg: {formatCurrency(spending.avg_amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Merchants */}
      {topMerchants.length > 0 && (
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center space-x-2 mb-4'>
            <ShoppingBag className='w-5 h-5 text-primary-500' />
            <h3 className='text-lg font-semibold text-gray-900'>
              Top Merchants
            </h3>
          </div>

          <div className='space-y-3'>
            {topMerchants.map((merchant, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 border border-gray-200 rounded-lg'
              >
                <div className='flex items-center space-x-3'>
                  <div className='w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center'>
                    <span className='text-sm font-medium text-primary-600'>
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <div className='font-medium text-gray-900'>
                      {merchant.merchant_name}
                    </div>
                    <div className='text-sm text-gray-500 capitalize'>
                      {merchant.category.replace(/_/g, ' ')} •{' '}
                      {merchant.transaction_count} transactions
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='font-medium text-gray-900'>
                    {formatCurrency(merchant.total_spent)}
                  </div>
                  <div className='text-sm text-gray-500'>
                    Avg: {formatCurrency(merchant.avg_amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {usageStats.length === 0 &&
        monthlySpending.length === 0 &&
        topMerchants.length === 0 && (
          <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center'>
            <BarChart3 className='w-12 h-12 mx-auto mb-4 text-gray-300' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No Analytics Data
            </h3>
            <p className='text-gray-500'>
              Upload and process some statements to see your spending analytics
              and insights.
            </p>
          </div>
        )}
    </div>
  );
}

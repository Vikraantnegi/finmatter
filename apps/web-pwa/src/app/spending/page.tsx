'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PieChart as PieChartIcon } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import {
  calculateCategorySpending,
  calculateTopMerchants,
  calculateSpendingTrends,
  calculateAverageMonthlySpending,
  calculatePercentageChange,
  getCategoryIcon,
  formatCurrency,
} from '@finmatter/shared';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Building2, Coffee, ShoppingCart } from 'lucide-react';

type TimePeriod = '1M' | '3M' | '6M' | 'YTD';

const COLORS = [
  '#13a4ec', // primary blue
  '#10b981', // green
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#eab308', // yellow
];

export default function SpendingPage() {
  const router = useRouter();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1M');

  const { transactions, isLoading } = useTransactions({
    autoFetch: true,
  });

  // Filter transactions based on time period
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];
    const now = new Date();
    const cutoffDate = new Date();

    switch (timePeriod) {
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case 'YTD':
        cutoffDate.setMonth(0, 1); // January 1st
        break;
    }

    return transactions.filter(txn => {
      const txnDate = new Date(txn.transaction_date);
      return txnDate >= cutoffDate && txn.type === 'debit';
    });
  }, [transactions, timePeriod]);

  // Calculate analytics
  const totalSpend = useMemo(() => {
    return filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  }, [filteredTransactions]);

  const averagePerMonth = useMemo(() => {
    return calculateAverageMonthlySpending(filteredTransactions, 3);
  }, [filteredTransactions]);

  const categories = useMemo(() => {
    return calculateCategorySpending(filteredTransactions, 10);
  }, [filteredTransactions]);

  const topCategory = useMemo(() => {
    return categories.length > 0 ? categories[0] : null;
  }, [categories]);

  const topMerchants = useMemo(() => {
    return calculateTopMerchants(filteredTransactions, 5);
  }, [filteredTransactions]);

  const trends = useMemo(() => {
    return calculateSpendingTrends(filteredTransactions, 6);
  }, [filteredTransactions]);

  const trendChange = useMemo(() => {
    if (trends.length < 2) return 0;
    const current = trends[trends.length - 1]?.amount || 0;
    const previous = trends[trends.length - 2]?.amount || 0;
    return calculatePercentageChange(current, previous);
  }, [trends]);

  // Chart data
  const chartData = useMemo(() => {
    return categories.slice(0, 4).map((cat, index) => ({
      name: cat.category,
      value: cat.amount,
      color: COLORS[index % COLORS.length],
    }));
  }, [categories]);

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className='bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg'>
          <p className='text-sm font-semibold text-white mb-1'>{data.name}</p>
          <p className='text-lg font-bold text-primary'>
            {formatCurrency(data.value)}
          </p>
          <p className='text-xs text-gray-400 mt-1'>
            {((data.value / totalSpend) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  // Get merchant icon
  const getMerchantIcon = (merchant: string) => {
    const lower = merchant.toLowerCase();
    if (lower.includes('amazon') || lower.includes('shopping')) {
      return <Building2 className='w-5 h-5' />;
    }
    if (lower.includes('starbucks') || lower.includes('coffee')) {
      return <Coffee className='w-5 h-5' />;
    }
    return <ShoppingCart className='w-5 h-5' />;
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background-dark flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <div className='min-h-screen bg-background-dark flex flex-col pb-24'>
        <div className='px-6 py-6 border-b border-gray-800'>
          <button
            onClick={() => router.back()}
            className='flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            <span>Back</span>
          </button>
          <h1 className='text-2xl font-bold text-white'>Spending Insights</h1>
          <p className='text-sm text-gray-400 mt-1'>
            Global spending analytics
          </p>
        </div>
        <div className='flex-1 flex items-center justify-center px-6'>
          <EmptyState
            icon={<PieChartIcon className='w-12 h-12 text-gray-400' />}
            title='No spending data'
            description='Start making transactions to see your spending insights here.'
          />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background-dark flex flex-col pb-24'>
      {/* Header */}
      <div className='px-6 py-6 border-b border-gray-800'>
        <button
          onClick={() => router.back()}
          className='flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors'
        >
          <ArrowLeft className='w-4 h-4' />
          <span>Back</span>
        </button>
        <h1 className='text-2xl font-bold text-white'>Spending Insights</h1>
        <p className='text-sm text-gray-400 mt-1'>Global spending analytics</p>
      </div>

      {/* Time Period Selector */}
      <div className='px-6 py-4'>
        <div className='flex items-center gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700'>
          {(['1M', '3M', '6M', 'YTD'] as TimePeriod[]).map(period => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timePeriod === period
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {period === '1M' ? 'This Month' : period}
            </button>
          ))}
        </div>
      </div>

      <div className='flex-1 px-6 py-4 space-y-6 overflow-y-auto'>
        {/* Summary Cards */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='bg-gray-800 rounded-xl p-4 border border-gray-700'>
            <p className='text-xs text-gray-400 mb-1'>Total Spend</p>
            <p className='text-2xl font-bold text-white'>
              {formatCurrency(totalSpend)}
            </p>
          </div>
          <div className='bg-gray-800 rounded-xl p-4 border border-gray-700'>
            <p className='text-xs text-gray-400 mb-1'>Average / Month</p>
            <p className='text-2xl font-bold text-white'>
              {formatCurrency(averagePerMonth)}
            </p>
          </div>
        </div>

        {/* Top Category */}
        {topCategory && (
          <div className='bg-gray-800 rounded-xl p-4 border border-gray-700'>
            <p className='text-xs text-gray-400 mb-1'>Top Category</p>
            <p className='text-xl font-bold text-white'>
              {topCategory.category}
            </p>
          </div>
        )}

        {/* Spending by Category (Donut Chart) */}
        {chartData.length > 0 && (
          <div className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
            <h2 className='text-lg font-semibold text-white mb-4'>
              Spending by Category
            </h2>
            <div className='mb-4'>
              <ResponsiveContainer width='100%' height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey='value'
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className='text-center mb-4'>
              <p className='text-xs text-gray-400 mb-1'>Total Spend</p>
              <p className='text-2xl font-bold text-white'>
                {formatCurrency(totalSpend)}
              </p>
            </div>
            <div className='space-y-2'>
              {chartData.map(item => (
                <div
                  key={item.name}
                  className='flex items-center justify-between text-sm'
                >
                  <div className='flex items-center gap-2'>
                    <div
                      className='w-3 h-3 rounded-full'
                      style={{ backgroundColor: item.color }}
                    />
                    <span className='text-gray-300'>{item.name}</span>
                  </div>
                  <span className='text-white font-medium'>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spending Trends */}
        {trends.length > 0 && (
          <div className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h2 className='text-lg font-semibold text-white'>
                  Spending Trends
                </h2>
                <p className='text-xs text-gray-400 mt-1'>Last 6 Months</p>
              </div>
              <div className='text-right'>
                <p className='text-xl font-bold text-white'>
                  {formatCurrency(trends[trends.length - 1]?.amount || 0)}
                </p>
                {trendChange !== 0 && (
                  <p
                    className={`text-sm font-medium ${
                      trendChange > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {trendChange > 0 ? '+' : ''}
                    {trendChange.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
            <ResponsiveContainer width='100%' height={200}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis
                  dataKey='month'
                  stroke='#9CA3AF'
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke='#9CA3AF' style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type='monotone'
                  dataKey='amount'
                  stroke='#13a4ec'
                  strokeWidth={2}
                  dot={{ fill: '#13a4ec', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Merchants */}
        {topMerchants.length > 0 && (
          <div className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
            <h2 className='text-lg font-semibold text-white mb-4'>
              Top Merchants
            </h2>
            <div className='space-y-3'>
              {topMerchants.map(merchant => (
                <div
                  key={merchant.merchant}
                  className='flex items-center justify-between'
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary'>
                      {getMerchantIcon(merchant.merchant)}
                    </div>
                    <div>
                      <p className='text-sm font-medium text-white'>
                        {merchant.merchant}
                      </p>
                      <p className='text-xs text-gray-400'>
                        {merchant.transactionCount} transaction
                        {merchant.transactionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <p className='text-sm font-semibold text-white'>
                    {formatCurrency(merchant.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Breakdown */}
        {categories.length > 0 && (
          <div className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
            <h2 className='text-lg font-semibold text-white mb-4'>
              Detailed Breakdown
            </h2>
            <div className='space-y-4'>
              {categories.map(cat => {
                const { icon, bgColor } = getCategoryIcon(cat.category);
                return (
                  <div key={cat.category} className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center text-white text-lg`}
                        >
                          {icon}
                        </div>
                        <span className='text-sm font-medium text-white'>
                          {cat.category}
                        </span>
                      </div>
                      <span className='text-sm font-semibold text-white'>
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                    <div className='w-full h-2 bg-gray-700 rounded-full overflow-hidden'>
                      <div
                        className={`h-full ${bgColor} rounded-full transition-all`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

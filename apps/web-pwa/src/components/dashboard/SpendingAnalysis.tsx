'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTransactionStats } from '@/hooks/useTransactions';
import { formatCurrency } from '@finmatter/shared';
import { SpendingPieChart } from '@/components/charts';
import { CategoryIcon } from '@/components/transactions/CategoryIcon';
import { SpendingChartLoader } from './SectionLoader';

interface SpendingAnalysisProps {
  className?: string;
}

// Category colors matching design
const categoryColors: Record<string, string> = {
  groceries: '#f97316', // orange
  transport: '#3b82f6', // blue
  dining: '#a855f7', // purple
  shopping: '#ec4899', // pink
  entertainment: '#10b981', // green
  travel: '#14b8a6', // teal
  food: '#f97316', // orange
  utilities: '#6366f1', // indigo
  other: '#6b7280', // gray
};

export function SpendingAnalysis({ className = '' }: SpendingAnalysisProps) {
  const router = useRouter();
  const { stats, loading, error } = useTransactionStats({
    period: 'month',
    groupBy: 'category',
  });
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return <SpendingChartLoader />;
  }

  if (error || !stats || stats.summary.totalTransactions === 0) {
    return null; // Handle empty state at dashboard level
  }

  const topCategories = showAll ? stats.breakdown : stats.breakdown.slice(0, 3);
  const totalSpent = stats.summary.totalSpent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`px-6 ${className}`}
    >
      <div className='bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden'>
        {/* Header */}
        <div className='p-6 pb-4'>
          <div className='flex items-center justify-between mb-2'>
            <h3 className='text-lg font-bold text-white'>Spending Summary</h3>
            <button
              onClick={() => router.push('/transactions')}
              className='text-primary text-sm font-medium hover:text-primary/80 transition-colors flex items-center gap-1'
            >
              View All
              <ChevronRight className='w-4 h-4' />
            </button>
          </div>
          <p className='text-sm text-gray-400'>
            {formatCurrency(totalSpent, 'INR')} spent this month
          </p>
        </div>

        {/* Chart */}
        <div className='px-6 pb-6'>
          <div className='flex items-center justify-center py-4'>
            <SpendingPieChart data={stats.breakdown} />
          </div>
        </div>

        {/* Categories List */}
        <div className='px-6 pb-6 space-y-3'>
          {topCategories.map((category, index) => {
            const color =
              categoryColors[category.category.toLowerCase()] ||
              categoryColors.other;

            return (
              <motion.button
                key={category.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() =>
                  router.push(`/transactions?category=${category.category}`)
                }
                className='w-full flex items-center gap-3 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl transition-colors group'
              >
                {/* Icon */}
                <div
                  className='w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0'
                  style={{ backgroundColor: `${color}20` }}
                >
                  <CategoryIcon category={category.category as any} size='md' />
                </div>

                {/* Category Info */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-sm font-semibold text-white capitalize'>
                      {category.category}
                    </span>
                    <span className='text-sm font-bold text-white'>
                      {formatCurrency(category.amount, 'INR')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className='w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden'>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${category.percentage}%` }}
                      transition={{
                        duration: 1,
                        delay: index * 0.1,
                        ease: 'easeOut',
                      }}
                      className='h-full rounded-full'
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>

                {/* Percentage */}
                <div className='text-xs font-medium text-gray-400 group-hover:text-primary transition-colors'>
                  {category.percentage.toFixed(1)}%
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Show More Button */}
        {!showAll && stats.breakdown.length > 3 && (
          <div className='px-6 pb-6'>
            <button
              onClick={() => setShowAll(true)}
              className='w-full py-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors'
            >
              Show {stats.breakdown.length - 3} More Categories
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

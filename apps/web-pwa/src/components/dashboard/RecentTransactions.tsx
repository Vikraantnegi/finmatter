'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@finmatter/shared';
import { CategoryIcon } from '@/components/transactions/CategoryIcon';
import { RecentTransactionsLoader } from './SectionLoader';

interface RecentTransactionsProps {
  className?: string;
}

export function RecentTransactions({
  className = '',
}: RecentTransactionsProps) {
  const router = useRouter();
  const { transactions, loading, error } = useTransactions({ limit: 5 });

  if (loading) {
    return <RecentTransactionsLoader />;
  }

  if (error || !transactions || transactions.length === 0) {
    return null; // Handle at dashboard level
  }

  const recentTransactions = transactions.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`px-6 ${className}`}
    >
      <div className='bg-gray-900/50 rounded-2xl border border-gray-800 p-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-bold text-white'>Recent Transactions</h3>
          <button
            onClick={() => router.push('/transactions')}
            className='text-primary text-sm font-medium hover:text-primary/80 transition-colors flex items-center gap-1'
          >
            View All
            <ChevronRight className='w-4 h-4' />
          </button>
        </div>

        {/* Transactions List */}
        <div className='space-y-3'>
          {recentTransactions.map((transaction, index) => {
            const isNegative = transaction.amount < 0;
            const displayAmount = Math.abs(transaction.amount);

            return (
              <motion.button
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => router.push(`/transactions/${transaction.id}`)}
                className='w-full flex items-center gap-3 p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl transition-colors group'
              >
                {/* Icon */}
                <div className='w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-700 transition-colors'>
                  <CategoryIcon
                    category={(transaction.category || 'other') as any}
                    size='md'
                  />
                </div>

                {/* Transaction Info */}
                <div className='flex-1 min-w-0 text-left'>
                  <h4 className='text-sm font-semibold text-white truncate'>
                    {transaction.description || 'Transaction'}
                  </h4>
                  <p className='text-xs text-gray-400 capitalize'>
                    {transaction.category || 'Other'}
                  </p>
                </div>

                {/* Amount */}
                <div className='text-right flex-shrink-0'>
                  <p
                    className={`text-sm font-bold ${
                      isNegative ? 'text-white' : 'text-success-400'
                    }`}
                  >
                    {isNegative ? '-' : '+'}
                    {formatCurrency(displayAmount, 'INR')}
                  </p>
                  {transaction.date && (
                    <p className='text-xs text-gray-500'>
                      {new Date(transaction.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

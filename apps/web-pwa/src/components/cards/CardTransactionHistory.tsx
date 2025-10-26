/**
 * Card Transaction History Component
 * Shows recent transactions for a specific card
 */

'use client';

import React from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionItem } from '../transactions/TransactionItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@finmatter/shared';
import { Receipt, TrendingUp, TrendingDown } from 'lucide-react';

interface CardTransactionHistoryProps {
  cardId: string;
  className?: string;
}

export function CardTransactionHistory({
  cardId,
  className = '',
}: CardTransactionHistoryProps) {
  const { transactions, loading, error } = useTransactions({
    filters: { cardId },
    limit: 5,
    groupBy: 'none',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  // Calculate spending summary
  const totalSpent = transactions.reduce(
    (sum, t) => sum + (t.type === 'debit' ? t.amount : 0),
    0,
  );
  const transactionCount = transactions.length;
  const avgTransaction =
    transactionCount > 0 ? totalSpent / transactionCount : 0;

  // Calculate category breakdown
  const categoryBreakdown = transactions.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const topCategory = Object.entries(categoryBreakdown).sort(
    ([, a], [, b]) => b - a,
  )[0];

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className='animate-pulse'>
          <div className='h-6 w-48 bg-gray-200 rounded mb-4'></div>
          <div className='space-y-3'>
            {[1, 2, 3].map(i => (
              <div key={i} className='h-16 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <EmptyState
          icon='alert-circle'
          title='Error Loading Transactions'
          description='Unable to load transaction history for this card'
        />
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div className='p-6 border-b border-gray-200'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Recent Transactions
            </h3>
            <p className='text-sm text-gray-600'>
              {transactionCount > 0
                ? `${transactionCount} transactions this month`
                : 'No transactions yet'}
            </p>
          </div>
          <Button variant='outline' size='sm'>
            View All
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {transactionCount > 0 && (
        <div className='p-6 border-b border-gray-200 bg-gray-50'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='text-center'>
              <div className='flex items-center justify-center space-x-2 mb-1'>
                <Receipt className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-600'>Total Spent</span>
              </div>
              <p className='text-xl font-semibold text-gray-900'>
                {formatCurrency(totalSpent, 'INR')}
              </p>
            </div>

            <div className='text-center'>
              <div className='flex items-center justify-center space-x-2 mb-1'>
                <TrendingUp className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-600'>Avg Transaction</span>
              </div>
              <p className='text-xl font-semibold text-gray-900'>
                {formatCurrency(avgTransaction, 'INR')}
              </p>
            </div>

            <div className='text-center'>
              <div className='flex items-center justify-center space-x-2 mb-1'>
                <TrendingDown className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-600'>Top Category</span>
              </div>
              <p className='text-xl font-semibold text-gray-900 capitalize'>
                {topCategory?.[0] || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className='p-6'>
        {transactions.length === 0 ? (
          <EmptyState
            icon='receipt'
            title='No Transactions Yet'
            description='Upload a statement or add transactions manually to see them here'
            action={{
              label: 'Upload Statement',
              onClick: () => {},
            }}
          />
        ) : (
          <div className='space-y-3'>
            {transactions.map(transaction => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                showCard={false}
                className='border border-gray-200 rounded-lg'
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

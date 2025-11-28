'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Tag, ArrowRight } from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getTransactionTypeColor,
  getTransactionTypeLabel,
} from '@finmatter/shared';
import type { Transaction } from '@finmatter/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  cardId: string;
  onViewAll?: () => void;
}

export function RecentTransactions({
  transactions,
  cardId,
  onViewAll,
}: RecentTransactionsProps) {
  const router = useRouter();

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      router.push(`/cards/${cardId}/transactions`);
    }
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className='bg-gray-800 rounded-2xl p-5 border border-gray-700/80'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-white'>
          Recent Transactions
        </h3>
        <button
          onClick={handleViewAll}
          className='flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium'
        >
          View All
          <ArrowRight className='w-4 h-4' />
        </button>
      </div>

      <div className='space-y-3'>
        {transactions.map(transaction => (
          <button
            key={transaction.id}
            onClick={() =>
              window.location.assign(`/transactions/${transaction.id}`)
            }
            className='w-full text-left bg-gray-900 rounded-xl p-3 border border-gray-700 hover:border-gray-600 transition-colors'
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1 min-w-0'>
                <h4 className='text-base font-semibold text-white mb-1 truncate'>
                  {transaction.merchant_name}
                </h4>

                <div className='flex items-center gap-3 text-sm text-gray-400 mb-1'>
                  <div className='flex items-center gap-1'>
                    <Calendar className='w-3 h-3' />
                    <span>
                      {formatDate(transaction.transaction_date, 'MMM dd, yyyy')}
                    </span>
                  </div>

                  {transaction.category && (
                    <div className='flex items-center gap-1'>
                      <Tag className='w-3 h-3' />
                      <span>{transaction.category}</span>
                    </div>
                  )}

                  <span
                    className={`text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}
                  >
                    {getTransactionTypeLabel(transaction.type)}
                  </span>
                </div>

                {transaction.description && (
                  <p className='text-xs text-gray-500 truncate'>
                    {transaction.description}
                  </p>
                )}
              </div>

              <div className='text-right ml-3 flex-shrink-0'>
                <div
                  className={`text-base font-bold ${
                    transaction.type === 'debit'
                      ? 'text-red-400'
                      : transaction.type === 'credit' ||
                          transaction.type === 'refund'
                        ? 'text-green-400'
                        : 'text-white'
                  }`}
                >
                  {transaction.type === 'debit' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </div>
                <div className='text-xs text-gray-500 mt-0.5'>
                  {transaction.currency}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

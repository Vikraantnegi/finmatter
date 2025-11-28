'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { TransactionItem } from '@/components/transactions/TransactionItem';
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
          <div
            key={transaction.id}
            className='rounded-lg border border-gray-700 hover:border-gray-600 transition-colors'
          >
            <TransactionItem
              transaction={transaction}
              variant='card'
              onClick={() => router.push(`/transactions/${transaction.id}`)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

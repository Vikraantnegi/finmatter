'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { RecentTransactionsLoader } from './SectionLoader';
import { TransactionItem } from '@/components/transactions/TransactionItem';

interface RecentTransactionsWidgetProps {
  className?: string;
}

export function RecentTransactionsWidget({
  className = '',
}: RecentTransactionsWidgetProps) {
  const router = useRouter();
  const { transactions, isLoading } = useTransactions({
    filters: { limit: 3 },
    autoFetch: true,
  });

  // Only show debit transactions (spending)
  const recentTransactions = React.useMemo(() => {
    return transactions.filter(txn => txn.type === 'debit').slice(0, 3);
  }, [transactions]);

  if (isLoading) {
    return <RecentTransactionsLoader className={className} />;
  }

  return (
    <div className={`px-6 ${className}`}>
      <div className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-white'>
            Recent Transactions
          </h3>
          <button
            onClick={() => router.push('/spending')}
            className='flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-medium transition-colors'
          >
            View All
            <ArrowRight className='w-3 h-3' />
          </button>
        </div>
        <div className='space-y-3'>
          {recentTransactions.length === 0 ? (
            <p className='text-sm text-gray-400'>No recent transactions</p>
          ) : (
            recentTransactions.map(transaction => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                variant='compact'
                onClick={() => router.push(`/transactions/${transaction.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

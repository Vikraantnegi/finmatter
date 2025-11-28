'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '@finmatter/shared';
import { useTransactions } from '@/hooks/useTransactions';
import type { Transaction } from '@finmatter/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface RecentActivityWidgetProps {
  className?: string;
}

export function RecentActivityWidget({
  className = '',
}: RecentActivityWidgetProps) {
  const router = useRouter();
  const { transactions, isLoading } = useTransactions({
    filters: { limit: 6 },
    autoFetch: true,
  });

  // Separate transactions and rewards
  const recentTransactions = React.useMemo(() => {
    return transactions.filter(txn => txn.type === 'debit').slice(0, 3);
  }, [transactions]);

  const recentRewards = React.useMemo(() => {
    // For now, we'll show credits/refunds as rewards
    // In a real app, this would come from a rewards API
    return transactions
      .filter(txn => txn.type === 'credit' || txn.type === 'refund')
      .slice(0, 3);
  }, [transactions]);

  // Get merchant icon color
  const getMerchantIconColor = (merchantName: string): string => {
    const colors = [
      'bg-orange-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-red-500',
      'bg-blue-500',
      'bg-teal-500',
      'bg-pink-500',
      'bg-yellow-500',
    ];
    const hash = merchantName.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Get merchant icon (first letter)
  const getMerchantIcon = (merchantName: string): string => {
    return merchantName.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className={`px-6 ${className}`}>
        <div className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
          <LoadingSpinner size='sm' />
        </div>
      </div>
    );
  }

  return (
    <div className={`px-6 ${className}`}>
      <div className='bg-gray-800 rounded-xl p-5 border border-gray-700'>
        <div className='grid grid-cols-2 gap-6'>
          {/* Recent Transactions */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
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
                    getMerchantIconColor={getMerchantIconColor}
                    getMerchantIcon={getMerchantIcon}
                    onClick={() =>
                      router.push(`/transactions/${transaction.id}`)
                    }
                  />
                ))
              )}
            </div>
          </div>

          {/* Recent Rewards */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-white'>
                Recent Rewards
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
              {recentRewards.length === 0 ? (
                <p className='text-sm text-gray-400'>No recent rewards</p>
              ) : (
                recentRewards.map(transaction => (
                  <RewardItem
                    key={transaction.id}
                    transaction={transaction}
                    getMerchantIconColor={getMerchantIconColor}
                    getMerchantIcon={getMerchantIcon}
                    onClick={() =>
                      router.push(`/transactions/${transaction.id}`)
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TransactionItemProps {
  transaction: Transaction;
  getMerchantIconColor: (name: string) => string;
  getMerchantIcon: (name: string) => string;
  onClick: () => void;
}

function TransactionItem({
  transaction,
  getMerchantIconColor,
  getMerchantIcon,
  onClick,
}: TransactionItemProps) {
  return (
    <button
      onClick={onClick}
      className='w-full text-left flex items-center gap-3 hover:opacity-80 transition-opacity'
    >
      <div
        className={`w-10 h-10 rounded-full ${getMerchantIconColor(
          transaction.merchant_name,
        )} flex items-center justify-center text-white font-bold flex-shrink-0`}
      >
        {getMerchantIcon(transaction.merchant_name)}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-white truncate'>
          {transaction.merchant_name}
        </p>
        <p className='text-xs text-gray-400 truncate'>
          {transaction.category || 'Uncategorized'}
        </p>
      </div>
      <div className='text-right flex-shrink-0'>
        <p className='text-sm font-semibold text-white'>
          {formatCurrency(transaction.amount)}
        </p>
      </div>
    </button>
  );
}

interface RewardItemProps {
  transaction: Transaction;
  getMerchantIconColor: (name: string) => string;
  getMerchantIcon: (name: string) => string;
  onClick: () => void;
}

function RewardItem({
  transaction,
  getMerchantIconColor,
  getMerchantIcon,
  onClick,
}: RewardItemProps) {
  // Determine reward type from category or description
  const rewardType =
    transaction.category?.toLowerCase().includes('cashback') ||
    transaction.description?.toLowerCase().includes('cashback')
      ? 'Cashback'
      : transaction.category?.toLowerCase().includes('points') ||
          transaction.description?.toLowerCase().includes('points')
        ? 'Points'
        : transaction.category?.toLowerCase().includes('miles') ||
            transaction.description?.toLowerCase().includes('miles')
          ? 'Miles'
          : 'Reward';

  return (
    <button
      onClick={onClick}
      className='w-full text-left flex items-center gap-3 hover:opacity-80 transition-opacity'
    >
      <div
        className={`w-10 h-10 rounded-full ${getMerchantIconColor(
          transaction.merchant_name,
        )} flex items-center justify-center text-white font-bold flex-shrink-0`}
      >
        {getMerchantIcon(transaction.merchant_name)}
      </div>
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-medium text-white truncate'>
          {transaction.merchant_name}
        </p>
        <p className='text-xs text-gray-400 truncate'>{rewardType}</p>
      </div>
      <div className='text-right flex-shrink-0'>
        <p className='text-sm font-semibold text-green-400'>
          +{formatCurrency(transaction.amount)}
        </p>
      </div>
    </button>
  );
}

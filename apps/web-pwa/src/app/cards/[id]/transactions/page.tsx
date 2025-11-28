'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Tag, CreditCard } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCardTransactions } from '@/hooks/useCardTransactions';
import {
  groupTransactionsByMonth,
  sortGroupedTransactionsByMonth,
  getTransactionTypeColor,
  getTransactionTypeLabel,
  formatCurrency,
  formatDate,
} from '@finmatter/shared';
import type { Card } from '@finmatter/types';

export default function CardTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;

  const [card, setCard] = useState<Card | null>(null);

  const { transactions, isLoading } = useCardTransactions({
    cardId,
    autoFetch: true,
  });

  useEffect(() => {
    const fetchCard = async () => {
      try {
        const response = await apiClient.get<{
          success: boolean;
          card: Card;
        }>(`/api/cards/${cardId}`);

        if (response.success && response.card) {
          setCard(response.card);
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching card:', errorMessage);
      }
    };

    if (cardId) {
      fetchCard();
    }
  }, [cardId]);

  // Group transactions by month using shared utility
  const groupedTransactions = groupTransactionsByMonth(transactions);

  // Sort months (newest first) using shared utility
  const sortedMonths = sortGroupedTransactionsByMonth(groupedTransactions);

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background-dark flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  const cardTitle =
    card?.cardMetadata?.displayName ||
    card?.cardName ||
    card?.bank?.displayName ||
    `Card •••• ${card?.lastFourDigits || ''}`;

  return (
    <div className='min-h-screen bg-background-dark flex flex-col pb-24'>
      {/* Header */}
      <div className='px-6 py-6 border-b border-gray-800'>
        <button
          onClick={() => router.push(`/cards/${cardId}`)}
          className='flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors'
        >
          <ArrowLeft className='w-4 h-4' />
          <span>Back to Card</span>
        </button>
        <h1 className='text-2xl font-bold text-white'>{cardTitle}</h1>
        <p className='text-sm text-gray-400 mt-1'>
          {transactions.length} transaction
          {transactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className='flex-1 flex items-center justify-center px-6'>
          <EmptyState
            icon={<CreditCard className='w-12 h-12 text-gray-400' />}
            title='No transactions found'
            description='This card does not have any transactions yet'
          />
        </div>
      ) : (
        <div className='flex-1 px-6 py-4 space-y-6'>
          {sortedMonths.map(monthKey => {
            const monthData = groupedTransactions[monthKey];
            return (
              <div key={monthKey} className='space-y-3'>
                {/* Month Header */}
                <div className='sticky top-0 bg-background-dark/95 backdrop-blur-sm z-10 pb-2'>
                  <div className='flex items-center justify-between mb-2'>
                    <h2 className='text-lg font-bold text-white'>{monthKey}</h2>
                    <div className='text-right'>
                      <div className='text-sm text-gray-400'>
                        {monthData.transactions.length} transaction
                        {monthData.transactions.length !== 1 ? 's' : ''}
                      </div>
                      <div className='text-xs text-gray-500 mt-1'>
                        Net: {formatCurrency(monthData.netSpending)}
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-4 text-xs text-gray-500'>
                    <span>Debits: {formatCurrency(monthData.totalDebits)}</span>
                    <span>
                      Credits: {formatCurrency(monthData.totalCredits)}
                    </span>
                  </div>
                </div>

                {/* Transactions for this month */}
                <div className='space-y-3'>
                  {monthData.transactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className='bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors'
                    >
                      <div className='flex items-start justify-between mb-2'>
                        <div className='flex-1'>
                          <h3 className='text-base font-semibold text-white mb-1'>
                            {transaction.merchant_name}
                          </h3>

                          <div className='flex items-center gap-3 text-sm text-gray-400 mb-2'>
                            <div className='flex items-center gap-1'>
                              <Calendar className='w-3 h-3' />
                              <span>
                                {formatDate(
                                  transaction.transaction_date,
                                  'MMM dd, yyyy',
                                )}
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
                            <p className='text-xs text-gray-500 mb-2'>
                              {transaction.description}
                            </p>
                          )}
                        </div>

                        <div className='text-right'>
                          <div
                            className={`text-lg font-bold ${
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
                          <div className='text-xs text-gray-500 mt-1'>
                            {transaction.currency}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

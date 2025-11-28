'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { TransactionSearchBar } from '@/components/transactions/TransactionSearchBar';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { useCardTransactions } from '@/hooks/useCardTransactions';
import {
  groupTransactionsByDate,
  sortGroupedTransactionsByDate,
  formatCurrency,
  formatDate,
  filterTransactionsBySearch,
  filterTransactionsByDate,
  sortTransactions,
} from '@finmatter/shared';
import type { Card } from '@finmatter/types';
import { TransactionDateFilter, TransactionSortBy } from '@finmatter/types';

export default function CardTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;

  const [_card, setCard] = useState<Card | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(
    TransactionDateFilter.LAST_30_DAYS,
  );
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState(TransactionSortBy.DATE_DESC);

  const { transactions: allTransactions, isLoading } = useCardTransactions({
    cardId,
    autoFetch: true,
  });

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    allTransactions.forEach(txn => {
      if (txn.category) {
        uniqueCategories.add(txn.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [allTransactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...allTransactions];

    // Apply date filter
    filtered = filterTransactionsByDate(filtered, dateFilter);

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(txn => txn.category === categoryFilter);
    }

    // Apply search
    filtered = filterTransactionsBySearch(filtered, searchQuery);

    // Apply sort
    filtered = sortTransactions(filtered, sortBy);

    return filtered;
  }, [allTransactions, dateFilter, categoryFilter, searchQuery, sortBy]);

  // Group transactions by date
  const groupedTransactions = useMemo(
    () => groupTransactionsByDate(filteredTransactions),
    [filteredTransactions],
  );

  // Sort date groups
  const sortedDateKeys = useMemo(
    () => sortGroupedTransactionsByDate(groupedTransactions),
    [groupedTransactions],
  );

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

  // Format time for display
  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  // Format date for display (for non-Today/Yesterday dates)
  const formatDateDisplay = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDate(date, 'MMM dd');
    } catch {
      return '';
    }
  };

  // Get merchant icon color (simple hash-based color)
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
      <div className='min-h-screen bg-background-dark flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background-dark flex flex-col pb-24'>
      {/* Header */}
      <div className='px-6 py-4 border-b border-gray-800'>
        <div className='flex items-center justify-between mb-4'>
          <button
            onClick={() => router.push(`/cards/${cardId}`)}
            className='text-gray-400 hover:text-white transition-colors'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          <h1 className='text-xl font-bold text-white'>Transactions</h1>
          <button className='text-gray-400 hover:text-white transition-colors'>
            <MoreVertical className='w-5 h-5' />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className='px-6 py-4'>
        <TransactionSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder='Search by merchant, category...'
        />
      </div>

      {/* Filters */}
      <div className='px-6 pb-4'>
        <TransactionFilters
          dateFilter={dateFilter}
          onDateFilterChange={value =>
            setDateFilter(value as TransactionDateFilter)
          }
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          sortBy={sortBy}
          onSortByChange={value => setSortBy(value as TransactionSortBy)}
          categories={categories}
        />
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className='flex-1 flex items-center justify-center px-6'>
          <EmptyState
            icon={<ArrowLeft className='w-12 h-12 text-gray-400' />}
            title='No transactions found'
            description={
              searchQuery || categoryFilter || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'This card does not have any transactions yet'
            }
          />
        </div>
      ) : (
        <div className='flex-1 px-6 py-4 space-y-6'>
          {sortedDateKeys.map(dateKey => {
            const dateData = groupedTransactions[dateKey];
            return (
              <div key={dateKey} className='space-y-3'>
                {/* Date Header */}
                <div className='sticky top-0 bg-background-dark/95 backdrop-blur-sm z-10 pb-2'>
                  <h2 className='text-lg font-bold text-white'>{dateKey}</h2>
                </div>

                {/* Transactions for this date */}
                <div className='space-y-3'>
                  {dateData.transactions.map(transaction => (
                    <button
                      key={transaction.id}
                      onClick={() =>
                        router.push(`/transactions/${transaction.id}`)
                      }
                      className='w-full text-left bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors'
                    >
                      <div className='flex items-start gap-3'>
                        {/* Merchant Icon */}
                        <div
                          className={`w-12 h-12 rounded-full ${getMerchantIconColor(
                            transaction.merchant_name,
                          )} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                        >
                          {getMerchantIcon(transaction.merchant_name)}
                        </div>

                        {/* Transaction Details */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between mb-1'>
                            <div className='flex-1 min-w-0'>
                              <h3 className='text-base font-semibold text-white mb-1 truncate'>
                                {transaction.merchant_name}
                              </h3>
                              <div className='flex items-center gap-3 text-sm text-gray-400'>
                                <span>
                                  {transaction.category || 'Uncategorized'}
                                </span>
                                {dateKey === 'Today' && (
                                  <span>
                                    {formatTime(transaction.transaction_date)}
                                  </span>
                                )}
                                {dateKey !== 'Today' && (
                                  <span>
                                    {formatDateDisplay(
                                      transaction.transaction_date,
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Amount */}
                            <div className='text-right flex-shrink-0 ml-2'>
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
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
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

'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { TransactionsListLoader } from '@/components/dashboard/SectionLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { TransactionSearchBar } from '@/components/transactions/TransactionSearchBar';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { useCardTransactions } from '@/hooks/useCardTransactions';
import {
  groupTransactionsByDate,
  sortGroupedTransactionsByDate,
  filterTransactionsBySearch,
  filterTransactionsByDate,
  sortTransactions,
} from '@finmatter/shared';
import { TransactionItem } from '@/components/transactions/TransactionItem';
// Types imported for TypeScript only - using string literals for runtime
import type {
  TransactionDateFilter,
  TransactionSortBy,
} from '@finmatter/types';

export default function CardTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<TransactionDateFilter | string>(
    '30', // TransactionDateFilter.LAST_30_DAYS
  );
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<TransactionSortBy | string>(
    'date_desc', // TransactionSortBy.DATE_DESC
  );

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

  if (isLoading) {
    return <TransactionsListLoader />;
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
      <div className='px-6 pb-4 overflow-visible'>
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
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      variant='detailed'
                      showDate={dateKey !== 'Today'}
                      showTime={dateKey === 'Today'}
                      onClick={() =>
                        router.push(`/transactions/${transaction.id}`)
                      }
                    />
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

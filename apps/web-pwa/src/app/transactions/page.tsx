/**
 * Transactions Page
 * Main page for viewing and managing transactions
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TransactionList } from '@/components/transactions/TransactionList';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTransactions } from '@/hooks/useTransactions';
import { useCards } from '@/hooks/useCards';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { Transaction } from '@finmatter/types';

export default function TransactionsPage() {
  const router = useRouter();
  const [groupBy, setGroupBy] = useState<'date' | 'category' | 'card' | 'none'>(
    'date',
  );
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'merchant'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { transactions, loading, error, mutate, pagination } = useTransactions({
    groupBy,
    sortBy,
    sortOrder,
    page,
    limit: 20,
  });

  const { cards } = useCards();

  const handleTransactionClick = (transaction: Transaction) => {
    router.push(`/transactions/${transaction.id}`);
  };

  const handleRefresh = () => {
    mutate();
  };

  const handleAddTransaction = () => {
    router.push('/transactions/add');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export transactions');
  };

  const handleSearch = () => {
    router.push('/transactions/search');
  };

  if (loading && transactions.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>Transactions</h1>
              <p className='text-sm text-gray-600'>
                View and manage your credit card transactions
              </p>
            </div>

            <div className='flex items-center space-x-3'>
              <Button
                variant='outline'
                onClick={handleSearch}
                className='flex items-center space-x-2'
              >
                <Search className='w-4 h-4' />
                <span>Search</span>
              </Button>

              <Button
                variant='outline'
                onClick={handleExport}
                className='flex items-center space-x-2'
              >
                <Download className='w-4 h-4' />
                <span>Export</span>
              </Button>

              <Button
                onClick={handleAddTransaction}
                className='flex items-center space-x-2'
              >
                <Plus className='w-4 h-4' />
                <span>Add Transaction</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between py-4'>
            <div className='flex items-center space-x-4'>
              {/* Group By */}
              <div className='flex items-center space-x-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Group by:
                </label>
                <select
                  value={groupBy}
                  onChange={e => setGroupBy(e.target.value as any)}
                  className='border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='date'>Date</option>
                  <option value='category'>Category</option>
                  <option value='card'>Card</option>
                  <option value='none'>None</option>
                </select>
              </div>

              {/* Sort By */}
              <div className='flex items-center space-x-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className='border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='date'>Date</option>
                  <option value='amount'>Amount</option>
                  <option value='merchant'>Merchant</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className='flex items-center space-x-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Order:
                </label>
                <select
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value as any)}
                  className='border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='desc'>Descending</option>
                  <option value='asc'>Ascending</option>
                </select>
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                onClick={() => setShowFilters(!showFilters)}
                className='flex items-center space-x-2'
              >
                <Filter className='w-4 h-4' />
                <span>Filters</span>
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className='pb-4 border-t border-gray-200 pt-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Card
                  </label>
                  <select className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'>
                    <option value=''>All Cards</option>
                    {cards.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.cardName} (****{card.lastFourDigits})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Category
                  </label>
                  <select className='w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'>
                    <option value=''>All Categories</option>
                    <option value='dining'>Dining</option>
                    <option value='shopping'>Shopping</option>
                    <option value='groceries'>Groceries</option>
                    <option value='fuel'>Fuel</option>
                    <option value='travel'>Travel</option>
                    <option value='entertainment'>Entertainment</option>
                    <option value='bills'>Bills</option>
                    <option value='healthcare'>Healthcare</option>
                    <option value='education'>Education</option>
                    <option value='transport'>Transport</option>
                    <option value='utilities'>Utilities</option>
                    <option value='insurance'>Insurance</option>
                    <option value='investment'>Investment</option>
                    <option value='others'>Others</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Amount Range
                  </label>
                  <div className='flex space-x-2'>
                    <input
                      type='number'
                      placeholder='Min'
                      className='flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <input
                      type='number'
                      placeholder='Max'
                      className='flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <TransactionList
          transactions={transactions}
          loading={loading}
          error={error || undefined}
          onTransactionClick={handleTransactionClick}
          onRefresh={handleRefresh}
          showCard={true}
          groupBy={groupBy}
        />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className='flex items-center justify-between mt-6'>
            <div className='text-sm text-gray-700'>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
              of {pagination.total} transactions
            </div>

            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPrev}
                className='px-3 py-1'
              >
                Previous
              </Button>

              <span className='text-sm text-gray-700'>
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <Button
                variant='outline'
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNext}
                className='px-3 py-1'
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

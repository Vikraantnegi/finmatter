/**
 * Transaction List Component
 * Displays list of transactions with grouping and filtering
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Transaction } from '@finmatter/types';
import { TransactionItem } from './TransactionItem';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ChevronDown, ChevronUp, Filter, RefreshCw } from 'lucide-react';
import { formatDate } from '@finmatter/shared';

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  error?: string;
  onTransactionClick?: (transaction: Transaction) => void;
  onRefresh?: () => void;
  showCard?: boolean;
  groupBy?: 'date' | 'category' | 'card' | 'none';
  className?: string;
}

interface GroupedTransactions {
  [key: string]: Transaction[];
}

export function TransactionList({
  transactions,
  loading = false,
  error,
  onTransactionClick,
  onRefresh,
  showCard = false,
  groupBy = 'date',
  className = '',
}: TransactionListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Group transactions based on groupBy parameter
  const groupedTransactions = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Transactions': transactions };
    }

    const groups: GroupedTransactions = {};

    transactions.forEach(transaction => {
      let groupKey: string;

      switch (groupBy) {
        case 'date': {
          const date = new Date(transaction.date);
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          if (date.toDateString() === today.toDateString()) {
            groupKey = 'Today';
          } else if (date.toDateString() === yesterday.toDateString()) {
            groupKey = 'Yesterday';
          } else if (
            date.getTime() >
            today.getTime() - 7 * 24 * 60 * 60 * 1000
          ) {
            groupKey = 'This Week';
          } else if (
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
          ) {
            groupKey = 'This Month';
          } else {
            groupKey = formatDate(date, 'MMMM yyyy');
          }
          break;
        }

        case 'category':
          groupKey =
            transaction.category.charAt(0).toUpperCase() +
            transaction.category.slice(1);
          break;

        case 'card':
          groupKey = transaction.cardId
            ? `Card ending ${transaction.cardId.slice(-4)}`
            : 'Unknown Card';
          break;

        default:
          groupKey = 'All Transactions';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(transaction);
    });

    return groups;
  }, [transactions, groupBy]);

  // Calculate group totals
  const groupTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    Object.entries(groupedTransactions).forEach(
      ([groupKey, groupTransactions]) => {
        totals[groupKey] = groupTransactions.reduce((sum, t) => {
          return sum + (t.type === 'debit' ? t.amount : -t.amount);
        }, 0);
      },
    );

    return totals;
  }, [groupedTransactions]);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAllGroups = () => {
    setExpandedGroups(new Set(Object.keys(groupedTransactions)));
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`py-12 ${className}`}>
        <EmptyState
          icon='alert-circle'
          title='Error Loading Transactions'
          description={error}
          action={
            onRefresh
              ? {
                  label: 'Try Again',
                  onClick: onRefresh,
                  icon: <RefreshCw className='w-4 h-4' />,
                }
              : undefined
          }
        />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={`py-12 ${className}`}>
        <EmptyState
          icon='receipt'
          title='No Transactions Found'
          description="You don't have any transactions yet. Upload a statement or add a transaction manually."
          action={
            onRefresh
              ? {
                  label: 'Refresh',
                  onClick: onRefresh,
                  icon: <RefreshCw className='w-4 h-4' />,
                }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-200'>
        <div className='flex items-center space-x-4'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Transactions ({transactions.length})
          </h2>

          {groupBy !== 'none' &&
            Object.keys(groupedTransactions).length > 1 && (
              <div className='flex items-center space-x-2'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={expandAllGroups}
                  className='text-xs'
                >
                  Expand All
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={collapseAllGroups}
                  className='text-xs'
                >
                  Collapse All
                </Button>
              </div>
            )}
        </div>

        <div className='flex items-center space-x-2'>
          {onRefresh && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onRefresh}
              className='text-gray-500 hover:text-gray-700'
            >
              <RefreshCw className='w-4 h-4' />
            </Button>
          )}

          <Button
            variant='ghost'
            size='sm'
            onClick={() => setShowFilters(!showFilters)}
            className='text-gray-500 hover:text-gray-700'
          >
            <Filter className='w-4 h-4' />
          </Button>
        </div>
      </div>

      {/* Filters (placeholder for now) */}
      {showFilters && (
        <div className='p-4 border-b border-gray-200 bg-gray-50'>
          <p className='text-sm text-gray-600'>
            Advanced filters will be implemented in the next phase.
          </p>
        </div>
      )}

      {/* Transaction Groups */}
      <div className='divide-y divide-gray-100'>
        {Object.entries(groupedTransactions).map(
          ([groupKey, groupTransactions]) => {
            const isExpanded = expandedGroups.has(groupKey);
            const groupTotal = groupTotals[groupKey];
            const isDebitTotal = groupTotal > 0;
            const totalColor = isDebitTotal ? 'text-red-600' : 'text-green-600';

            return (
              <div key={groupKey}>
                {/* Group Header */}
                {groupBy !== 'none' && (
                  <div
                    className='flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors'
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <div className='flex items-center space-x-3'>
                      {isExpanded ? (
                        <ChevronUp className='w-4 h-4 text-gray-500' />
                      ) : (
                        <ChevronDown className='w-4 h-4 text-gray-500' />
                      )}
                      <h3 className='font-medium text-gray-900'>{groupKey}</h3>
                      <span className='text-sm text-gray-500'>
                        ({groupTransactions.length} transactions)
                      </span>
                    </div>

                    <div className={`font-semibold ${totalColor}`}>
                      {isDebitTotal ? '-' : '+'}₹
                      {Math.abs(groupTotal).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Group Transactions */}
                {isExpanded && (
                  <div className='divide-y divide-gray-100'>
                    {groupTransactions.map(transaction => (
                      <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
                        showCard={showCard}
                        onClick={() => onTransactionClick?.(transaction)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}

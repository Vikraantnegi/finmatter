/**
 * Transaction Item Component
 * Displays individual transaction with category, amount, and merchant info
 */

'use client';

import React from 'react';
import { Transaction } from '@finmatter/types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency, formatDate } from '@finmatter/shared';
import { ChevronRight, CreditCard } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  showCard?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TransactionItem({
  transaction,
  showCard = false,
  onClick,
  className = '',
}: TransactionItemProps) {
  const isDebit = transaction.type === 'debit';
  const amountColor = isDebit ? 'text-red-600' : 'text-green-600';
  const amountPrefix = isDebit ? '-' : '+';

  return (
    <div
      className={`flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className='flex items-center space-x-3 flex-1 min-w-0'>
        {/* Category Icon */}
        <CategoryIcon category={transaction.category} size='md' />

        {/* Transaction Details */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center space-x-2'>
            <h3 className='font-medium text-gray-900 truncate'>
              {transaction.merchantName}
            </h3>
            {transaction.location && (
              <span className='text-xs text-gray-500'>
                {transaction.location.city || transaction.location.state}
              </span>
            )}
          </div>

          <div className='flex items-center space-x-2 mt-1'>
            <span className='text-sm text-gray-600 capitalize'>
              {transaction.category}
            </span>
            {transaction.subcategory && (
              <>
                <span className='text-gray-400'>•</span>
                <span className='text-sm text-gray-500'>
                  {transaction.subcategory}
                </span>
              </>
            )}
            {showCard && transaction.cardId && (
              <>
                <span className='text-gray-400'>•</span>
                <div className='flex items-center space-x-1'>
                  <CreditCard className='w-3 h-3 text-gray-400' />
                  <span className='text-sm text-gray-500'>
                    Card ending {transaction.cardId.slice(-4)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className='flex items-center space-x-2 mt-1'>
            <span className='text-xs text-gray-500'>
              {formatDate(transaction.date)}
            </span>
            {transaction.reference && (
              <>
                <span className='text-gray-400'>•</span>
                <span className='text-xs text-gray-500'>
                  Ref: {transaction.reference}
                </span>
              </>
            )}
          </div>

          {/* Tags */}
          {transaction.tags && transaction.tags.length > 0 && (
            <div className='flex flex-wrap gap-1 mt-2'>
              {transaction.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className='inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800'
                >
                  {tag}
                </span>
              ))}
              {transaction.tags.length > 3 && (
                <span className='text-xs text-gray-500'>
                  +{transaction.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Amount and Action */}
      <div className='flex items-center space-x-3'>
        <div className='text-right'>
          <div className={`font-semibold ${amountColor}`}>
            {amountPrefix}
            {formatCurrency(transaction.amount, transaction.currency)}
          </div>
          {transaction.rewardPoints && transaction.rewardPoints > 0 && (
            <div className='text-xs text-green-600'>
              +{transaction.rewardPoints} pts
            </div>
          )}
        </div>

        {onClick && <ChevronRight className='w-5 h-5 text-gray-400' />}
      </div>
    </div>
  );
}

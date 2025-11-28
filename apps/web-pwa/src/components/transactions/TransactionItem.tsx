'use client';

import React from 'react';
import {
  formatCurrency,
  formatDate,
  getTransactionTypeColor,
  getTransactionTypeLabel,
} from '@finmatter/shared';
import type { Transaction } from '@finmatter/types';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
  variant?: 'compact' | 'default' | 'detailed' | 'card';
  showDate?: boolean;
  showTime?: boolean;
}

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

export function TransactionItem({
  transaction,
  onClick,
  variant = 'default',
  showDate = false,
  showTime = false,
}: TransactionItemProps) {
  const iconColor = getMerchantIconColor(transaction.merchant_name);
  const icon = getMerchantIcon(transaction.merchant_name);
  const amountColor =
    transaction.type === 'debit'
      ? 'text-red-400'
      : transaction.type === 'credit' || transaction.type === 'refund'
        ? 'text-green-400'
        : 'text-white';

  const amountPrefix = transaction.type === 'debit' ? '-' : '+';

  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className='w-full text-left flex items-center gap-3 hover:opacity-80 transition-opacity'
      >
        <div
          className={`w-10 h-10 rounded-full ${iconColor} flex items-center justify-center text-white font-bold flex-shrink-0`}
        >
          {icon}
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
          <p className={`text-sm font-semibold ${amountColor}`}>
            {amountPrefix}
            {formatCurrency(transaction.amount)}
          </p>
        </div>
      </button>
    );
  }

  if (variant === 'detailed') {
    return (
      <button
        onClick={onClick}
        className='w-full text-left bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors'
      >
        <div className='flex items-start gap-3'>
          {/* Merchant Icon */}
          <div
            className={`w-12 h-12 rounded-full ${iconColor} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
          >
            {icon}
          </div>

          {/* Transaction Details */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between gap-2 mb-1'>
              <div className='flex-1 min-w-0'>
                <p className='text-base font-semibold text-white truncate'>
                  {transaction.merchant_name}
                </p>
                {transaction.description && (
                  <p className='text-xs text-gray-400 truncate mt-0.5'>
                    {transaction.description}
                  </p>
                )}
              </div>
              <div className='text-right flex-shrink-0'>
                <p className={`text-lg font-bold ${amountColor}`}>
                  {amountPrefix}
                  {formatCurrency(transaction.amount)}
                </p>
                <p className='text-xs text-gray-500 mt-0.5'>
                  {transaction.currency}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-3 mt-2 text-xs text-gray-400'>
              {transaction.category && (
                <span className='px-2 py-0.5 bg-gray-700/50 rounded'>
                  {transaction.category}
                </span>
              )}
              {(showDate || showTime) && (
                <span>
                  {showDate && showTime
                    ? new Date(transaction.transaction_date).toLocaleString()
                    : showDate
                      ? new Date(
                          transaction.transaction_date,
                        ).toLocaleDateString()
                      : new Date(
                          transaction.transaction_date,
                        ).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    );
  }

  if (variant === 'card') {
    // Card variant - matches old RecentTransactions design (no icon, date/category/type in row)
    const dateStr = formatDate(
      new Date(transaction.transaction_date),
      'MMM dd, yyyy',
    );

    return (
      <button onClick={onClick} className='w-full text-left p-3'>
        <div className='flex items-start justify-between'>
          <div className='flex-1 min-w-0'>
            <h4 className='text-base font-semibold text-white mb-1 truncate'>
              {transaction.merchant_name}
            </h4>

            <div className='flex items-center gap-3 text-sm text-gray-400 mb-1'>
              <div className='flex items-center gap-1'>
                <span>{dateStr}</span>
              </div>

              {transaction.category && (
                <div className='flex items-center gap-1'>
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
            <div className={`text-base font-bold ${amountColor}`}>
              {amountPrefix}
              {formatCurrency(transaction.amount)}
            </div>
            <div className='text-xs text-gray-500 mt-0.5'>
              {transaction.currency}
            </div>
          </div>
        </div>
      </button>
    );
  }

  // Default variant
  return (
    <button
      onClick={onClick}
      className='w-full text-left flex items-center gap-3 hover:opacity-80 transition-opacity'
    >
      <div
        className={`w-10 h-10 rounded-full ${iconColor} flex items-center justify-center text-white font-bold flex-shrink-0`}
      >
        {icon}
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
        <p className={`text-sm font-semibold ${amountColor}`}>
          {amountPrefix}
          {formatCurrency(transaction.amount)}
        </p>
      </div>
    </button>
  );
}

/**
 * Transaction utilities for FinMatter
 */

import { format, parseISO } from 'date-fns';
import type {
  Transaction,
  GroupedTransactions,
  TransactionType,
} from '@finmatter/types';

/**
 * Group transactions by month
 */
export const groupTransactionsByMonth = (
  transactions: Transaction[],
): GroupedTransactions => {
  return transactions.reduce((acc, txn) => {
    const date = parseISO(txn.transaction_date);
    const monthKey = format(date, 'MMMM yyyy');

    if (!acc[monthKey]) {
      acc[monthKey] = {
        transactions: [],
        totalDebits: 0,
        totalCredits: 0,
        netSpending: 0,
      };
    }

    acc[monthKey].transactions.push(txn);

    if (txn.type === 'debit') {
      acc[monthKey].totalDebits += txn.amount;
    } else {
      acc[monthKey].totalCredits += txn.amount;
    }

    acc[monthKey].netSpending =
      acc[monthKey].totalDebits - acc[monthKey].totalCredits;

    return acc;
  }, {} as GroupedTransactions);
};

/**
 * Sort grouped transactions by month (newest first)
 */
export const sortGroupedTransactionsByMonth = (
  grouped: GroupedTransactions,
): string[] => {
  return Object.keys(grouped).sort((a, b) => {
    const monthA = grouped[a];
    const monthB = grouped[b];
    const dateA = parseISO(monthA?.transactions[0]?.transaction_date || '');
    const dateB = parseISO(monthB?.transactions[0]?.transaction_date || '');
    return dateB.getTime() - dateA.getTime();
  });
};

/**
 * Get transaction type color class
 */
export const getTransactionTypeColor = (type: TransactionType): string => {
  switch (type) {
    case 'debit':
      return 'text-red-400';
    case 'credit':
      return 'text-green-400';
    case 'refund':
      return 'text-blue-400';
    default:
      return 'text-gray-400';
  }
};

/**
 * Get transaction type label
 */
export const getTransactionTypeLabel = (type: TransactionType): string => {
  switch (type) {
    case 'debit':
      return 'Debit';
    case 'credit':
      return 'Credit';
    case 'refund':
      return 'Refund';
    default:
      return type;
  }
};

/**
 * Get transaction amount display (with +/- prefix)
 */
export const getTransactionAmountDisplay = (
  amount: number,
  type: TransactionType,
): string => {
  const prefix = type === 'debit' ? '-' : '+';
  return `${prefix}${amount.toFixed(2)}`;
};

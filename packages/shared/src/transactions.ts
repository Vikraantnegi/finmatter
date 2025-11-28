/**
 * Transaction utilities for FinMatter
 */

import {
  format,
  parseISO,
  isToday,
  isYesterday,
  differenceInDays,
} from 'date-fns';
import type {
  Transaction,
  GroupedTransactions,
  TransactionType,
} from '@finmatter/types';
import {
  TransactionDateFilter,
  TransactionSortBy,
  TransactionDateGroup,
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
 * Group transactions by date (Today, Yesterday, or specific date)
 */
export interface DateGroupedTransactions {
  [dateKey: string]: {
    transactions: Transaction[];
    totalDebits: number;
    totalCredits: number;
    netSpending: number;
    date: Date;
  };
}

export const groupTransactionsByDate = (
  transactions: Transaction[],
): DateGroupedTransactions => {
  return transactions.reduce((acc, txn) => {
    const date = parseISO(txn.transaction_date);
    let dateKey: string;

    if (isToday(date)) {
      dateKey = TransactionDateGroup.TODAY;
    } else if (isYesterday(date)) {
      dateKey = TransactionDateGroup.YESTERDAY;
    } else {
      dateKey = format(date, 'MMM dd, yyyy');
    }

    if (!acc[dateKey]) {
      acc[dateKey] = {
        transactions: [],
        totalDebits: 0,
        totalCredits: 0,
        netSpending: 0,
        date,
      };
    }

    const dateGroup = acc[dateKey]!; // Non-null assertion: we just created it above
    dateGroup.transactions.push(txn);

    if (txn.type === 'debit') {
      dateGroup.totalDebits += txn.amount;
    } else {
      dateGroup.totalCredits += txn.amount;
    }

    dateGroup.netSpending = dateGroup.totalDebits - dateGroup.totalCredits;

    return acc;
  }, {} as DateGroupedTransactions);
};

/**
 * Sort grouped transactions by date (newest first)
 */
export const sortGroupedTransactionsByDate = (
  grouped: DateGroupedTransactions,
): string[] => {
  const order = [TransactionDateGroup.TODAY, TransactionDateGroup.YESTERDAY];
  return Object.keys(grouped).sort((a, b) => {
    // Today and Yesterday always come first
    const aIndex = order.indexOf(a as TransactionDateGroup);
    const bIndex = order.indexOf(b as TransactionDateGroup);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    // Then sort by actual date
    const groupA = grouped[a];
    const groupB = grouped[b];
    if (!groupA || !groupB) return 0;
    return groupB.date.getTime() - groupA.date.getTime();
  });
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

/**
 * Filter transactions by search query
 */
export const filterTransactionsBySearch = (
  transactions: Transaction[],
  query: string,
): Transaction[] => {
  if (!query.trim()) return transactions;

  const lowerQuery = query.toLowerCase();
  return transactions.filter(txn => {
    return (
      txn.merchant_name.toLowerCase().includes(lowerQuery) ||
      txn.category?.toLowerCase().includes(lowerQuery) ||
      txn.merchant_category?.toLowerCase().includes(lowerQuery) ||
      txn.description?.toLowerCase().includes(lowerQuery) ||
      txn.notes?.toLowerCase().includes(lowerQuery)
    );
  });
};

/**
 * Sort transactions
 */
export const sortTransactions = (
  transactions: Transaction[],
  sortBy: TransactionSortBy | string,
): Transaction[] => {
  const sorted = [...transactions];

  switch (sortBy) {
    case TransactionSortBy.DATE_DESC:
      return sorted.sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() -
          new Date(a.transaction_date).getTime(),
      );
    case TransactionSortBy.DATE_ASC:
      return sorted.sort(
        (a, b) =>
          new Date(a.transaction_date).getTime() -
          new Date(b.transaction_date).getTime(),
      );
    case TransactionSortBy.AMOUNT_DESC:
      return sorted.sort((a, b) => b.amount - a.amount);
    case TransactionSortBy.AMOUNT_ASC:
      return sorted.sort((a, b) => a.amount - b.amount);
    default:
      return sorted;
  }
};

/**
 * Filter transactions by date range
 */
export const filterTransactionsByDate = (
  transactions: Transaction[],
  dateFilter: TransactionDateFilter | string,
): Transaction[] => {
  if (dateFilter === TransactionDateFilter.ALL_TIME) return transactions;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return transactions.filter(txn => {
    const txnDate = parseISO(txn.transaction_date);
    const txnDateOnly = new Date(
      txnDate.getFullYear(),
      txnDate.getMonth(),
      txnDate.getDate(),
    );

    switch (dateFilter) {
      case TransactionDateFilter.LAST_7_DAYS:
        return differenceInDays(today, txnDateOnly) <= 7;
      case TransactionDateFilter.LAST_30_DAYS:
        return differenceInDays(today, txnDateOnly) <= 30;
      case TransactionDateFilter.THIS_MONTH:
        return (
          txnDate.getMonth() === now.getMonth() &&
          txnDate.getFullYear() === now.getFullYear()
        );
      case TransactionDateFilter.LAST_MONTH: {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        return (
          txnDate.getMonth() === lastMonth.getMonth() &&
          txnDate.getFullYear() === lastMonth.getFullYear()
        );
      }
      case TransactionDateFilter.THIS_YEAR:
        return txnDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });
};

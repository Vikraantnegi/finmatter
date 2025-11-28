/**
 * Analytics utilities for FinMatter
 */

import {
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  subMonths,
  format,
  eachMonthOfInterval,
} from 'date-fns';
import type { Transaction } from '@finmatter/types';

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlySpending {
  totalSpend: number;
  totalRewards: number;
  transactionCount: number;
}

/**
 * Calculate this month's spending and rewards
 */
export const calculateMonthlySpending = (
  transactions: Transaction[],
): MonthlySpending => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  let totalSpend = 0;
  let totalRewards = 0;
  let transactionCount = 0;

  transactions.forEach(txn => {
    const txnDate = parseISO(txn.transaction_date);
    if (isWithinInterval(txnDate, { start: monthStart, end: monthEnd })) {
      if (txn.type === 'debit') {
        totalSpend += txn.amount;
        transactionCount++;
      } else if (txn.type === 'credit' || txn.type === 'refund') {
        // Calculate rewards (simplified - in real app, this would come from rewards API)
        // For now, we'll estimate rewards as a percentage of spending
        totalRewards += txn.amount * 0.01; // 1% cashback estimate
      }
    }
  });

  return {
    totalSpend,
    totalRewards,
    transactionCount,
  };
};

/**
 * Calculate spending by category
 */
export const calculateCategorySpending = (
  transactions: Transaction[],
  limit: number = 4,
): CategorySpending[] => {
  const categoryMap = new Map<string, { amount: number; count: number }>();

  transactions.forEach(txn => {
    if (txn.type === 'debit' && txn.category) {
      const existing = categoryMap.get(txn.category) || {
        amount: 0,
        count: 0,
      };
      categoryMap.set(txn.category, {
        amount: existing.amount + txn.amount,
        count: existing.count + 1,
      });
    }
  });

  const total = Array.from(categoryMap.values()).reduce(
    (sum, cat) => sum + cat.amount,
    0,
  );

  const categories: CategorySpending[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);

  return categories;
};

/**
 * Get category icon and color
 */
export const getCategoryIcon = (
  category: string,
): {
  icon: string;
  color: string;
  bgColor: string;
} => {
  const categoryLower = category.toLowerCase();

  if (categoryLower.includes('grocery') || categoryLower.includes('food')) {
    return {
      icon: '🛒',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500',
    };
  }
  if (categoryLower.includes('transport') || categoryLower.includes('travel')) {
    return {
      icon: '🚗',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500',
    };
  }
  if (
    categoryLower.includes('dining') ||
    categoryLower.includes('restaurant')
  ) {
    return {
      icon: '🍴',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500',
    };
  }
  if (categoryLower.includes('shopping') || categoryLower.includes('retail')) {
    return {
      icon: '🛍️',
      color: 'text-teal-400',
      bgColor: 'bg-teal-500',
    };
  }
  if (categoryLower.includes('bills') || categoryLower.includes('utility')) {
    return {
      icon: '📄',
      color: 'text-red-400',
      bgColor: 'bg-red-500',
    };
  }
  if (categoryLower.includes('entertainment')) {
    return {
      icon: '🎬',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500',
    };
  }

  // Default
  return {
    icon: '💰',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500',
  };
};

export interface MerchantSpending {
  merchant: string;
  amount: number;
  transactionCount: number;
}

export interface MonthlyTrend {
  month: string;
  monthKey: string;
  amount: number;
  date: Date;
}

/**
 * Calculate top merchants by spending
 */
export const calculateTopMerchants = (
  transactions: Transaction[],
  limit: number = 5,
): MerchantSpending[] => {
  const merchantMap = new Map<string, { amount: number; count: number }>();

  transactions.forEach(txn => {
    if (txn.type === 'debit') {
      const existing = merchantMap.get(txn.merchant_name) || {
        amount: 0,
        count: 0,
      };
      merchantMap.set(txn.merchant_name, {
        amount: existing.amount + txn.amount,
        count: existing.count + 1,
      });
    }
  });

  return Array.from(merchantMap.entries())
    .map(([merchant, data]) => ({
      merchant,
      amount: data.amount,
      transactionCount: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
};

/**
 * Calculate spending trends over last N months
 */
export const calculateSpendingTrends = (
  transactions: Transaction[],
  months: number = 6,
): MonthlyTrend[] => {
  const now = new Date();
  const startDate = subMonths(now, months - 1);
  const startOfStartMonth = startOfMonth(startDate);

  // Get all months in the range
  const monthsList = eachMonthOfInterval({
    start: startOfStartMonth,
    end: startOfMonth(now),
  });

  // Initialize all months with 0 spending
  const monthlyData = new Map<string, { amount: number; date: Date }>();

  monthsList.forEach(month => {
    const monthKey = format(month, 'MMM yyyy');
    monthlyData.set(monthKey, { amount: 0, date: month });
  });

  // Calculate spending per month
  transactions.forEach(txn => {
    if (txn.type === 'debit') {
      const txnDate = parseISO(txn.transaction_date);
      const monthKey = format(txnDate, 'MMM yyyy');
      const existing = monthlyData.get(monthKey);
      if (existing) {
        existing.amount += txn.amount;
      }
    }
  });

  return Array.from(monthlyData.entries())
    .map(([monthKey, data]) => ({
      month: format(data.date, 'MMM'),
      monthKey,
      amount: data.amount,
      date: data.date,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (
  current: number,
  previous: number,
): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Calculate average spending per month
 */
export const calculateAverageMonthlySpending = (
  transactions: Transaction[],
  months: number = 3,
): number => {
  const trends = calculateSpendingTrends(transactions, months);
  if (trends.length === 0) return 0;
  const total = trends.reduce((sum, trend) => sum + trend.amount, 0);
  return total / trends.length;
};

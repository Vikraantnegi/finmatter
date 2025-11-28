/**
 * Analytics utilities for FinMatter
 */

import { parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
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

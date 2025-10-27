/**
 * Spending Alerts Component
 * Shows alerts based on transaction categorization and spending patterns
 */

'use client';

import React from 'react';
import { useTransactionStats } from '@/hooks/useTransactions';
import { CategoryIcon } from '@/components/transactions/CategoryIcon';
import { formatCurrency } from '@finmatter/shared';
import { AlertTriangle, TrendingUp, Target, CreditCard } from 'lucide-react';

interface SpendingAlert {
  id: string;
  type:
    | 'high_spending'
    | 'category_spike'
    | 'budget_exceeded'
    | 'unusual_transaction';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  category?: string;
  amount?: number;
  threshold?: number;
  action?: string;
}

interface SpendingAlertsProps {
  className?: string;
}

export function SpendingAlerts({ className = '' }: SpendingAlertsProps) {
  const { stats, loading, error } = useTransactionStats({
    period: 'month',
    groupBy: 'category',
  });

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className='animate-pulse'>
          <div className='h-6 w-48 bg-gray-200 rounded mb-4'></div>
          <div className='space-y-3'>
            {[1, 2, 3].map(i => (
              <div key={i} className='h-16 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return null; // Don't show alerts if we can't load data
  }

  // Generate alerts based on spending patterns
  const alerts: SpendingAlert[] = [];

  // High spending alert
  if (stats.summary.totalSpent > 50000) {
    alerts.push({
      id: 'high_spending',
      type: 'high_spending',
      severity: 'high',
      title: 'High Monthly Spending',
      description: `You've spent ${formatCurrency(stats.summary.totalSpent, 'INR')} this month`,
      amount: stats.summary.totalSpent,
      threshold: 50000,
      action: 'Consider reviewing your budget',
    });
  }

  // Category spike alerts
  stats.breakdown.forEach(category => {
    if (category.percentage > 40) {
      alerts.push({
        id: `category_spike_${category.category}`,
        type: 'category_spike',
        severity: 'medium',
        title: `${category.category.charAt(0).toUpperCase() + category.category.slice(1)} Spending Spike`,
        description: `${category.percentage.toFixed(1)}% of your spending is on ${category.category}`,
        category: category.category,
        amount: category.amount,
        // percentage: category.percentage, // Removing since not in type
        action: 'Consider diversifying your spending',
      });
    }
  });

  // High transaction count alert
  if (stats.summary.totalTransactions > 100) {
    alerts.push({
      id: 'high_transaction_count',
      type: 'unusual_transaction',
      severity: 'low',
      title: 'High Transaction Volume',
      description: `${stats.summary.totalTransactions} transactions this month`,
      action: 'Review for any unauthorized transactions',
    });
  }

  // High average transaction alert
  if (stats.summary.averageTransactionValue > 5000) {
    alerts.push({
      id: 'high_avg_transaction',
      type: 'unusual_transaction',
      severity: 'medium',
      title: 'High Average Transaction Value',
      description: `Average transaction: ${formatCurrency(stats.summary.averageTransactionValue, 'INR')}`,
      amount: stats.summary.averageTransactionValue,
      action: 'Review large transactions for accuracy',
    });
  }

  if (alerts.length === 0) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
      >
        <div className='flex items-center space-x-3'>
          <div className='p-2 bg-green-100 rounded-lg'>
            <Target className='w-5 h-5 text-green-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>All Good!</h3>
            <p className='text-sm text-gray-600'>
              No spending alerts at this time. Your spending patterns look
              healthy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className='w-5 h-5 text-red-600' />;
      case 'medium':
        return <TrendingUp className='w-5 h-5 text-yellow-600' />;
      case 'low':
        return <CreditCard className='w-5 h-5 text-blue-600' />;
      default:
        return <AlertTriangle className='w-5 h-5 text-gray-600' />;
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div className='p-6 border-b border-gray-200'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 bg-orange-100 rounded-lg'>
            <AlertTriangle className='w-5 h-5 text-orange-600' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>
              Spending Alerts
            </h3>
            <p className='text-sm text-gray-600'>
              {alerts.length} alert{alerts.length > 1 ? 's' : ''} based on your
              spending patterns
            </p>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className='divide-y divide-gray-200'>
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`p-6 border-l-4 ${getSeverityColor(alert.severity)}`}
          >
            <div className='flex items-start space-x-3'>
              <div className='flex-shrink-0'>
                {getSeverityIcon(alert.severity)}
              </div>

              <div className='flex-1 min-w-0'>
                <div className='flex items-center space-x-2 mb-1'>
                  <h4 className='text-sm font-semibold text-gray-900'>
                    {alert.title}
                  </h4>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      alert.severity === 'high'
                        ? 'bg-red-100 text-red-800'
                        : alert.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>

                <p className='text-sm text-gray-600 mb-2'>
                  {alert.description}
                </p>

                {alert.category && (
                  <div className='flex items-center space-x-2 mb-2'>
                    <CategoryIcon category={alert.category as any} size='sm' />
                    <span className='text-xs text-gray-500 capitalize'>
                      {alert.category}
                    </span>
                  </div>
                )}

                {alert.action && (
                  <p className='text-xs text-gray-500 italic'>
                    💡 {alert.action}
                  </p>
                )}
              </div>

              {alert.amount && (
                <div className='flex-shrink-0 text-right'>
                  <p className='text-sm font-semibold text-gray-900'>
                    {formatCurrency(alert.amount, 'INR')}
                  </p>
                  {alert.threshold && (
                    <p className='text-xs text-gray-500'>
                      Threshold: {formatCurrency(alert.threshold, 'INR')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className='p-6 bg-gray-50 border-t border-gray-200'>
        <div className='flex items-center justify-between'>
          <p className='text-xs text-gray-500'>
            Alerts are generated based on your transaction categorization and
            spending patterns
          </p>
          <button className='text-xs text-blue-600 hover:text-blue-700 font-medium'>
            Manage Alerts →
          </button>
        </div>
      </div>
    </div>
  );
}

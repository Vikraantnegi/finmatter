/**
 * Credit Utilization Alert Component
 * Shows warnings when credit utilization crosses thresholds
 * Helps users maintain healthy credit scores
 */

'use client';

import React from 'react';
import { Card } from '@finmatter/types';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface UtilizationAlertProps {
  cards: Card[];
  className?: string;
}

export function UtilizationAlert({
  cards,
  className = '',
}: UtilizationAlertProps) {
  const router = useRouter();

  // Calculate total portfolio utilization
  const totalLimit = cards.reduce(
    (sum, card) => sum + (card.creditLimit || 0),
    0,
  );

  const totalUsed = cards.reduce((sum, card) => {
    const used = (card.creditLimit || 0) - (card.availableCredit || 0);
    return sum + used;
  }, 0);

  const utilization = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  // Don't show if no cards or no credit limit data
  if (cards.length === 0 || totalLimit === 0) {
    return null;
  }

  // Danger Zone (>70% utilization)
  if (utilization >= 70) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}
      >
        <div className='flex items-start gap-3'>
          <div className='flex-shrink-0'>
            <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
              <AlertCircle className='w-5 h-5 text-red-600' />
            </div>
          </div>

          <div className='flex-1'>
            <h4 className='font-semibold text-red-900 mb-1'>
              ⚠️ High Credit Utilization: {utilization.toFixed(1)}%
            </h4>
            <p className='text-sm text-red-700 mb-3'>
              Your credit utilization is very high. This may negatively impact
              your credit score. Consider paying down your balance or requesting
              a credit limit increase.
            </p>

            {/* Stats */}
            <div className='grid grid-cols-2 gap-3 mb-3 text-sm'>
              <div className='bg-white rounded-lg p-2'>
                <div className='text-xs text-red-600'>Total Used</div>
                <div className='font-semibold text-red-900'>
                  ₹{totalUsed.toLocaleString()}
                </div>
              </div>
              <div className='bg-white rounded-lg p-2'>
                <div className='text-xs text-red-600'>Total Limit</div>
                <div className='font-semibold text-red-900'>
                  ₹{totalLimit.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className='flex gap-2'>
              <Button
                size='sm'
                variant='outline'
                className='text-red-700 border-red-300 hover:bg-red-100'
                onClick={() => router.push('/cards')}
              >
                View Cards
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='text-red-700 border-red-300 hover:bg-red-100'
                onClick={() => {
                  // TODO: Link to help article
                  window.open(
                    'https://www.google.com/search?q=how+to+improve+credit+utilization',
                    '_blank',
                  );
                }}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Caution Zone (30-70% utilization)
  if (utilization >= 30 && utilization < 70) {
    return (
      <div
        className={`bg-yellow-50 border border-yellow-200 rounded-xl p-4 ${className}`}
      >
        <div className='flex items-start gap-3'>
          <div className='flex-shrink-0'>
            <div className='w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center'>
              <AlertTriangle className='w-5 h-5 text-yellow-600' />
            </div>
          </div>

          <div className='flex-1'>
            <h4 className='font-semibold text-yellow-900 mb-1'>
              Credit Utilization: {utilization.toFixed(1)}%
            </h4>
            <p className='text-sm text-yellow-700 mb-2'>
              Your credit utilization is getting high. Try to keep it below 30%
              for an optimal credit score.
            </p>

            {/* Progress bar */}
            <div className='mb-3'>
              <div className='flex justify-between text-xs text-yellow-700 mb-1'>
                <span>Current: {utilization.toFixed(1)}%</span>
                <span>Target: &lt;30%</span>
              </div>
              <div className='w-full bg-yellow-200 rounded-full h-2'>
                <div
                  className='bg-yellow-500 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
            </div>

            <Button
              size='sm'
              variant='outline'
              className='text-yellow-700 border-yellow-300 hover:bg-yellow-100'
              onClick={() => router.push('/cards')}
            >
              Manage Cards
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Safe Zone (<30% utilization) - Show positive reinforcement
  if (utilization > 0 && utilization < 30) {
    return (
      <div
        className={`bg-green-50 border border-green-200 rounded-xl p-4 ${className}`}
      >
        <div className='flex items-start gap-3'>
          <div className='flex-shrink-0'>
            <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
              <CheckCircle className='w-5 h-5 text-green-600' />
            </div>
          </div>

          <div className='flex-1'>
            <h4 className='font-semibold text-green-900 mb-1'>
              Excellent! Utilization: {utilization.toFixed(1)}%
            </h4>
            <p className='text-sm text-green-700'>
              You&apos;re maintaining a healthy credit utilization ratio. This
              is great for your credit score! 🎉
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No utilization (no usage yet)
  return null;
}

/**
 * Compact version for dashboard widget
 */
export function UtilizationWidget({ cards }: { cards: Card[] }) {
  const totalLimit = cards.reduce(
    (sum, card) => sum + (card.creditLimit || 0),
    0,
  );

  const totalUsed = cards.reduce((sum, card) => {
    const used = (card.creditLimit || 0) - (card.availableCredit || 0);
    return sum + used;
  }, 0);

  const utilization = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

  if (totalLimit === 0) return null;

  const getColor = () => {
    if (utilization >= 70) return 'text-red-600';
    if (utilization >= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getIcon = () => {
    if (utilization >= 70) return <AlertCircle className='w-5 h-5' />;
    if (utilization >= 30) return <AlertTriangle className='w-5 h-5' />;
    return <TrendingUp className='w-5 h-5' />;
  };

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-sm font-medium text-gray-700'>
          Credit Utilization
        </h3>
        <div className={getColor()}>{getIcon()}</div>
      </div>

      <div className='flex items-baseline gap-2 mb-2'>
        <span className={`text-3xl font-bold ${getColor()}`}>
          {utilization.toFixed(1)}%
        </span>
        <span className='text-sm text-gray-500'>
          of ₹{totalLimit.toLocaleString()}
        </span>
      </div>

      <div className='w-full bg-gray-200 rounded-full h-2 mb-2'>
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            utilization >= 70
              ? 'bg-red-500'
              : utilization >= 30
                ? 'bg-yellow-500'
                : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(utilization, 100)}%` }}
        />
      </div>

      <p className='text-xs text-gray-600'>
        {utilization < 30
          ? 'Healthy ratio - great for credit score!'
          : utilization < 70
            ? 'Try to keep below 30% for best score'
            : 'High utilization may hurt credit score'}
      </p>
    </div>
  );
}

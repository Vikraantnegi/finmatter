/**
 * Empty State Component
 * Reusable component for displaying empty states with actions
 */

import React, { ReactNode } from 'react';
import { Button } from './Button';
import { CreditCard, Search, FileText, TrendingUp } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'cards' | 'search' | 'transactions' | 'analytics' | 'generic';
  showBenefits?: boolean; // Show "What you'll get" section
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
  showBenefits = false,
}: EmptyStateProps) {
  // Get illustration component
  const IllustrationComponent = illustration
    ? getIllustration(illustration)
    : null;

  return (
    <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
      {/* Icon or Illustration */}
      {IllustrationComponent ? (
        <div className='mb-6'>
          <IllustrationComponent />
        </div>
      ) : icon ? (
        <div className='mb-4'>{icon}</div>
      ) : (
        <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6'>
          <CreditCard className='w-12 h-12 text-gray-400' />
        </div>
      )}

      {/* Title */}
      <h3 className='text-xl font-semibold text-gray-900 mb-2'>{title}</h3>

      {/* Description */}
      <p className='text-gray-600 max-w-md mb-6'>{description}</p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className='flex gap-3'>
          {action && (
            <Button
              onClick={action.onClick}
              className='flex items-center gap-2'
            >
              {action.icon}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant='outline' onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {/* Benefits Section */}
      {showBenefits && illustration === 'cards' && (
        <div className='mt-8 max-w-md w-full'>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <p className='text-sm font-semibold text-blue-900 mb-3'>
              What you&apos;ll get:
            </p>
            <ul className='text-sm text-blue-800 space-y-2 text-left'>
              <li className='flex items-start gap-2'>
                <span className='text-blue-600 flex-shrink-0'>✓</span>
                <span>Track all your credit cards in one place</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-blue-600 flex-shrink-0'>✓</span>
                <span>Get smart reward optimization suggestions</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-blue-600 flex-shrink-0'>✓</span>
                <span>Monitor credit utilization automatically</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-blue-600 flex-shrink-0'>✓</span>
                <span>Never miss payment due dates</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple illustrations for different empty states
 */
function getIllustration(type: string) {
  switch (type) {
    case 'cards':
      return CardsIllustration;
    case 'search':
      return SearchIllustration;
    case 'transactions':
      return TransactionsIllustration;
    case 'analytics':
      return AnalyticsIllustration;
    default:
      return GenericIllustration;
  }
}

function CardsIllustration() {
  return (
    <div className='relative w-48 h-32'>
      {/* Stack of cards */}
      <div className='absolute top-0 left-8 w-32 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-lg transform rotate-6 opacity-30'></div>
      <div className='absolute top-2 left-10 w-32 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-lg transform rotate-3 opacity-50'></div>
      <div className='absolute top-4 left-12 w-32 h-20 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg shadow-xl flex items-center justify-center'>
        <CreditCard className='w-12 h-12 text-white opacity-80' />
      </div>
    </div>
  );
}

function SearchIllustration() {
  return (
    <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center'>
      <Search className='w-12 h-12 text-gray-400' />
    </div>
  );
}

function TransactionsIllustration() {
  return (
    <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center'>
      <FileText className='w-12 h-12 text-gray-400' />
    </div>
  );
}

function AnalyticsIllustration() {
  return (
    <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center'>
      <TrendingUp className='w-12 h-12 text-gray-400' />
    </div>
  );
}

function GenericIllustration() {
  return (
    <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center'>
      <div className='text-4xl'>📋</div>
    </div>
  );
}

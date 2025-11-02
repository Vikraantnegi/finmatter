'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: 'cards' | 'transactions' | 'goals' | 'insights';
  className?: string;
}

const illustrations = {
  cards: (
    <div className='relative w-full h-48 mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900'>
      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='w-48 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl rotate-12 transform scale-110' />
        <div className='absolute w-40 h-28 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-xl -rotate-6' />
      </div>
    </div>
  ),
  transactions: (
    <div className='relative w-full h-48 mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100'>
      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='w-32 h-32 bg-gradient-to-br from-amber-300/40 to-orange-300/40 rounded-xl' />
        <div className='absolute w-24 h-8 bg-green-400/60 rounded-lg rotate-12 top-12' />
        <div className='absolute w-20 h-8 bg-green-500/60 rounded-lg -rotate-12 top-24' />
      </div>
    </div>
  ),
  goals: (
    <div className='relative w-full h-48 mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100'>
      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='flex items-end gap-2'>
          <div className='w-12 h-16 bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-lg' />
          <div className='w-12 h-24 bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-lg' />
          <div className='w-12 h-32 bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-lg' />
        </div>
      </div>
    </div>
  ),
  insights: (
    <div className='relative w-full h-48 mb-6 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center'>
      <div className='w-24 h-24 rounded-full bg-gray-700/50 flex items-center justify-center'>
        <svg
          className='w-12 h-12 text-primary'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
          />
        </svg>
      </div>
    </div>
  ),
};

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  illustration = 'cards',
  className = '',
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center text-center px-6 py-8 ${className}`}
    >
      {/* Illustration */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className='w-full max-w-sm'
      >
        {illustrations[illustration]}
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className='text-xl font-bold text-white mb-2'>{title}</h3>
        <p className='text-sm text-gray-400 mb-6 max-w-sm'>{description}</p>

        {/* Action Button */}
        {actionLabel && onAction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={onAction}
              className='bg-primary hover:opacity-90 text-white font-semibold'
            >
              {actionLabel}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

/**
 * Specific Empty State Components
 */

export const NoCardsEmptyState = () => {
  const router = useRouter();
  return (
    <EmptyState
      title='No Cards Added Yet'
      description='Add your first card to unlock app features and start tracking your spending.'
      actionLabel='Add Card'
      onAction={() => router.push('/cards/add')}
      illustration='cards'
    />
  );
};

export const NoTransactionsEmptyState = () => {
  const router = useRouter();
  return (
    <EmptyState
      title='No recent transactions'
      description='Add transactions or link your accounts to see your recent activity.'
      actionLabel='Upload Transactions'
      onAction={() => router.push('/statements')}
      illustration='transactions'
    />
  );
};

export const NoInsightsEmptyState = () => {
  const router = useRouter();
  return (
    <EmptyState
      title='Unlock Your Financial Insights'
      description='Powerful insights are waiting. Connect an account or upload a statement to see your spending analysis and rewards optimization.'
      actionLabel='Connect Account'
      onAction={() => router.push('/statements')}
      illustration='insights'
    />
  );
};

export const NoGoalsEmptyState = () => {
  return (
    <EmptyState
      title='No goals yet'
      description='Set up your first goal to start tracking your progress and achieve your financial objectives.'
      actionLabel='Create Goal'
      onAction={() => {
        // TODO: Implement goal creation
        console.log('Create goal');
      }}
      illustration='goals'
    />
  );
};

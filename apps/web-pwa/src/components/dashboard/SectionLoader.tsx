'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reusable skeleton loader for dashboard sections
 * Matches dark theme design tokens
 */

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps) => {
  return (
    <div
      className={`bg-gray-700 rounded-lg relative overflow-hidden ${className}`}
    >
      <motion.div
        className='absolute inset-0'
        animate={{
          x: ['-200%', '200%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
          repeatDelay: 0,
        }}
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
          width: '100%',
          height: '100%',
          transform: 'skewX(-20deg)',
        }}
      />
    </div>
  );
};

/**
 * Card Stack Loader
 */
export const CardsStackLoader = ({
  hideHeader = false,
}: {
  hideHeader?: boolean;
}) => {
  return (
    <div className='space-y-4'>
      {/* Header */}
      {!hideHeader ? (
        <div className='px-6 pt-4'>
          <div className='flex items-center justify-between'>
            <Skeleton className='w-32 h-6' />
            <Skeleton className='w-24 h-8 rounded-full' />
          </div>
        </div>
      ) : null}

      {/* Card Stack */}
      <div className='px-6'>
        <div className='relative h-[300px] pt-6 pb-10 overflow-hidden'>
          {[0, 1, 2].map(index => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: index * 28,
                scale: 1 - index * 0.05,
              }}
              transition={{ delay: index * 0.08 }}
              className='absolute top-6 left-0 right-0 h-[250px]'
              style={{
                zIndex: 3 - index,
                transformOrigin: 'top center',
                filter: index > 0 ? `brightness(${1 - index * 0.15})` : 'none',
                boxShadow:
                  index === 0
                    ? '0 28px 60px rgba(15, 23, 42, 0.55)'
                    : `0 ${12 + index * 6}px ${20 + index * 12}px rgba(15, 23, 42, 0.35)`,
              }}
            >
              <div className='w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-white/10'>
                {/* Top */}
                <div className='flex justify-between items-start mb-8'>
                  <div className='space-y-2'>
                    <Skeleton className='w-20 h-4' />
                    <Skeleton className='w-14 h-8 rounded-md' />
                  </div>
                  <div className='space-y-1 text-right'>
                    <Skeleton className='w-16 h-3 ml-auto' />
                    <Skeleton className='w-20 h-5' />
                  </div>
                </div>

                {/* Middle */}
                <div className='mb-8'>
                  <Skeleton className='w-32 h-5' />
                </div>

                {/* Bottom */}
                <div className='flex justify-between items-end'>
                  <div className='space-y-2'>
                    <Skeleton className='w-24 h-3' />
                    <Skeleton className='w-28 h-6' />
                  </div>
                  <div className='space-y-1 text-right'>
                    <Skeleton className='w-12 h-3 ml-auto' />
                    <Skeleton className='w-14 h-4' />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Section Card Loader
 */
export const SectionCardLoader = ({
  className = '',
}: {
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gray-900/50 rounded-2xl border border-gray-800 p-6 ${className}`}
    >
      <div className='space-y-4'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <Skeleton className='w-32 h-6' />
            <Skeleton className='w-48 h-4' />
          </div>
          <Skeleton className='w-20 h-8 rounded-lg' />
        </div>

        {/* Content */}
        <div className='space-y-3'>
          <Skeleton className='w-full h-32 rounded-xl' />
          <div className='grid grid-cols-2 gap-3'>
            <Skeleton className='w-full h-20 rounded-lg' />
            <Skeleton className='w-full h-20 rounded-lg' />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * List Item Loader
 */
export const ListItemLoader = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='flex items-center gap-3 p-4 bg-gray-900/30 rounded-xl border border-gray-800'
    >
      <Skeleton className='w-12 h-12 rounded-xl flex-shrink-0' />
      <div className='flex-1 space-y-2'>
        <Skeleton className='w-32 h-4' />
        <Skeleton className='w-24 h-3' />
      </div>
      <Skeleton className='w-20 h-5' />
    </motion.div>
  );
};

/**
 * Spending Chart Loader
 */
export const SpendingChartLoader = () => {
  return (
    <div className='px-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gray-800 rounded-xl border border-gray-700 p-5'
      >
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <Skeleton className='w-40 h-6' />
          <Skeleton className='w-5 h-5 rounded' />
        </div>

        {/* Chart Area */}
        <div className='flex items-center justify-center py-4 mb-4'>
          <Skeleton className='w-40 h-40 rounded-full' />
        </div>

        {/* Total */}
        <div className='text-center mb-4 space-y-1'>
          <Skeleton className='w-20 h-3 mx-auto' />
          <Skeleton className='w-32 h-7 mx-auto' />
        </div>

        {/* Legend */}
        <div className='space-y-2'>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Skeleton className='w-3 h-3 rounded-full' />
                <Skeleton className='w-24 h-4' />
              </div>
              <Skeleton className='w-20 h-4' />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Rewards Widget Loader
 */
export const RewardsWidgetLoader = () => {
  return (
    <div className='px-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gray-800 rounded-xl border border-gray-700 p-5'
      >
        <div className='space-y-4'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <Skeleton className='w-40 h-6' />
            <Skeleton className='w-16 h-5' />
          </div>

          {/* Rewards */}
          <div className='space-y-3'>
            {[1, 2, 3].map(i => (
              <ListItemLoader key={i} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Recent Transactions Loader
 */
export const RecentTransactionsLoader = ({
  className = '',
}: {
  className?: string;
}) => {
  return (
    <div className={`px-6 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gray-800 rounded-xl border border-gray-700 p-5'
      >
        <div className='space-y-4'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <Skeleton className='w-40 h-6' />
            <Skeleton className='w-16 h-5' />
          </div>

          {/* Transactions */}
          <div className='space-y-3'>
            {[1, 2, 3].map(i => (
              <ListItemLoader key={i} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Transactions List Loader (for transaction list pages)
 */
export const TransactionsListLoader = ({
  className = '',
}: {
  className?: string;
}) => {
  return (
    <div
      className={`min-h-screen bg-background-dark flex flex-col pb-24 ${className}`}
    >
      {/* Header */}
      <div className='px-6 py-4 border-b border-gray-800'>
        <div className='flex items-center justify-between mb-4'>
          <Skeleton className='w-6 h-6 rounded' />
          <Skeleton className='w-32 h-6' />
          <Skeleton className='w-6 h-6 rounded' />
        </div>
      </div>

      {/* Search Bar */}
      <div className='px-6 py-4'>
        <Skeleton className='w-full h-12 rounded-xl' />
      </div>

      {/* Filters */}
      <div className='px-6 pb-4'>
        <div className='flex items-center gap-2'>
          <Skeleton className='w-32 h-10 rounded-lg' />
          <Skeleton className='w-28 h-10 rounded-lg' />
          <Skeleton className='w-24 h-10 rounded-lg' />
        </div>
      </div>

      {/* Transactions List */}
      <div className='flex-1 px-6 py-4 space-y-6'>
        {[1, 2].map(dateGroup => (
          <div key={dateGroup} className='space-y-3'>
            {/* Date Header */}
            <div className='pb-2'>
              <Skeleton className='w-32 h-6' />
            </div>

            {/* Transaction Items */}
            <div className='space-y-3'>
              {[1, 2, 3].map(item => (
                <div
                  key={item}
                  className='bg-gray-800 rounded-xl p-4 border border-gray-700'
                >
                  <div className='flex items-start gap-3'>
                    {/* Merchant Icon */}
                    <Skeleton className='w-12 h-12 rounded-full flex-shrink-0' />

                    {/* Transaction Details */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between mb-1'>
                        <div className='flex-1 min-w-0'>
                          <Skeleton className='w-48 h-5 mb-2' />
                          <div className='flex items-center gap-3'>
                            <Skeleton className='w-24 h-4' />
                            <Skeleton className='w-16 h-4' />
                          </div>
                        </div>
                        {/* Amount */}
                        <div className='text-right flex-shrink-0 ml-2'>
                          <Skeleton className='w-20 h-6' />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Recent Rewards Loader
 */
export const RecentRewardsLoader = ({
  className = '',
}: {
  className?: string;
}) => {
  return (
    <div className={`px-6 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gray-800 rounded-xl border border-gray-700 p-5'
      >
        <div className='space-y-4'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <Skeleton className='w-40 h-6' />
            <Skeleton className='w-16 h-5' />
          </div>

          {/* Rewards */}
          <div className='space-y-3'>
            {[1, 2, 3].map(i => (
              <ListItemLoader key={i} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Spending Summary Loader
 */
export const SpendingSummaryLoader = ({
  className = '',
}: {
  className?: string;
}) => {
  return (
    <div className={`px-6 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gray-800 rounded-xl border border-gray-700 p-5'
      >
        <div className='flex items-center gap-6'>
          {/* Left side */}
          <div className='flex-1 flex items-center gap-4'>
            <Skeleton className='w-12 h-12 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='w-full h-4' />
              <Skeleton className='w-full h-7' />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Categorized Spends Loader
 */
export const CategorizedSpendsLoader = ({
  className = '',
}: {
  className?: string;
}) => {
  return (
    <div className={`px-6 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gray-800 rounded-xl border border-gray-700 p-5'
      >
        <div className='space-y-4'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <Skeleton className='w-40 h-6' />
            <Skeleton className='w-16 h-5' />
          </div>
          {/* Categories */}
          <div className='space-y-4'>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='w-10 h-10 rounded-lg' />
                    <Skeleton className='w-24 h-4' />
                  </div>
                  <Skeleton className='w-20 h-4' />
                </div>
                <Skeleton className='w-full h-2 rounded-full' />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * Spending Analysis Loader
 */
export const SpendingAnalysisLoader = ({
  className = '',
}: {
  className?: string;
}) => {
  return (
    <div className={`px-6 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gray-800 rounded-xl border border-gray-700 p-5'
      >
        <div className='space-y-4'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <Skeleton className='w-40 h-6' />
            <Skeleton className='w-5 h-5 rounded' />
          </div>
          {/* Chart */}
          <div className='flex items-center justify-center py-4'>
            <Skeleton className='w-40 h-40 rounded-full' />
          </div>
          {/* Total */}
          <div className='text-center space-y-1'>
            <Skeleton className='w-20 h-3 mx-auto' />
            <Skeleton className='w-32 h-7 mx-auto' />
          </div>
          {/* Legend */}
          <div className='space-y-2'>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='w-3 h-3 rounded-full' />
                  <Skeleton className='w-24 h-4' />
                </div>
                <Skeleton className='w-20 h-4' />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * AI Widget Loader
 */
export const AIWidgetLoader = () => {
  return (
    <div className='px-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl border border-blue-800/30 p-6'
      >
        <div className='flex items-center gap-4'>
          <Skeleton className='w-14 h-14 rounded-full' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='w-48 h-5' />
            <Skeleton className='w-64 h-4' />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

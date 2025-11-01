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

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.5, 0.7, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`bg-gray-800/50 rounded-lg ${className}`}
    />
  );
}

/**
 * Card Stack Loader
 */
export function CardsStackLoader() {
  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='px-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Skeleton className='w-24 h-6' />
            <Skeleton className='w-6 h-6 rounded-full' />
          </div>
          <Skeleton className='w-16 h-5' />
        </div>
      </div>

      {/* Card Stack */}
      <div className='px-6'>
        <div className='relative h-[200px]'>
          {[0, 1, 2].map(index => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: index * 12,
                scale: 1 - index * 0.05,
              }}
              transition={{ delay: index * 0.1 }}
              className='absolute inset-0'
              style={{ zIndex: 3 - index }}
            >
              <div className='w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6'>
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
}

/**
 * Section Card Loader
 */
export function SectionCardLoader({ className = '' }: { className?: string }) {
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
}

/**
 * List Item Loader
 */
export function ListItemLoader() {
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
}

/**
 * Spending Chart Loader
 */
export function SpendingChartLoader() {
  return (
    <div className='px-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gray-900/50 rounded-2xl border border-gray-800 p-6'
      >
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div className='space-y-2'>
            <Skeleton className='w-36 h-6' />
            <Skeleton className='w-48 h-4' />
          </div>
          <Skeleton className='w-24 h-8 rounded-lg' />
        </div>

        {/* Chart Area */}
        <div className='flex items-center justify-center py-8'>
          <Skeleton className='w-48 h-48 rounded-full' />
        </div>

        {/* Legend */}
        <div className='grid grid-cols-2 gap-3 mt-6'>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className='flex items-center gap-2'>
              <Skeleton className='w-3 h-3 rounded-full' />
              <Skeleton className='w-24 h-4' />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Rewards Widget Loader
 */
export function RewardsWidgetLoader() {
  return (
    <div className='px-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gray-900/50 rounded-2xl border border-gray-800 p-6'
      >
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Skeleton className='w-40 h-6' />
            <Skeleton className='w-56 h-4' />
          </div>

          <div className='flex items-center gap-4 p-4 bg-gray-800/30 rounded-xl'>
            <Skeleton className='w-12 h-12 rounded-xl' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='w-32 h-5' />
              <Skeleton className='w-24 h-3' />
            </div>
            <Skeleton className='w-20 h-6' />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Recent Transactions Loader
 */
export function RecentTransactionsLoader() {
  return (
    <div className='px-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gray-900/50 rounded-2xl border border-gray-800 p-6'
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
}

/**
 * AI Widget Loader
 */
export function AIWidgetLoader() {
  return (
    <div className='px-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl border border-blue-800/30 p-6'
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
}

/**
 * Full Dashboard Loader
 */
export function DashboardLoader() {
  return (
    <div className='space-y-6 pb-6'>
      {/* Header Loader */}
      <div className='px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Skeleton className='w-12 h-12 rounded-full' />
            <Skeleton className='w-40 h-6' />
          </div>
          <Skeleton className='w-10 h-10 rounded-full' />
        </div>
      </div>

      <CardsStackLoader />
      <SpendingChartLoader />
      <RecentTransactionsLoader />
      <RewardsWidgetLoader />
      <AIWidgetLoader />
    </div>
  );
}

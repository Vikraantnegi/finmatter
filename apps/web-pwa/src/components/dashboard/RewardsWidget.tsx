'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight, Gift } from 'lucide-react';
import { useCards } from '@/hooks/useCards';
import { formatCurrency } from '@finmatter/shared';
import { RewardsWidgetLoader } from './SectionLoader';

interface RewardsWidgetProps {
  className?: string;
}

export function RewardsWidget({ className = '' }: RewardsWidgetProps) {
  const router = useRouter();
  const { cards, isLoading } = useCards();

  if (isLoading) {
    return <RewardsWidgetLoader />;
  }

  // For now, using mock data - will be replaced with actual rewards data
  const totalRewardsEarned = 78.2; // Mock value
  const topEarningCard = cards.length > 0 ? cards[0] : null;

  if (!topEarningCard) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`px-6 ${className}`}
    >
      <div className='bg-gray-900/50 rounded-2xl border border-gray-800 p-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h3 className='text-lg font-bold text-white'>
              Credit Card Rewards
            </h3>
            <p className='text-sm text-gray-400'>
              You&apos;ve earned {formatCurrency(totalRewardsEarned, 'INR')} in
              cash back this month.
            </p>
          </div>
        </div>

        {/* Top Earning Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push(`/cards/${topEarningCard.id}`)}
          className='w-full flex items-center gap-4 p-4 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-800/30 rounded-xl group'
        >
          {/* Icon */}
          <div className='w-12 h-12 rounded-xl bg-green-900/30 flex items-center justify-center flex-shrink-0'>
            <Gift className='w-6 h-6 text-green-400' />
          </div>

          {/* Card Info */}
          <div className='flex-1 text-left'>
            <h4 className='text-sm font-semibold text-white'>
              {topEarningCard.cardName}
            </h4>
            <p className='text-xs text-gray-400'>Top Earner</p>
          </div>

          {/* Rewards Amount */}
          <div className='flex items-center gap-2'>
            <span className='text-lg font-bold text-success-400'>
              +{formatCurrency(45.5, 'INR')}
            </span>
            <ChevronRight className='w-4 h-4 text-gray-400 group-hover:text-primary transition-colors' />
          </div>
        </motion.button>

        {/* View Details Button */}
        <button
          onClick={() => router.push('/rewards')}
          className='w-full mt-4 py-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl text-sm font-medium text-primary hover:text-primary/80 transition-colors'
        >
          View Rewards Details
        </button>
      </div>
    </motion.div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { CardPreview } from './CardPreview';
import { formatCurrency } from '@/lib/utils';
import type { Card } from '@finmatter/types';
import { cn } from '@/lib/utils';

interface CardGridItemProps {
  card: Card;
  className?: string;
}

export const CardGridItem = ({ card, className }: CardGridItemProps) => {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/cards/${card.id}`);
  };

  // Mock spending data (will be replaced with actual transaction data later)
  const monthlySpending = 0; // TODO: Get from transactions API

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-gray-900/60 rounded-3xl border border-gray-800/70 overflow-hidden hover:border-gray-700 transition-all',
        className,
      )}
    >
      {/* Card Visual Preview */}
      <div className='p-5'>
        <div className='h-32'>
          <CardPreview
            card={card}
            showFlipAction={false}
            className='h-32 w-full'
          />
        </div>
      </div>

      {/* Card Info */}
      <div className='px-5 pb-5 space-y-4'>
        {/* Card Name */}
        <div>
          <h3 className='text-lg font-bold text-white'>
            {card.cardMetadata?.displayName ||
              card.bank?.displayName ||
              'Credit Card'}
          </h3>
          <p className='text-sm text-gray-400 mt-0.5'>
            {card.bank?.displayName || card.bank?.name || 'Bank'}
          </p>
        </div>

        {/* Divider */}
        <div className='h-px bg-gray-800' />

        {/* Spending Data */}
        <div>
          <p className='text-xs text-gray-400 mb-1'>Spent this month</p>
          <p className='text-xl font-bold text-white'>
            {monthlySpending > 0
              ? formatCurrency(monthlySpending)
              : 'No transactions'}
          </p>
        </div>

        {/* View Details Button */}
        <button
          onClick={handleViewDetails}
          className='w-full flex items-center justify-center gap-2 rounded-full border border-primary/40 text-primary font-semibold py-3 hover:bg-primary/10 transition-colors'
        >
          View Details
          <ChevronRight className='w-4 h-4' />
        </button>
      </div>
    </motion.div>
  );
};

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CardPreview } from './CardPreview';
import { Button } from '@/components/ui/Button';
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
        'bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all',
        className,
      )}
    >
      {/* Card Visual Preview */}
      <div className='p-4'>
        <div className='h-32 -mb-8'>
          <CardPreview card={card} className='h-32 w-full' />
        </div>
      </div>

      {/* Card Info */}
      <div className='px-4 pt-8 pb-4 space-y-3'>
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
        <div className='h-px bg-gray-700' />

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
        <Button
          onClick={handleViewDetails}
          className='w-full bg-primary hover:bg-primary/90 text-white font-semibold'
          size='sm'
        >
          View Details
        </Button>
      </div>
    </motion.div>
  );
};

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { CardPreview } from './CardPreview';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('px-2', className)}
    >
      <div
        onClick={handleViewDetails}
        className='cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]'
      >
        <CardPreview
          card={card}
          className='h-[250px] w-full'
          networkIconVariant='logo'
        />
      </div>

      <button
        onClick={handleViewDetails}
        className='mt-4 px-8 mx-auto flex items-center justify-center gap-2 rounded-full border border-primary/40 text-primary font-semibold py-2 hover:bg-primary/10 transition-colors'
      >
        View Details
        <ChevronRight className='w-4 h-4' />
      </button>
    </motion.div>
  );
};

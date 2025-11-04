'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { CardPreview } from './CardPreview';
import type { Card } from '@finmatter/types';
import { cn } from '@/lib/utils';

interface CardsStackProps {
  cards: Card[];
  maxVisible?: number;
  className?: string;
}

export const CardsStack = ({
  cards,
  maxVisible = 3,
  className,
}: CardsStackProps) => {
  const router = useRouter();
  const visibleCards = cards.slice(0, maxVisible);

  if (visibleCards.length === 0) {
    return null;
  }

  const handleCardClick = (cardId: string) => {
    router.push(`/cards/${cardId}`);
  };

  const handleViewAll = () => {
    router.push('/cards');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className='px-6 flex items-center justify-between'>
        <h2 className='text-xl font-bold text-white'>Your Cards</h2>
        {cards.length > maxVisible && (
          <button
            onClick={handleViewAll}
            className='flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-sm font-medium'
          >
            View All
            <ChevronRight className='w-4 h-4' />
          </button>
        )}
      </div>

      {/* Card Stack */}
      <div className='px-6'>
        <div className='relative h-[280px] pt-6'>
          {visibleCards.map((card, index) => {
            const isTop = index === 0;
            const offset = index * 18;
            const scale = 1 - index * 0.03;
            const brightness = 1 - index * 0.08;
            const zIndex = visibleCards.length - index;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: offset,
                  scale,
                }}
                transition={{ delay: index * 0.1 }}
                className='absolute top-0 left-0 right-0 cursor-pointer'
                style={{
                  zIndex,
                  transformOrigin: 'top center',
                  filter: index > 0 ? `brightness(${brightness})` : 'none',
                  boxShadow:
                    index === 0
                      ? '0 20px 40px rgba(0, 0, 0, 0.4)'
                      : `0 ${8 + index * 4}px ${16 + index * 8}px rgba(0, 0, 0, 0.3)`,
                }}
                onClick={() => isTop && handleCardClick(card.id)}
                whileTap={isTop ? { scale: 0.98 } : {}}
              >
                <div className='h-[230px]'>
                  <CardPreview card={card} className='h-[230px] w-full' />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

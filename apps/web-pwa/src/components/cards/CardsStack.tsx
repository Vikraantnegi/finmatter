'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { CardPreview } from './CardPreview';
import type { Card } from '@finmatter/types';
import { cn } from '@/lib/utils';

interface CardsStackProps {
  cards: Card[];
  maxVisible?: number;
  className?: string;
  onAddCard?: () => void;
  onViewAll?: () => void;
}

export const CardsStack = ({
  cards,
  maxVisible = 3,
  className,
  onViewAll,
}: CardsStackProps) => {
  const router = useRouter();
  const [cardOrder, setCardOrder] = useState<string[]>([]);

  useEffect(() => {
    setCardOrder(cards.map(card => card.id));
  }, [cards]);

  const orderedCards = useMemo(() => {
    return cardOrder
      .map(id => cards.find(card => card.id === id))
      .filter((card): card is Card => Boolean(card));
  }, [cardOrder, cards]);

  const visibleCards = orderedCards.slice(0, maxVisible);

  if (visibleCards.length === 0) {
    return null;
  }

  const handleCardClick = (cardId: string) => {
    router.push(`/cards/${cardId}`);
  };

  const handleViewAll = () => {
    router.push('/cards');
  };

  const cycleDown = () => {
    setCardOrder(prev => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  };

  const cycleUp = () => {
    setCardOrder(prev => {
      if (prev.length <= 1) return prev;
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, prev.length - 1);
      return [last, ...rest];
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className='px-6 pt-4 flex items-center justify-between'>
        <h2 className='text-xl font-bold text-white'>Your Cards</h2>
        <div className='flex items-center gap-2'>
          {(onViewAll || cards.length > maxVisible) && (
            <button
              onClick={onViewAll ?? handleViewAll}
              className='flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-primary border border-primary/40 rounded-full hover:bg-primary/10 transition-colors'
            >
              View All
              <ChevronRight className='w-4 h-4' />
            </button>
          )}
        </div>
      </div>

      {/* Card Stack */}
      <div className='px-6 space-y-4'>
        <div className='relative h-[300px] pt-6 pb-10'>
          {visibleCards.map((card, index) => {
            const isTop = index === 0;
            const offset = index * 28;
            const scale = 1 - index * 0.05;
            const brightness = 1 - index * 0.15;
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
                transition={{ delay: index * 0.08 }}
                className='absolute top-0 left-0 right-0 cursor-pointer'
                style={{
                  zIndex,
                  transformOrigin: 'top center',
                  filter: index > 0 ? `brightness(${brightness})` : 'none',
                  boxShadow:
                    index === 0
                      ? '0 28px 60px rgba(15, 23, 42, 0.55)'
                      : `0 ${12 + index * 6}px ${
                          20 + index * 12
                        }px rgba(15, 23, 42, 0.35)`,
                }}
                onClick={() => isTop && handleCardClick(card.id)}
                drag={isTop ? 'y' : false}
                dragSnapToOrigin
                dragConstraints={{ top: -110, bottom: 110 }}
                dragElastic={0.18}
                onDragEnd={(_event, info) => {
                  if (!isTop) return;
                  if (info.offset.y > 80) {
                    cycleDown();
                  } else if (info.offset.y < -80) {
                    cycleUp();
                  }
                }}
                whileTap={isTop ? { scale: 0.98 } : {}}
              >
                <CardPreview
                  card={card}
                  showFlipAction={false}
                  className='h-[250px] w-full'
                />
              </motion.div>
            );
          })}

          {visibleCards.length > 1 && (
            <div className='absolute top-1/2 right-0 -translate-y-1/2'>
              <div className='flex flex-col gap-2 p-2 bg-slate-900/80 border border-slate-700/60 rounded-full shadow-[0_12px_30px_-18px_rgba(15,23,42,0.7)] backdrop-blur'>
                <button
                  type='button'
                  onClick={cycleUp}
                  className='p-1.5 rounded-full hover:bg-slate-800 text-slate-300 transition-colors'
                  aria-label='Show previous card'
                >
                  <ChevronUp className='w-4 h-4' />
                </button>
                <button
                  type='button'
                  onClick={cycleDown}
                  className='p-1.5 rounded-full hover:bg-slate-800 text-slate-300 transition-colors'
                  aria-label='Show next card'
                >
                  <ChevronDown className='w-4 h-4' />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

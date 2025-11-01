'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@finmatter/types';
import { motion } from 'framer-motion';
import { getNetworkLogo } from '@/components/icons/CardNetworks';
import { getCardColors } from '@/lib/cardColors';
import { formatCurrency } from '@finmatter/shared';

interface CardsStackProps {
  cards: Card[];
  className?: string;
}

export function CardsStack({ cards, className = '' }: CardsStackProps) {
  const router = useRouter();

  // Show max 3 cards in the stack
  const visibleCards = cards.slice(0, 3);
  const totalCards = cards.length;

  const handleCardClick = (card: Card) => {
    router.push(`/cards/${card.id}`);
  };

  const handleViewAll = () => {
    router.push('/cards');
  };

  if (cards.length === 0) {
    return null; // Empty state handled by parent
  }

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <div className='flex items-center justify-between mb-4 px-6'>
        <div className='flex items-center gap-2'>
          <h2 className='text-xl font-bold text-white'>My Cards</h2>
          <div className='w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center'>
            <span className='text-xs font-bold text-gray-400'>
              {totalCards}
            </span>
          </div>
        </div>
        {totalCards > 3 && (
          <button
            onClick={handleViewAll}
            className='text-sm font-medium text-primary hover:text-primary/80 transition-colors'
          >
            View All
          </button>
        )}
      </div>

      {/* Cards Stack */}
      <div className='relative px-6'>
        <div className='relative h-[200px]'>
          {visibleCards.map((card, index) => {
            const colors = getCardColors(
              card.bankName,
              card.primaryColor,
              card.secondaryColor,
            );
            const NetworkLogo = getNetworkLogo(card.network);
            const unbilledSpend =
              card.creditLimit && card.availableCredit
                ? card.creditLimit - card.availableCredit
                : 0;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{
                  opacity: 1,
                  scale: 1 - index * 0.05,
                  y: index * 12,
                  zIndex: visibleCards.length - index,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                  delay: index * 0.1,
                }}
                onClick={() => handleCardClick(card)}
                className='absolute inset-0 cursor-pointer'
                style={{
                  transformOrigin: 'top center',
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='relative w-full h-full rounded-2xl overflow-hidden shadow-2xl'
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  }}
                >
                  {/* Card Content */}
                  <div className='relative h-full p-6 flex flex-col justify-between text-white'>
                    {/* Top Section */}
                    <div className='flex justify-between items-start'>
                      <div>
                        <p className='text-sm opacity-75 mb-1'>
                          {card.bankName}
                        </p>
                        <div className='bg-white/95 rounded-md p-1.5 shadow-sm backdrop-blur-sm inline-block'>
                          <NetworkLogo className='w-12 h-7' />
                        </div>
                      </div>
                      <div className='text-right'>
                        <p className='text-xs opacity-75'>Last 4 digits</p>
                        <p className='text-lg font-mono tracking-wider'>
                          xx{card.lastFourDigits || '••••'}
                        </p>
                      </div>
                    </div>

                    {/* Middle Section */}
                    <div>
                      <p className='font-semibold text-lg mb-1'>
                        {card.cardName}
                      </p>
                    </div>

                    {/* Bottom Section */}
                    <div className='flex justify-between items-end'>
                      <div>
                        <p className='text-xs opacity-75 mb-1'>
                          Unbilled Spends
                        </p>
                        <p className='text-xl font-bold'>
                          {formatCurrency(unbilledSpend, 'INR')}
                        </p>
                      </div>
                      {card.expiryDate && (
                        <div className='text-right'>
                          <p className='text-xs opacity-75'>EXPIRES</p>
                          <p className='text-sm font-medium tracking-wide'>
                            {new Date(card.expiryDate).toLocaleDateString(
                              'en-GB',
                              {
                                month: '2-digit',
                                year: '2-digit',
                              },
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Decorative Elements */}
                    <div className='absolute top-4 right-4 opacity-10'>
                      <div className='w-16 h-16 rounded-full bg-white'></div>
                    </div>
                    <div className='absolute bottom-8 right-12 opacity-5'>
                      <div className='w-10 h-10 rounded-full bg-white'></div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

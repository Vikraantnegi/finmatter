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
        <div className='relative h-[280px] pt-6'>
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
                  scale: 1 - index * 0.03,
                  y: index * 18,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                  delay: index * 0.1,
                }}
                onClick={() => handleCardClick(card)}
                className='absolute top-0 left-0 right-0 h-[230px] cursor-pointer'
                style={{
                  transformOrigin: 'top center',
                  zIndex: visibleCards.length - index,
                  filter:
                    index > 0 ? `brightness(${1 - index * 0.08})` : 'none',
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className='relative w-full h-full rounded-2xl overflow-hidden border border-white/10'
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    boxShadow:
                      index === 0
                        ? '0 20px 40px rgba(0, 0, 0, 0.4)'
                        : `0 ${8 + index * 4}px ${16 + index * 8}px rgba(0, 0, 0, 0.3)`,
                  }}
                >
                  {/* Card Content */}
                  <div className='relative h-full p-6 flex flex-col justify-between text-white overflow-hidden'>
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
                        <p className='text-xs opacity-75'>Last 4</p>
                        <p className='text-lg font-mono tracking-wider'>
                          {card.lastFourDigits || '••••'}
                        </p>
                      </div>
                    </div>

                    {/* Middle Section */}
                    <div className='flex-shrink-0'>
                      <p className='font-semibold text-lg'>{card.cardName}</p>
                    </div>

                    {/* Bottom Section */}
                    <div className='flex justify-between items-end gap-2'>
                      <div className='flex-1 min-w-0'>
                        <p className='text-xs opacity-75 mb-1'>
                          Unbilled Spends
                        </p>
                        <p className='text-xl font-bold truncate'>
                          {formatCurrency(unbilledSpend, 'INR')}
                        </p>
                      </div>
                      {card.expiryDate && (
                        <div className='text-right flex-shrink-0'>
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

                    {/* Decorative Elements - adjusted for smaller card */}
                    <div className='absolute -top-2 -right-2 opacity-10 pointer-events-none'>
                      <div className='w-20 h-20 rounded-full bg-white'></div>
                    </div>
                    <div className='absolute -bottom-4 -right-6 opacity-5 pointer-events-none'>
                      <div className='w-16 h-16 rounded-full bg-white'></div>
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

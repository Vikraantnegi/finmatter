'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CardDetectionResult } from '@/services/cardDetectionService';
import { getCardColors } from '@/lib/cardColors';

interface CardPreviewProps {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  network: CardDetectionResult['network'];
  bankName?: string;
  isFlipped?: boolean;
  className?: string;
  cvv?: string;
}

const CardPreview = ({
  cardNumber = '',
  cardholderName = '',
  expiryDate = '',
  network = 'Unknown',
  bankName,
  isFlipped = false,
  className = '',
  cvv = '',
}: CardPreviewProps) => {
  const cardColors = useMemo(() => {
    const colors = getCardColors(bankName || 'Unknown Bank');
    return colors;
  }, [bankName]);

  const displayNumber = useMemo(() => {
    if (!cardNumber) return '1234 5678 9012 3456';
    const formatted = cardNumber.replace(/\s/g, '');
    const masked =
      formatted.slice(0, -4).replace(/\d/g, '•') + formatted.slice(-4);
    return masked.match(/.{1,4}/g)?.join(' ') || masked;
  }, [cardNumber]);

  const displayCVV = useMemo(() => {
    if (!cvv) return '•••';
    return '•'.repeat(cvv.length);
  }, [cvv]);

  const networkDisplay = network !== 'Unknown' ? network : 'CARD';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative w-full h-60 ${className}`}
    >
      {/* Card Container with 3D flip effect */}
      <div className='relative w-full h-full' style={{ perspective: '1000px' }}>
        <motion.div
          className='relative w-full h-full'
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Card Front */}
          <div
            className='absolute inset-0 rounded-md shadow-2xl overflow-hidden'
            style={{
              background: `linear-gradient(135deg, ${cardColors.primary} 0%, ${cardColors.secondary} 100%)`,
              transform: 'rotateY(0deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Shine effect overlay */}
            <div className='absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none' />

            <div className='relative h-full p-6 flex flex-col justify-between text-white'>
              {/* Top Section */}
              <div className='flex justify-between items-start'>
                <div className='space-y-3'>
                  {/* Network Badge */}
                  <div
                    className='bg-white/95 rounded px-3 py-1.5 w-fit'
                    style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
                  >
                    <span
                      className='text-xs font-bold uppercase tracking-wide'
                      style={{ color: cardColors.primary }}
                    >
                      {networkDisplay.slice(0, 4)}
                    </span>
                  </div>
                </div>

                {/* Bank Name */}
                <div className='text-right'>
                  <p className='text-xs font-semibold tracking-wide opacity-90'>
                    {bankName ? bankName.toUpperCase() : 'BANK NAME'}
                  </p>
                </div>
              </div>

              {/* Middle Section - Card Number */}
              <div className='flex justify-center py-2'>
                <p
                  className='text-2xl font-semibold tracking-wider'
                  style={{ letterSpacing: '2px' }}
                >
                  {displayNumber}
                </p>
              </div>

              {/* Bottom Section */}
              <div className='flex justify-between items-end'>
                <div>
                  <p className='text-sm font-semibold'>
                    {cardholderName.toUpperCase() || 'JOHN DOE'}
                  </p>
                </div>

                <div className='text-right'>
                  <p className='text-sm font-semibold'>
                    {expiryDate || 'MM/YY'}
                  </p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className='absolute top-4 left-4 w-16 h-16 bg-white/5 rounded-full blur-2xl pointer-events-none' />
              <div className='absolute bottom-4 right-4 w-20 h-20 bg-white/5 rounded-full blur-2xl pointer-events-none' />
            </div>
          </div>

          {/* Card Back */}
          <div
            className='absolute inset-0 rounded-md shadow-2xl overflow-hidden'
            style={{
              background: `linear-gradient(135deg, ${cardColors.primary} 0%, ${cardColors.secondary} 100%)`,
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div
              style={{
                transformStyle: 'flat',
                width: '100%',
                height: '100%',
              }}
            >
              <div className='relative h-full p-6 pt-0 flex flex-col justify-between'>
                {/* Magnetic Strip */}
                <div className='absolute top-6 left-0 right-0 h-12 bg-black' />

                {/* CVV Section */}
                <div className='mt-24 space-y-4'>
                  <div className='flex items-center justify-end pr-8'>
                    <div
                      className='bg-white/95 rounded px-4 py-3 min-w-[120px]'
                      style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
                    >
                      <p className='text-xs text-gray-500 mb-1 uppercase tracking-wider'>
                        CVV
                      </p>
                      <p
                        className='text-lg font-bold tracking-widest'
                        style={{ color: cardColors.primary }}
                      >
                        {displayCVV}
                      </p>
                    </div>
                  </div>

                  {/* Card Notice */}
                  <div className='flex items-center justify-center mt-auto pb-6'>
                    <p className='text-xs text-white/70 text-center max-w-xs'>
                      This card is the property of the cardholder and must be
                      surrendered upon request
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className='absolute top-4 right-4 w-12 h-12 bg-white/5 rounded-full blur-2xl pointer-events-none' />
              <div className='absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full blur-2xl pointer-events-none' />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CardPreview;

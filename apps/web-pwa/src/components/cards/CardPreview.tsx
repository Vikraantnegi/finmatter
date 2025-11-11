'use client';

import { useState } from 'react';
import Image from 'next/image';
import { RefreshCw } from 'lucide-react';
import type { Card, Bank, CardMetadata } from '@finmatter/types';
import { cn } from '@/lib/utils';
import { getNetworkIconUrl, type NetworkIconVariant } from '@/lib/networkIcons';

interface CardPreviewProps {
  card:
    | Card
    | {
        lastFourDigits: string;
        cardHolderName?: string;
        expiryMonth?: number;
        expiryYear?: number;
        bank?: Bank;
        cardMetadata?: CardMetadata;
      };
  showCVV?: boolean;
  showFlipAction?: boolean;
  networkIconVariant?: NetworkIconVariant;
  className?: string;
}

export const CardPreview = ({
  card,
  showCVV = false,
  showFlipAction = true,
  networkIconVariant = 'flat-rounded',
  className,
}: CardPreviewProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Get card colors from cardMetadata or bank, with fallback
  const primaryColor =
    card.cardMetadata?.primaryColor || card.bank?.primaryColor || '#3B82F6';
  const secondaryColor =
    card.cardMetadata?.secondaryColor || card.bank?.secondaryColor || '#6366F1';

  // Format card number with spaces
  const formattedNumber = `**** **** **** ${card.lastFourDigits}`;

  // Format expiry date
  const formattedExpiry =
    card.expiryMonth && card.expiryYear
      ? `${String(card.expiryMonth).padStart(2, '0')}/${String(
          card.expiryYear,
        ).slice(-2)}`
      : 'MM/YY';

  // Get network from card or cardMetadata
  const network = card.cardMetadata?.network || (card as Card).network;

  // Get network logo URL
  const networkLogoUrl = getNetworkIconUrl(network, networkIconVariant);

  // Extract height class if provided, otherwise default to h-48
  const heightMatch = className?.match(/h-\d+/);
  const heightClass = heightMatch
    ? heightMatch[0]
    : 'h-[-webkit-fill-available]';
  const otherClasses = className?.replace(/h-\d+/g, '').trim() || '';

  return (
    <div
      className={cn('relative w-full', otherClasses)}
      style={{ perspective: '1000px' }}
    >
      {/* Card Container */}
      <div
        className={cn('relative w-full rounded-2xl text-white', heightClass)}
        style={{
          transformStyle: 'preserve-3d',
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.7s',
        }}
      >
        {/* Front of Card */}
        <div
          className='absolute inset-0 flex flex-col justify-between p-6 rounded-2xl'
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
          }}
        >
          {/* Top Section */}
          <div className='flex items-center justify-between'>
            {/* Bank Logo */}
            {card.bank?.logoUrl ? (
              <div className='relative w-16 h-16'>
                <Image
                  src={card.bank.logoUrl}
                  alt={card.bank.displayName || card.bank.name}
                  fill
                  className='object-contain'
                />
              </div>
            ) : (
              <div className='text-2xl font-bold'>
                {card.bank?.displayName || card.bank?.name || 'Bank'}
              </div>
            )}

            {/* Network Logo */}
            {networkLogoUrl && (
              <div className='relative w-12 h-12'>
                <Image
                  src={networkLogoUrl}
                  alt={network || 'Network'}
                  fill
                  className='object-contain'
                />
              </div>
            )}
          </div>

          {/* Middle Section - Card Number */}
          <div className='space-y-4'>
            <div className='text-2xl font-mono tracking-wider'>
              {formattedNumber}
            </div>

            {/* Card Name */}
            {card.cardMetadata?.displayName && (
              <div className='text-lg font-semibold'>
                {card.cardMetadata.displayName}
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-xs text-white/70 mb-1'>Card Holder</div>
              <div className='text-sm font-medium uppercase'>
                {card.cardHolderName || 'JOHN DOE'}
              </div>
            </div>
            <div>
              <div className='text-xs text-white/70 mb-1'>Expiry</div>
              <div className='text-sm font-medium'>{formattedExpiry}</div>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div
          className='absolute inset-0 flex flex-col justify-between p-6 rounded-2xl'
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Magnetic Stripe */}
          <div className='h-12 bg-black/30 rounded-lg mb-4' />

          {/* CVV Section */}
          <div className='space-y-2'>
            <div className='text-xs text-white/70'>CVV</div>
            <div className='h-12 bg-white/20 rounded-lg flex items-center justify-center px-4'>
              <span className='text-lg font-mono tracking-wider'>
                {showCVV ? '123' : '***'}
              </span>
            </div>
          </div>

          {/* Flip Indicator */}
          <div className='flex items-center justify-center gap-2 text-white/70'>
            <RefreshCw className='w-4 h-4' />
            <span className='text-xs'>Tap to flip</span>
          </div>
        </div>
      </div>

      {/* Flip Button */}
      {showFlipAction && (
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className='absolute -bottom-8 right-0 flex flex-col items-center gap-1 text-gray-400 hover:text-gray-300 transition-colors'
        >
          <div className='w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center'>
            <RefreshCw className='w-4 h-4' />
          </div>
          <span className='text-xs'>Flip</span>
        </button>
      )}
    </div>
  );
};

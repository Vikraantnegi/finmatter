'use client';

import Image from 'next/image';
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
  networkIconVariant?: NetworkIconVariant;
  className?: string;
}

export const CardPreview = ({
  card,
  networkIconVariant = 'flat-rounded',
  className,
}: CardPreviewProps) => {
  const primaryColor =
    card.cardMetadata?.primaryColor || card.bank?.primaryColor || '#3B82F6';
  const secondaryColor =
    card.cardMetadata?.secondaryColor || card.bank?.secondaryColor || '#6366F1';

  const formattedNumber = `**** **** **** ${card.lastFourDigits}`;
  const formattedExpiry =
    card.expiryMonth && card.expiryYear
      ? `${String(card.expiryMonth).padStart(2, '0')}/${String(
          card.expiryYear,
        ).slice(-2)}`
      : 'MM/YY';

  const network = card.cardMetadata?.network || (card as Card).network;
  const networkLogoUrl = getNetworkIconUrl(network, networkIconVariant);

  return (
    <div
      className={cn(
        'relative w-full rounded-2xl text-white p-6 flex flex-col justify-between min-h-[180px]',
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      }}
    >
      <div className='flex items-center justify-between'>
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

      <div className='space-y-4'>
        <div className='text-2xl font-mono tracking-wider'>
          {formattedNumber}
        </div>
        {card.cardMetadata?.displayName && (
          <div className='text-lg font-semibold'>
            {card.cardMetadata.displayName}
          </div>
        )}
      </div>

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
  );
};

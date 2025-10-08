'use client';

import { Card } from '@finmatter/types';
import { cardSearchService } from '@finmatter/cc-engine';
import { cn } from '@/lib/utils';

interface CreditCardVisualProps {
  card: Card;
  className?: string;
}

export function CreditCardVisual({ card, className }: CreditCardVisualProps) {
  // Get card metadata if available
  const metadata = card.cardMetadataId
    ? cardSearchService.getCardById(card.cardMetadataId)
    : null;

  // Determine colors - prioritize metadata, then stored colors, then defaults
  const primaryColor = metadata?.primaryColor || card.primaryColor || '#1e40af';
  const secondaryColor =
    metadata?.secondaryColor || card.secondaryColor || '#3b82f6';

  // Create gradient
  const gradientStyle = {
    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
  };

  // Get card name and bank
  const cardName = metadata?.cardName || card.cardName || 'Credit Card';
  const bankName = metadata
    ? cardSearchService.getBankById(metadata.bankId)?.name
    : card.bankName || 'Bank';

  // Get network logo
  const getNetworkLogo = (network: string) => {
    switch (network?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      case 'rupay':
        return '💳';
      default:
        return '💳';
    }
  };

  return (
    <div
      className={cn(
        'relative h-48 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-105',
        className,
      )}
      style={gradientStyle}
    >
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-10'>
        <div className='absolute top-4 right-4 text-4xl opacity-20'>
          {getNetworkLogo(card.network || 'visa')}
        </div>
        <div className='absolute bottom-4 right-4 text-6xl opacity-10'>
          {getNetworkLogo(card.network || 'visa')}
        </div>
      </div>

      {/* Card Content */}
      <div className='relative h-full p-6 flex flex-col justify-between text-white'>
        {/* Top Row */}
        <div className='flex justify-between items-start'>
          <div className='flex-1'>
            <p className='text-sm opacity-90 mb-1'>{bankName}</p>
            <h3 className='text-lg font-bold leading-tight'>{cardName}</h3>
          </div>
          <div className='text-right'>
            <div className='text-xs opacity-80 mb-1'>VALID THRU</div>
            <div className='text-sm font-mono'>
              {card.expiryDate
                ? `${`${new Date(card.expiryDate).getMonth() + 1}`.padStart(2, '0')}/${`${new Date(card.expiryDate).getFullYear()}`.slice(-2)}`
                : 'MM/YY'}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className='flex justify-between items-end'>
          <div className='flex-1'>
            <div className='text-xs opacity-80 mb-1'>CARD NUMBER</div>
            <div className='text-lg font-mono tracking-wider'>
              {card.lastFourDigits
                ? `**** **** **** ${card.lastFourDigits}`
                : '**** **** **** ****'}
            </div>
          </div>
          <div className='text-right'>
            <div className='text-xs opacity-80 mb-1'>LIMIT</div>
            <div className='text-sm font-semibold'>
              ₹{((card.creditLimit || 0) / 100000).toFixed(0)}L
            </div>
          </div>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200' />
    </div>
  );
}

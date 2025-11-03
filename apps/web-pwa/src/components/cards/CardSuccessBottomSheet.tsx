'use client';

import { Check } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { CardPreview } from './CardPreview';
import type { Card } from '@finmatter/types';

interface CardSuccessBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  card: Card;
}

export const CardSuccessBottomSheet = ({
  isOpen,
  onClose,
  onContinue,
  card,
}: CardSuccessBottomSheetProps) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} dark={true}>
      <div className='px-6 py-8 space-y-6 flex flex-col items-center'>
        {/* Success Icon */}
        <div className='w-20 h-20 rounded-full bg-green-500 flex items-center justify-center'>
          <Check className='w-12 h-12 text-white' />
        </div>

        {/* Title */}
        <div className='text-center space-y-2'>
          <h2 className='text-2xl font-bold text-white'>Card Added!</h2>
          <p className='text-gray-400 text-sm'>
            Your{' '}
            {card.bank?.displayName ||
              card.bank?.name ||
              card.cardMetadata?.displayName ||
              'bank'}{' '}
            card ending in {card.lastFourDigits} is now ready to use with
            FinMatter.
          </p>
        </div>

        {/* Card Preview */}
        <div className='w-full py-4'>
          <CardPreview
            card={{
              ...card,
              lastFourDigits: card.lastFourDigits,
              cardHolderName: card.cardHolderName,
              expiryMonth: card.expiryMonth,
              expiryYear: card.expiryYear,
              bank: card.bank,
              cardMetadata: card.cardMetadata,
            }}
            showCVV={false}
          />
        </div>

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          className='w-full h-14 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all'
        >
          Continue to Dashboard
        </Button>
      </div>
    </BottomSheet>
  );
};

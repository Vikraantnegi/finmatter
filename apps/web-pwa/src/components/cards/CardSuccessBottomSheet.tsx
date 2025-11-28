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
      <div className='px-6 pt-8 pb-12 space-y-8 flex flex-col items-center'>
        {/* Success Icon */}
        <div className='w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-[0_18px_40px_-20px_rgba(59,130,246,0.9)]'>
          <Check className='w-12 h-12 text-white drop-shadow-[0_6px_18px_rgba(59,130,246,0.45)]' />
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
        <div className='w-full rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-900/30 to-slate-900/80 p-4 pb-6 shadow-[0_28px_48px_-32px_rgba(15,23,42,0.8)] border border-slate-800/60 backdrop-blur'>
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
            className='h-52 w-full'
            networkIconVariant='logo'
          />
        </div>

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          className='w-full h-14 bg-primary hover:bg-primary/85 text-white font-semibold rounded-xl transition-all'
        >
          Continue to Dashboard
        </Button>
      </div>
    </BottomSheet>
  );
};

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { CardLoader } from './CardLoader';
import { apiClient } from '@/lib/apiClient';
import { CARD_ROUTES } from '@/constants/apiRoutes';
import { Lock } from 'lucide-react';
import type { Card } from '@finmatter/types';
import { useDebounce } from '@/hooks/useDebounce';

// Form validation schema
const addCardSchema = z.object({
  cardNumber: z
    .string()
    .min(13, 'Card number must be at least 13 digits')
    .max(19, 'Card number must be at most 19 digits')
    .regex(/^\d+$/, 'Card number must contain only digits'),
  cardHolderName: z
    .string()
    .min(1, 'Card holder name is required')
    .max(100, 'Card holder name must be less than 100 characters'),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int().min(2000).max(2099),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
});

type AddCardFormData = z.infer<typeof addCardSchema>;

interface BinLookupResult {
  success: boolean;
  detected: boolean;
  bank?: { id: string; name: string };
  network?: string;
  cardType?: string;
  cardMetadata?: {
    id: string;
    displayName: string;
    bank: any;
    network: any;
    benefits: any[];
    offers: any[];
  };
  source?: 'internal' | 'binlist_api';
}

interface AddCardBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (card: Card) => void; // This will be used to show the success bottom sheet
}

export const AddCardBottomSheet = ({
  isOpen,
  onClose,
  onSuccess,
}: AddCardBottomSheetProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUpBin, setIsLookingUpBin] = useState(false);
  const [binLookupResult, setBinLookupResult] =
    useState<BinLookupResult | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<AddCardFormData>({
    resolver: zodResolver(addCardSchema),
    mode: 'onChange',
    defaultValues: {
      cardNumber: '',
      cardHolderName: '',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '',
    },
  });

  const cardNumber = watch('cardNumber');

  // Debounce card number for BIN lookup
  const debouncedCardNumber = useDebounce(cardNumber, 500);

  const performBinLookup = useCallback(async (bin: string) => {
    if (!/^\d{6}$/.test(bin)) return;

    try {
      setIsLookingUpBin(true);
      const result = await apiClient.get<BinLookupResult>(
        `${CARD_ROUTES.BIN_LOOKUP}?bin=${bin}`,
      );
      setBinLookupResult(result);
    } catch (error) {
      console.error('BIN lookup error:', error);
      setBinLookupResult(null);
    } finally {
      setIsLookingUpBin(false);
    }
  }, []);

  // Extract BIN from card number and perform lookup
  useEffect(() => {
    const cleanCardNumber = debouncedCardNumber?.replace(/\D/g, '') || '';

    if (cleanCardNumber.length >= 6) {
      const bin = cleanCardNumber.substring(0, 6);
      performBinLookup(bin);
    } else {
      setBinLookupResult(null);
      setIsLookingUpBin(false);
    }
  }, [debouncedCardNumber, performBinLookup]);

  // Handle expiry date input
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
    }
    e.target.value = value;

    const [month, year] = value.split('/');
    if (month) {
      const monthNum = parseInt(month, 10);
      if (monthNum >= 1 && monthNum <= 12) {
        setValue('expiryMonth', monthNum, { shouldValidate: true });
      }
    }
    if (year && year.length === 2) {
      const yearNum = parseInt(`20${year}`, 10);
      setValue('expiryYear', yearNum, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: AddCardFormData) => {
    try {
      setIsSubmitting(true);

      // Call POST /api/cards
      const response = await apiClient.post<{
        success: boolean;
        card: Card;
      }>(CARD_ROUTES.ADD, {
        cardNumber: data.cardNumber,
        cardHolderName: data.cardHolderName,
        expiryMonth: data.expiryMonth,
        expiryYear: data.expiryYear,
        cvv: data.cvv,
        // Include BIN lookup results if available
        bankId: binLookupResult?.bank?.id,
        cardMetadataId: binLookupResult?.cardMetadata?.id,
      });

      if (response.success && response.card) {
        reset();
        setBinLookupResult(null);
        // Close add card sheet and show success sheet
        onClose();
        // Small delay to allow add sheet to close
        setTimeout(() => {
          onSuccess(response.card);
        }, 300);
      }
    } catch (error) {
      console.error('Error adding card:', error);
      setIsSubmitting(false);
      // Error handling is done by apiClient (toast notifications)
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={isSubmitting ? 'Adding Card...' : 'Add New Card'}
      dark={true}
    >
      {isSubmitting ? (
        <div className='flex flex-col items-center justify-center min-h-[400px] space-y-6 p-6'>
          <CardLoader size='lg' />
          <p className='text-gray-400 text-center'>
            Securely adding your card...
          </p>
        </div>
      ) : (
        <div className='px-6 py-4 space-y-6'>
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
            {/* Card Number */}
            <div>
              <label className='block text-sm font-medium text-white mb-2'>
                Card Number
              </label>
              <div className='relative'>
                <input
                  {...register('cardNumber')}
                  type='text'
                  placeholder='1234 5678 9012 3456'
                  maxLength={19}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    setValue('cardNumber', cleaned, { shouldValidate: true });
                    // Format display
                    const formatted =
                      cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
                    e.target.value = formatted;
                  }}
                  className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors font-mono tracking-wider'
                  autoComplete='cc-number'
                />
                {/* BIN Lookup Indicator */}
                {isLookingUpBin && (
                  <div className='absolute right-4 top-1/2 -translate-y-1/2'>
                    <div className='w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin' />
                  </div>
                )}
              </div>
              {errors.cardNumber && (
                <p className='mt-1 text-sm text-red-400'>
                  {errors.cardNumber.message}
                </p>
              )}
              {/* BIN Lookup Result */}
              {binLookupResult?.detected && binLookupResult.bank && (
                <p className='mt-1 text-sm text-green-400'>
                  Detected: {binLookupResult.bank.name}
                </p>
              )}
            </div>

            {/* Card Holder Name */}
            <div>
              <label className='block text-sm font-medium text-white mb-2'>
                Card Holder Name
              </label>
              <input
                {...register('cardHolderName')}
                type='text'
                placeholder='John Doe'
                className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
                autoComplete='cc-name'
              />
              {errors.cardHolderName && (
                <p className='mt-1 text-sm text-red-400'>
                  {errors.cardHolderName.message}
                </p>
              )}
            </div>

            {/* Expiry and CVV */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-white mb-2'>
                  Expiry Date
                </label>
                <input
                  type='text'
                  placeholder='MM/YY'
                  maxLength={5}
                  onChange={handleExpiryChange}
                  className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
                  autoComplete='cc-exp'
                />
                {(errors.expiryMonth || errors.expiryYear) && (
                  <p className='mt-1 text-sm text-red-400'>
                    {errors.expiryMonth?.message || errors.expiryYear?.message}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-white mb-2'>
                  CVV
                </label>
                <input
                  {...register('cvv')}
                  type='text'
                  placeholder='123'
                  maxLength={4}
                  className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
                  autoComplete='cc-csc'
                />
                {errors.cvv && (
                  <p className='mt-1 text-sm text-red-400'>
                    {errors.cvv.message}
                  </p>
                )}
              </div>
            </div>

            {/* Security Message */}
            <div className='flex items-center gap-2 text-sm text-gray-400'>
              <Lock className='w-4 h-4' />
              <span>Your information is securely encrypted.</span>
            </div>

            {/* Submit Button */}
            <Button
              type='submit'
              disabled={!isValid || isSubmitting}
              className='w-full h-14 bg-primary hover:opacity-90 text-white font-semibold rounded-xl disabled:opacity-40 transition-all'
              loading={isSubmitting}
            >
              Add Card
            </Button>
          </form>
        </div>
      )}
    </BottomSheet>
  );
};

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { Controller, useForm } from 'react-hook-form';
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
import { getNetworkIconUrl } from '@/lib/networkIcons';

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
    bank: {
      id: string;
      name: string;
      displayName?: string | null;
      logoUrl?: string | null;
      logoWithNameUrl?: string | null;
    } | null;
    network: {
      id: string;
      name: string;
      displayName?: string | null;
    } | null;
    benefits: Record<string, unknown>[];
    offers: Record<string, unknown>[];
  };
  source?: 'internal' | 'binlist_api';
}

interface AddCardBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (card: Card) => void;
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
  const [lastLookedUpBin, setLastLookedUpBin] = useState<string | null>(null);
  const [inFlightBin, setInFlightBin] = useState<string | null>(null);
  const normalizedNetwork = binLookupResult?.network?.toLowerCase();
  const networkLogoUrl = getNetworkIconUrl(normalizedNetwork, 'logo');
  const formatCardNumberDisplay = (value?: string) =>
    value && value.length > 0
      ? (value.match(/.{1,4}/g)?.join(' ') ?? value)
      : '';

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
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
      setInFlightBin(bin);
      const result = await apiClient.get<BinLookupResult>(
        `${CARD_ROUTES.BIN_LOOKUP}?bin=${bin}`,
      );
      setBinLookupResult(result);
      clearErrors('cvv');
    } catch (error) {
      console.error('BIN lookup error:', error);
      setBinLookupResult(null);
    } finally {
      setIsLookingUpBin(false);
      setInFlightBin(null);
      setLastLookedUpBin(bin);
    }
  }, []);

  // Extract BIN from card number and perform lookup
  useEffect(() => {
    const cleanCardNumber = debouncedCardNumber?.replace(/\D/g, '') || '';

    if (cleanCardNumber.length >= 6) {
      const bin = cleanCardNumber.substring(0, 6);
      if (bin !== lastLookedUpBin && bin !== inFlightBin) {
        performBinLookup(bin);
      }
    } else {
      setBinLookupResult(null);
      setIsLookingUpBin(false);
      setLastLookedUpBin(null);
      setInFlightBin(null);
    }
  }, [debouncedCardNumber, performBinLookup, lastLookedUpBin, inFlightBin]);

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
    const normalizedNetwork = binLookupResult?.network?.toLowerCase();
    if (normalizedNetwork === 'amex' && data.cvv.trim().length !== 4) {
      setError('cvv', {
        type: 'manual',
        message: 'American Express CVV must be 4 digits',
      });
      return;
    }

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
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;
        const errorCode =
          apiError?.code || apiError?.error?.code || apiError?.errorCode;
        const message =
          apiError?.error ||
          apiError?.message ||
          apiError?.error?.message ||
          error.message;

        if (
          (errorCode &&
            String(errorCode).toUpperCase().includes('INVALID_CVV')) ||
          (typeof message === 'string' && message.toLowerCase().includes('cvv'))
        ) {
          setError('cvv', {
            type: 'server',
            message:
              typeof message === 'string'
                ? message
                : 'Please double-check the CVV for this network.',
          });
        }
      }
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
        <div className='px-6 py-4 pb-10 space-y-6'>
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
            {/* Card Number */}
            <div>
              <label className='block text-sm font-medium text-white mb-2'>
                Card Number
              </label>
              <div className='relative'>
                <Controller
                  name='cardNumber'
                  control={control}
                  render={({
                    field: { value, onChange, onBlur, ref, name },
                  }) => (
                    <input
                      name={name}
                      ref={ref}
                      onBlur={onBlur}
                      type='text'
                      placeholder='1234 5678 9012 3456'
                      value={formatCardNumberDisplay(value)}
                      inputMode='numeric'
                      maxLength={23}
                      onChange={event => {
                        const cleaned = event.target.value
                          .replace(/\D/g, '')
                          .slice(0, 19);

                        onChange(cleaned);
                        setValue('cardNumber', cleaned, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }}
                      className='w-full h-14 pl-4 pr-12 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-base text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors font-mono tracking-wider'
                      autoComplete='cc-number'
                    />
                  )}
                />
                {/* BIN Lookup Indicator */}
                <div className='absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8'>
                  {isLookingUpBin ? (
                    <div className='w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin' />
                  ) : (
                    networkLogoUrl && (
                      <Image
                        src={networkLogoUrl}
                        alt={`${binLookupResult?.network ?? 'card'} network`}
                        fill
                        sizes='32px'
                        className='object-contain'
                      />
                    )
                  )}
                </div>
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
                className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-base text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
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
                  className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-base text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
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
                <Controller
                  name='cvv'
                  control={control}
                  rules={{
                    validate: value => {
                      const trimmed = value?.replace(/\D/g, '') || '';
                      if (normalizedNetwork === 'amex') {
                        return (
                          trimmed.length === 4 ||
                          'American Express CVV must be 4 digits'
                        );
                      }
                      return (
                        trimmed.length === 3 ||
                        trimmed.length === 4 ||
                        'CVV must be 3 digits (4 for American Express)'
                      );
                    },
                  }}
                  render={({ field: { value, onChange, onBlur, ref } }) => (
                    <input
                      ref={ref}
                      onBlur={onBlur}
                      type='text'
                      value={value || ''}
                      placeholder={
                        normalizedNetwork === 'amex' ? '1234' : '123'
                      }
                      maxLength={normalizedNetwork === 'amex' ? 4 : 3}
                      onChange={event => {
                        const cleaned = event.target.value.replace(/\D/g, '');
                        const limited =
                          normalizedNetwork === 'amex'
                            ? cleaned.slice(0, 4)
                            : cleaned.slice(0, 3);
                        onChange(limited);
                        setValue('cvv', limited, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                      className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-base text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
                      autoComplete='cc-csc'
                    />
                  )}
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
              className='w-full h-14 bg-primary hover:opacity-90 text-white text-base font-semibold rounded-xl disabled:opacity-40 transition-all'
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

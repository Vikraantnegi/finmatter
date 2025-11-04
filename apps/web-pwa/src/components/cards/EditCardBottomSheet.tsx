'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import { CARD_ROUTES } from '@/constants/apiRoutes';
import type { Card } from '@finmatter/types';

// Form validation schema
const editCardSchema = z.object({
  cardHolderName: z
    .string()
    .min(1, 'Card holder name is required')
    .max(100, 'Card holder name must be less than 100 characters')
    .optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2000).max(2099).optional(),
  billingDay: z.number().int().min(1).max(31).optional().nullable(),
  issueDate: z.string().optional().nullable(),
  creditLimit: z.number().nonnegative().optional().nullable(),
  availableCredit: z.number().nonnegative().optional().nullable(),
  status: z.enum(['active', 'inactive', 'blocked', 'expired']).optional(),
});

type EditCardFormData = z.infer<typeof editCardSchema>;

interface EditCardBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card;
  onSuccess: (card: Card) => void;
}

export const EditCardBottomSheet = ({
  isOpen,
  onClose,
  card,
  onSuccess,
}: EditCardBottomSheetProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<EditCardFormData>({
    resolver: zodResolver(editCardSchema),
    mode: 'onChange',
    defaultValues: {
      cardHolderName: card.cardHolderName || '',
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      billingDay: card.billingDay || null,
      issueDate: card.issueDate
        ? typeof card.issueDate === 'string'
          ? card.issueDate
          : new Date(card.issueDate).toISOString().split('T')[0]
        : null,
      creditLimit: card.creditLimit || null,
      availableCredit: card.availableCredit || null,
      status: card.status,
    },
  });

  // Reset form when card changes
  useEffect(() => {
    reset({
      cardHolderName: card.cardHolderName || '',
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      billingDay: card.billingDay || null,
      issueDate: card.issueDate
        ? typeof card.issueDate === 'string'
          ? card.issueDate
          : new Date(card.issueDate).toISOString().split('T')[0]
        : null,
      creditLimit: card.creditLimit || null,
      availableCredit: card.availableCredit || null,
      status: card.status,
    });
  }, [card, reset]);

  const onSubmit = async (data: EditCardFormData) => {
    try {
      setIsSubmitting(true);

      // Call PUT /api/cards/:id
      const response = await apiClient.put<{
        success: boolean;
        card: Card;
      }>(CARD_ROUTES.UPDATE(card.id), data);

      if (response.success && response.card) {
        // Fetch full card details to get all updated data
        const fullCardResponse = await apiClient.get<{
          success: boolean;
          card: Card;
        }>(CARD_ROUTES.BY_ID(card.id));

        if (fullCardResponse.success && fullCardResponse.card) {
          onSuccess(fullCardResponse.card);
        } else {
          onSuccess(response.card);
        }
      }
    } catch (error) {
      console.error('Error updating card:', error);
      // Error handling is done by apiClient (toast notifications)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title='Edit Card'
      dark={true}
    >
      {isSubmitting ? (
        <div className='flex flex-col items-center justify-center min-h-[400px] space-y-6 p-6'>
          <div className='w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin' />
          <p className='text-gray-400 text-center'>Updating card...</p>
        </div>
      ) : (
        <div className='px-6 py-4 space-y-5'>
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
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
              />
              {errors.cardHolderName && (
                <p className='mt-1 text-sm text-red-400'>
                  {errors.cardHolderName.message}
                </p>
              )}
            </div>

            {/* Expiry Month & Year */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-white mb-2'>
                  Expiry Month
                </label>
                <input
                  {...register('expiryMonth', { valueAsNumber: true })}
                  type='number'
                  min={1}
                  max={12}
                  placeholder='12'
                  className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
                />
                {errors.expiryMonth && (
                  <p className='mt-1 text-sm text-red-400'>
                    {errors.expiryMonth.message}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-white mb-2'>
                  Expiry Year
                </label>
                <input
                  {...register('expiryYear', { valueAsNumber: true })}
                  type='number'
                  min={2000}
                  max={2099}
                  placeholder='2028'
                  className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
                />
                {errors.expiryYear && (
                  <p className='mt-1 text-sm text-red-400'>
                    {errors.expiryYear.message}
                  </p>
                )}
              </div>
            </div>

            {/* Billing Day & Issue Date */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-white mb-2'>
                  Billing Day
                </label>
                <input
                  {...register('billingDay', { valueAsNumber: true })}
                  type='number'
                  min={1}
                  max={31}
                  placeholder='15'
                  className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
                />
                {errors.billingDay && (
                  <p className='mt-1 text-sm text-red-400'>
                    {errors.billingDay.message}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-white mb-2'>
                  Issue Date (Optional)
                </label>
                <input
                  {...register('issueDate')}
                  type='date'
                  className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
                />
                {errors.issueDate && (
                  <p className='mt-1 text-sm text-red-400'>
                    {errors.issueDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Credit Limit & Available Credit */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-white mb-2'>
                  Credit Limit (Optional)
                </label>
                <input
                  {...register('creditLimit', { valueAsNumber: true })}
                  type='number'
                  min={0}
                  step={0.01}
                  placeholder='10000'
                  className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
                />
                {errors.creditLimit && (
                  <p className='mt-1 text-sm text-red-400'>
                    {errors.creditLimit.message}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-white mb-2'>
                  Available Credit (Optional)
                </label>
                <input
                  {...register('availableCredit', { valueAsNumber: true })}
                  type='number'
                  min={0}
                  step={0.01}
                  placeholder='7500'
                  className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
                />
                {errors.availableCredit && (
                  <p className='mt-1 text-sm text-red-400'>
                    {errors.availableCredit.message}
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className='block text-sm font-medium text-white mb-2'>
                Status
              </label>
              <select
                {...register('status')}
                className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white focus:outline-none focus:border-primary transition-colors'
              >
                <option value='active'>Active</option>
                <option value='inactive'>Inactive</option>
                <option value='blocked'>Blocked</option>
                <option value='expired'>Expired</option>
              </select>
              {errors.status && (
                <p className='mt-1 text-sm text-red-400'>
                  {errors.status.message}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className='grid grid-cols-2 gap-4 pt-4'>
              <Button
                type='button'
                onClick={onClose}
                variant='outline'
                className='w-full border-gray-600 text-white hover:bg-gray-700'
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={!isValid || isSubmitting}
                className='w-full bg-primary hover:opacity-90 text-white font-semibold rounded-xl disabled:opacity-40 transition-all'
                loading={isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}
    </BottomSheet>
  );
};

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

const nameSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .max(50, 'Last name must be less than 50 characters')
    .optional(),
});

type NameFormData = z.infer<typeof nameSchema>;

interface NameStepProps {
  onNext: () => void;
  onUpdateFormData: (updates: { firstName: string; lastName?: string }) => void;
}

export default function NameStep({ onNext, onUpdateFormData }: NameStepProps) {
  const { setUserName } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: NameFormData) => {
    try {
      setIsLoading(true);
      // Update both the auth store and the onboarding form data
      setUserName(data.firstName.trim());
      onUpdateFormData({ 
        firstName: data.firstName.trim(),
        lastName: data.lastName?.trim() || undefined
      });
      onNext();
    } catch (error) {
      console.error('Error saving name:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='max-w-md w-full space-y-8'>
        {/* Header */}
        <div className='text-center space-y-4'>
          <div className='flex justify-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center'>
              <span className='text-white text-xl font-bold'>👤</span>
            </div>
          </div>
          <h1 className='text-2xl font-bold text-gray-900'>
            What&apos;s your name?
          </h1>
          <p className='text-gray-600'>
            We&apos;d love to personalize your experience
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div>
            <label
              htmlFor='firstName'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              First Name *
            </label>
            <input
              {...register('firstName')}
              type='text'
              id='firstName'
              placeholder='Enter your first name'
              className='input w-full'
              autoFocus
            />
            {errors.firstName && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='lastName'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Last Name (Optional)
            </label>
            <input
              {...register('lastName')}
              type='text'
              id='lastName'
              placeholder='Enter your last name'
              className='input w-full'
            />
            {errors.lastName && (
              <p className='mt-1 text-sm text-red-600'>
                {errors.lastName.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className='space-y-3'>
            <Button
              type='submit'
              disabled={!isValid || isLoading}
              size='lg'
              className='w-full'
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

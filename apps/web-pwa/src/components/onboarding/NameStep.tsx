'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

const nameSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
});

type NameFormData = z.infer<typeof nameSchema>;

interface NameStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function NameStep({ onNext, onSkip }: NameStepProps) {
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
      setUserName(data.name.trim());
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
            What should we call you?
          </h1>
          <p className='text-gray-600'>
            We&apos;d love to personalize your experience
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Your Name
            </label>
            <input
              {...register('name')}
              type='text'
              id='name'
              placeholder='Enter your name'
              className='input w-full'
              autoFocus
            />
            {errors.name && (
              <p className='mt-1 text-sm text-red-600'>{errors.name.message}</p>
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

            <Button
              type='button'
              variant='outline'
              onClick={onSkip}
              size='lg'
              className='w-full'
            >
              Skip for now
            </Button>
          </div>
        </form>

        {/* Progress Indicator */}
        <div className='flex justify-center space-x-2'>
          <div className='w-3 h-3 bg-gray-200 rounded-full'></div>
          <div className='w-3 h-3 bg-primary-500 rounded-full'></div>
          <div className='w-3 h-3 bg-gray-200 rounded-full'></div>
          <div className='w-3 h-3 bg-gray-200 rounded-full'></div>
          <div className='w-3 h-3 bg-gray-200 rounded-full'></div>
        </div>
      </div>
    </div>
  );
}

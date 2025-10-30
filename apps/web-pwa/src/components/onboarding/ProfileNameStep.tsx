'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';

const nameSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
});

type NameFormData = z.infer<typeof nameSchema>;

interface ProfileNameStepProps {
  onNext: (data: { firstName: string; lastName?: string }) => void;
}

export default function ProfileNameStep({ onNext }: ProfileNameStepProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    mode: 'onChange',
  });

  const fullName = watch('fullName');

  const onSubmit = async (data: NameFormData) => {
    try {
      setIsLoading(true);

      // Split full name into first and last name
      const nameParts = data.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName =
        nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

      onNext({ firstName, lastName });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center px-4 min-h-[calc(100vh-6rem)]'>
      <div className='max-w-md w-full space-y-8'>
        {/* Header */}
        <div className='text-center space-y-3'>
          <h1 className='text-3xl font-bold text-white'>
            What&apos;s your full name?
          </h1>
          <p className='text-base text-gray-400'>
            Let&apos;s start by getting to know you better
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div>
            <input
              {...register('fullName')}
              type='text'
              placeholder='First and last name'
              className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors'
              autoFocus
            />
            {errors.fullName && (
              <p className='mt-2 text-sm text-error-400'>
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Continue Button */}
          <Button
            type='submit'
            disabled={!isValid || isLoading}
            className='w-full h-14 bg-primary hover:opacity-90 text-white font-semibold rounded-xl disabled:opacity-40 transition-all'
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </form>

        {/* Visual Preview - Show name as it's typed */}
        {fullName && fullName.trim().length > 0 && (
          <div className='mt-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700'>
            <p className='text-xs text-gray-500 mb-1'>Preview</p>
            <p className='text-lg text-white font-medium'>{fullName}</p>
          </div>
        )}
      </div>
    </div>
  );
}

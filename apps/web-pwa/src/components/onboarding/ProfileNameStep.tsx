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

const ProfileNameStep = ({ onNext }: ProfileNameStepProps) => {
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
    <div className='flex items-center justify-center min-h-[calc(100vh-6rem)]'>
      <div className='max-w-lg w-full space-y-8'>
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
              placeholder='Name'
              className='w-full h-14 px-4 bg-gray-800/50 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors autofill:bg-gray-800/50 autofill:text-white'
              style={{
                WebkitTextFillColor: 'white',
                WebkitBoxShadow: '0 0 0px 1000px rgb(31 41 55 / 0.5) inset',
              }}
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
      </div>
    </div>
  );
};

export default ProfileNameStep;

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { PhoneInput } from '@/components/forms/PhoneInput';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { authService } from '@/services/authService';

const phoneSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const phoneValue = watch('phone');

  // Debug logging
  useEffect(() => {
    console.log('LoginPage: Component mounted/updated');
  }, []);

  const onSubmit = async (data: PhoneFormData) => {
    try {
      setIsLoading(true);
      console.log('LoginPage: Starting OTP send process');

      const phoneWithCountryCode = data.phone.startsWith('+91')
        ? data.phone
        : `+91${data.phone}`;

      // Await the async operation to complete
      const response = await authService.sendOTP(phoneWithCountryCode);

      if (response.success) {
        toast.success('OTP sent successfully!');
        // Store phone number securely in session storage
        sessionStorage.setItem('pendingPhoneNumber', phoneWithCountryCode);
        console.log('LoginPage: OTP sent, navigating to verify-otp');

        // Use replace instead of push to avoid back button issues
        // Also add a small delay to ensure toast shows
        setTimeout(() => {
          router.replace('/auth/verify-otp');
        }, 100);
      } else {
        toast.error(response.error || 'Failed to send OTP');
      }
    } catch (error) {
      // Error message is already user-friendly from authService
      toast.error(
        error instanceof Error ? error.message : 'Failed to send OTP',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h2 className='mt-6 text-3xl font-bold text-gray-900'>
            Welcome to FinMatter
          </h2>
          <p className='mt-2 text-sm text-gray-600'>
            Enter your phone number to get started
          </p>
        </div>

        <div className='card'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <PhoneInput
              {...register('phone')}
              error={errors.phone?.message}
              placeholder='Enter your phone number'
            />

            <Button
              type='submit'
              disabled={!phoneValue || isLoading}
              className='w-full'
              size='lg'
            >
              {isLoading ? <LoadingSpinner size='sm' className='mr-2' /> : null}
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-xs text-gray-500'>
              By continuing, you agree to our{' '}
              <a href='#' className='text-primary-600 hover:text-primary-500'>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href='#' className='text-primary-600 hover:text-primary-500'>
                Privacy Policy
              </a>
              . Message and data rates may apply.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

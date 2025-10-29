'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { PhoneInput } from '@/components/forms/PhoneInput';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { authService } from '@/services/authService';
import { AuthRedirectGuard } from '@/components/auth/AuthRedirectGuard';
import { AUTH_COPIES } from '@finmatter/shared/src/constants';
import { Header } from '@/components/layout/Header';

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'Please enter a valid 10-digit phone number')
    .max(10, 'Please enter a valid 10-digit phone number')
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const mode = useMemo(() => {
    const modeParam = searchParams?.get('mode');
    return modeParam === 'signup' ? 'signup' : 'login';
  }, [searchParams]);

  const copies = AUTH_COPIES[mode];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const onSubmit = async (data: PhoneFormData) => {
    try {
      setIsLoading(true);

      const phoneWithCountryCode = `+91${data.phone}`;

      const response = await authService.sendOTP(phoneWithCountryCode);

      if (response.success) {
        toast.success('OTP sent successfully!');
        sessionStorage.setItem('pendingPhoneNumber', phoneWithCountryCode);
        sessionStorage.setItem('authMode', mode);

        setTimeout(() => {
          router.replace('/auth/verify-otp');
        }, 100);
      } else {
        toast.error(response.error?.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send OTP',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    const newMode = mode === 'login' ? 'signup' : 'login';
    router.push(`/auth/login?mode=${newMode}`);
  };

  return (
    <AuthRedirectGuard>
      <div className='min-h-screen bg-background-dark flex flex-col px-4'>
        <Header />

        <div className='flex-1 flex items-center justify-center'>
          <div className='w-full max-w-md space-y-8'>
            <div className='text-center space-y-2'>
              <h1 className='text-3xl md:text-4xl font-extrabold text-white tracking-tight'>
                {copies.title}
              </h1>
              <p className='text-base text-gray-300 max-w-sm mx-auto'>
                {copies.subtitle}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 px-4'>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-3'>
                  Phone Number
                </label>
                <PhoneInput
                  {...register('phone')}
                  error={errors.phone?.message}
                />
              </div>

              <Button
                type='submit'
                disabled={isLoading}
                className='w-full h-12 bg-primary hover:opacity-90 text-white font-bold rounded-xl transition-opacity'
              >
                {isLoading ? (
                  <LoadingSpinner size='sm' className='mr-2' />
                ) : null}
                {isLoading ? 'Sending...' : copies.button}
              </Button>
            </form>

            <div className='mt-6 px-4 space-y-1'>
              <p className='text-xs text-center text-white'>
                By continuing, you agree to our{' '}
                <button
                  type='button'
                  className='text-primary hover:opacity-80 transition-opacity'
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type='button'
                  className='text-primary hover:opacity-80 transition-opacity'
                >
                  Privacy Policy
                </button>
              </p>

              <p className='text-xs text-center text-white'>
                {copies.footerText}{' '}
                <button
                  type='button'
                  onClick={handleToggleMode}
                  className='text-sm text-primary font-bold hover:opacity-80 transition-opacity'
                >
                  {copies.footerLink}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthRedirectGuard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner size='lg' />}>
      <LoginPageContent />
    </Suspense>
  );
}

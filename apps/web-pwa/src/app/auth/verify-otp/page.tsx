'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import OtpInput from 'react-otp-input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

const otpSchema = z.object({
  otp: z.string().min(6, 'Please enter the complete 6-digit OTP'),
});

type OtpFormData = z.infer<typeof otpSchema>;

function VerifyOtpContent() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState('');

  const {
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    // Get phone number from session storage instead of URL
    const pendingPhoneNumber = sessionStorage.getItem('pendingPhoneNumber');
    if (pendingPhoneNumber) {
      setPhone(pendingPhoneNumber);
    } else {
      // If no phone number in session, redirect to login
      router.push('/auth/login');
    }
  }, [router]);

  const onSubmit = async (data: OtpFormData) => {
    try {
      setIsLoading(true);

      const response = await authService.verifyOTP(phone, data.otp);

      if (response.success && response.data?.user) {
        toast.success('Login successful!');
        // Convert API user to our User type
        const user = {
          id: response.data.user.id,
          phoneNumber: response.data.user.phoneNumber,
          createdAt: response.data.user.createdAt,
          updatedAt: response.data.user.createdAt,
          biometricEnabled: false,
          isVerified: true,
          profileData: {
            firstName: '',
            lastName: '',
          },
        };

        // Store auth token
        if (response.data.session?.token) {
          localStorage.setItem('auth-token', response.data.session.token);
        }

        setUser(user);
        // Clear the pending phone number from session storage
        sessionStorage.removeItem('pendingPhoneNumber');
        // Redirect to onboarding for new users
        router.push('/onboarding');
      } else {
        toast.error('Invalid OTP');
      }
    } catch (error) {
      // Error message is already user-friendly from authService
      toast.error(
        error instanceof Error ? error.message : 'Failed to verify OTP',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      onSubmit({ otp: value });
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      const phoneWithCountryCode = phone.startsWith('+91')
        ? phone
        : `+91${phone}`;
      const response = await authService.sendOTP(phoneWithCountryCode);

      if (response.success) {
        toast.success('OTP resent successfully!');
        setOtp('');
      } else {
        toast.error(response.error || 'Failed to resend OTP');
      }
    } catch (error) {
      // Error message is already user-friendly from authService
      toast.error(
        error instanceof Error ? error.message : 'Failed to resend OTP',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!phone) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h2 className='mt-6 text-3xl font-bold text-gray-900'>
            Verify Your Phone
          </h2>
          <p className='mt-2 text-sm text-gray-600'>
            We sent a 6-digit code to{' '}
            <span className='font-medium'>{phone}</span>
          </p>
        </div>

        <div className='card'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Enter OTP
              </label>
              <div className='flex justify-center'>
                <OtpInput
                  value={otp}
                  onChange={handleOtpChange}
                  numInputs={6}
                  renderInput={props => (
                    <input
                      {...props}
                      className='text-gray-900 bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    />
                  )}
                  inputStyle={{
                    width: '3rem',
                    height: '3rem',
                    margin: '0 0.25rem',
                    fontSize: '1.25rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    textAlign: 'center' as const,
                    color: '#111827',
                    backgroundColor: '#ffffff',
                  }}
                  containerStyle={{
                    justifyContent: 'center',
                  }}
                  shouldAutoFocus
                />
              </div>
              {errors.otp && (
                <p className='text-sm text-error-600'>{errors.otp.message}</p>
              )}
            </div>

            <Button
              type='submit'
              disabled={otp.length !== 6 || isLoading}
              className='w-full'
              size='lg'
            >
              {isLoading ? <LoadingSpinner size='sm' className='mr-2' /> : null}
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </form>

          <div className='mt-6 text-center space-y-4'>
            <button
              type='button'
              onClick={handleResendOtp}
              disabled={isLoading}
              className='text-sm text-primary-600 hover:text-primary-500 disabled:text-gray-400'
            >
              Didn&apos;t receive the code? Resend OTP
            </button>

            <div>
              <button
                type='button'
                onClick={() => router.push('/auth/login')}
                className='text-sm text-gray-600 hover:text-gray-500'
              >
                Change phone number
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<LoadingSpinner size='lg' />}>
      <VerifyOtpContent />
    </Suspense>
  );
}

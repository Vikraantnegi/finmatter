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
import { AuthRedirectGuard } from '@/components/auth/AuthRedirectGuard';
import { useAuth } from '@/hooks/useAuth';
import { AUTH_COPIES } from '@finmatter/shared/src/constants';
import { Header } from '@/components/layout/Header';

const otpSchema = z.object({
  otp: z.string().min(6, 'Please enter the complete 6-digit OTP'),
});

type OtpFormData = z.infer<typeof otpSchema>;

function VerifyOtpContent() {
  const router = useRouter();
  const { verifyOTP, sendOTP } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otp, setOtp] = useState('');
  const [phone, setPhone] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [otpError, setOtpError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    const pendingPhoneNumber = sessionStorage.getItem('pendingPhoneNumber');
    const savedAuthMode = sessionStorage.getItem('authMode');

    if (pendingPhoneNumber) {
      setPhone(pendingPhoneNumber);
      setAuthMode((savedAuthMode as 'login' | 'signup') || 'login');
      setResendCooldown(60);
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  const maskedPhone = phone
    ? `${phone.slice(0, 3)} ${'X'.repeat(4)} ${phone.slice(-3)}`
    : '';

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const onSubmit = async (data: OtpFormData) => {
    try {
      setIsLoading(true);
      setOtpError(false);

      const result = await verifyOTP(phone, data.otp);

      if (result.success) {
        sessionStorage.removeItem('pendingPhoneNumber');
        sessionStorage.removeItem('authMode');
        setIsRedirecting(true);
      } else {
        setOtpError(true);
        setOtp('');

        console.log('OTP Verification Error:', {
          result,
          error: result.error,
          errorType: typeof result.error,
          errorKeys:
            result.error && typeof result.error === 'object'
              ? Object.keys(result.error)
              : null,
        });

        const error = result.error;
        let errorMessage = 'Failed to verify OTP. Please try again.';

        if (error && typeof error === 'object') {
          // Check for error code
          if ('code' in error) {
            const errorCode = String(error.code);
            console.log('📋 Error code from API:', errorCode);

            // Handle error codes - backend now defaults to INVALID_OTP for ambiguous cases (better UX)
            if (
              errorCode === 'INVALID_OTP' ||
              errorCode === 'INVALID_CODE' ||
              errorCode === 'WRONG_OTP' ||
              errorCode === 'CODE_MISMATCH'
            ) {
              errorMessage = 'Invalid OTP. Please try again.';
            } else if (
              errorCode === 'OTP_EXPIRED' ||
              errorCode === 'EXPIRED' ||
              errorCode === 'TOKEN_EXPIRED'
            ) {
              // Pure expired case (backend should only return this if truly expired, not ambiguous)
              errorMessage = 'OTP has expired. Please request a new one.';
            } else if ('message' in error && error.message) {
              // Use the API's error message
              errorMessage = String(error.message);
            }
          } else if ('message' in error && error.message) {
            // No code, but has message
            errorMessage = String(error.message);
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        // Show only ONE toast with ID to prevent duplicates (React StrictMode or re-renders)
        toast.error(errorMessage, { id: 'otp-error' });
      }
    } catch (error) {
      setOtpError(true);
      setOtp('');
      console.error('Unexpected error in OTP verification:', error);
      toast.error('Something went wrong. Please try again.', {
        id: 'otp-unexpected-error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    setOtpError(false);
    if (value.length === 6) {
      onSubmit({ otp: value });
    }
  };

  const handleBack = () => {
    router.push(`/auth/login?mode=${authMode}`);
  };

  const handleHelp = () => {
    toast('Help is coming soon!', { icon: '💡' });
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      const phoneWithCountryCode = phone.startsWith('+91')
        ? phone
        : `+91${phone}`;
      const result = await sendOTP(phoneWithCountryCode);

      if (result.success) {
        setOtp('');
        setOtpError(false);
        setResendCooldown(60);
        toast.success('OTP sent successfully!');
      } else {
        // Handle error
        const error = result.error;
        if (error && typeof error === 'object' && 'message' in error) {
          toast.error(error.message || 'Failed to resend OTP');
        } else {
          toast.error('Failed to resend OTP');
        }
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (!phone) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background-dark'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background-dark'>
        <div className='text-center space-y-4'>
          <LoadingSpinner size='lg' className='mx-auto' />
          <p className='text-base text-gray-300'>Curating your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthRedirectGuard>
      <div className='min-h-screen bg-background-dark flex flex-col px-4'>
        <Header
          showBackButton
          showHelpButton
          onBack={handleBack}
          onHelp={handleHelp}
          className='absolute inset-0 w-full'
        />

        <div className='flex-1 flex items-center justify-center px-4'>
          <div className='w-full max-w-md space-y-8'>
            <div className='text-center space-y-2'>
              <h1 className='text-3xl md:text-4xl font-extrabold text-white tracking-tight'>
                {AUTH_COPIES.verifyOtp.title}
              </h1>
              <p className='text-base text-gray-300 max-w-sm mx-auto'>
                {AUTH_COPIES.verifyOtp.subtitlePrefix} {maskedPhone}.{' '}
                {AUTH_COPIES.verifyOtp.subtitleSuffix}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              <div className='flex justify-center'>
                <OtpInput
                  value={otp}
                  onChange={handleOtpChange}
                  numInputs={6}
                  renderInput={props => (
                    <input
                      {...props}
                      className='w-12 h-12 text-center text-xl font-bold rounded-xl border-2 bg-gray-800 text-white focus:outline-none focus:border-primary transition-colors'
                      style={{
                        borderColor: otpError ? '#EF4444' : '#4B5563',
                      }}
                    />
                  )}
                  containerStyle={{
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                  shouldAutoFocus
                />
              </div>

              {errors.otp && (
                <p className='text-sm text-error-400 text-center'>
                  {errors.otp.message}
                </p>
              )}

              <Button
                type='submit'
                disabled={otp.length !== 6 || isLoading}
                className='w-full h-12 bg-primary hover:opacity-90 text-white font-bold rounded-xl disabled:opacity-50'
              >
                {isLoading ? (
                  <LoadingSpinner size='sm' className='mr-2' />
                ) : null}
                {isLoading ? 'Verifying...' : AUTH_COPIES.verifyOtp.button}
              </Button>
            </form>

            <div className='text-center space-y-4'>
              <button
                type='button'
                onClick={handleResendOtp}
                disabled={isResending || resendCooldown > 0}
                className='text-sm text-white hover:opacity-80 disabled:text-gray-500 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 mx-auto'
              >
                {isResending && <LoadingSpinner size='sm' />}
                <span>
                  {AUTH_COPIES.verifyOtp.resendPrefix}{' '}
                  {resendCooldown > 0 ? (
                    <span className='font-semibold'>
                      Resend in {resendCooldown}s
                    </span>
                  ) : isResending ? (
                    <span className='font-semibold text-primary'>
                      Sending...
                    </span>
                  ) : (
                    <span className='font-semibold text-primary'>
                      {AUTH_COPIES.verifyOtp.resendLink}
                    </span>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthRedirectGuard>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<LoadingSpinner size='lg' />}>
      <VerifyOtpContent />
    </Suspense>
  );
}

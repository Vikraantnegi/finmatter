'use client';

import { Suspense } from 'react';
import { toast } from 'react-hot-toast';
import OtpInput from 'react-otp-input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import AuthRedirectGuard from '@/components/auth/AuthRedirectGuard';
import { useVerifyOTP } from '@/hooks';
import { AUTH_COPIES } from '@finmatter/shared/src/constants';
import { Header } from '@/components/layout/Header';

const VerifyOtpContent = () => {
  const {
    form,
    handleSubmit,
    otp,
    phone,
    maskedPhone,
    otpError,
    isLoading,
    isResending,
    isRedirecting,
    resendCooldown,
    handleOtpChange,
    handleResendOTP,
    handleBack,
  } = useVerifyOTP();

  const {
    formState: { errors },
  } = form;

  const handleHelp = () => {
    toast('Help is coming soon!', { icon: '💡' });
  };

  // Loading state while phone is being initialized
  if (!phone) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background-dark'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  // Redirecting state after successful verification
  if (isRedirecting) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background-dark'>
        <div className='text-center space-y-4'>
          <LoadingSpinner size='lg' className='mx-auto' />
          <p className='text-base text-gray-300'>Setting up your profile...</p>
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

            <form onSubmit={handleSubmit} className='space-y-6'>
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
                onClick={handleResendOTP}
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
};

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<LoadingSpinner size='lg' />}>
      <VerifyOtpContent />
    </Suspense>
  );
}

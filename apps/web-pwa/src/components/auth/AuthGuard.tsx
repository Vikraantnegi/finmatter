'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useReturnUrl } from '@/hooks/useReturnUrl';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getAuthRedirect } from '@/lib/routing';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
}

const AuthGuard = ({
  children,
  requireAuth = true,
  requireOnboarding = false,
}: AuthGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, onboardingCompleted } = useAuth();
  const { saveReturnUrl, getReturnUrl } = useReturnUrl();

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoading) {
        return;
      }

      if (user === null && !isLoading) {
        return;
      }

      const returnUrl = getReturnUrl();
      const redirect = getAuthRedirect({
        isAuthenticated,
        onboardingCompleted,
        currentPath: pathname,
        returnUrl: returnUrl || undefined,
      });

      if (redirect) {
        if (redirect === '/auth/login' && requireAuth) {
          saveReturnUrl();
        }
        router.push(redirect);
        return;
      }

      if (requireAuth && !isAuthenticated) {
        if (pathname !== '/auth/login' && pathname !== '/auth/verify-otp') {
          saveReturnUrl();
          router.push('/auth/login');
        }
        return;
      }

      if (requireOnboarding && isAuthenticated && !onboardingCompleted) {
        if (pathname !== '/onboarding') {
          router.push('/onboarding');
        }
        return;
      }
    };

    checkAuth();
  }, [
    isLoading,
    isAuthenticated,
    onboardingCompleted,
    pathname,
    router,
    requireAuth,
    requireOnboarding,
    user,
    saveReturnUrl,
    getReturnUrl,
  ]);

  if (isLoading || (requireAuth && !isAuthenticated)) {
    if (!isLoading && requireAuth && !isAuthenticated) {
      saveReturnUrl();
      router.push('/auth/login');
    }

    return (
      <div className='min-h-screen flex items-center justify-center bg-background-dark'>
        <div className='text-center space-y-4'>
          <LoadingSpinner size='lg' className='mx-auto' />
          <p className='text-base text-gray-300'>
            {isAuthenticated ? 'Curating your dashboard...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (
    requireOnboarding &&
    isAuthenticated &&
    !onboardingCompleted &&
    pathname !== '/onboarding'
  ) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background-dark'>
        <div className='text-center space-y-4'>
          <LoadingSpinner size='lg' className='mx-auto' />
          <p className='text-base text-gray-300'>
            Preparing your onboarding...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;

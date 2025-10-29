'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { getAuthRedirect } from '@/lib/routing';

interface AuthRedirectGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Component that redirects authenticated users away from auth pages (login, verify-otp)
 * If user is authenticated, they should be redirected to dashboard or onboarding
 */
export function AuthRedirectGuard({
  children,
  redirectTo,
}: AuthRedirectGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated, onboardingCompleted } = useAuthStore();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAuthenticated) {
      const redirect = getAuthRedirect({
        isAuthenticated,
        onboardingCompleted,
        currentPath: pathname,
        returnUrl: redirectTo,
      });

      if (redirect) {
        router.replace(redirect);
      } else if (redirectTo) {
        router.replace(redirectTo);
      }
      return;
    }
  }, [
    isLoading,
    isAuthenticated,
    onboardingCompleted,
    pathname,
    router,
    redirectTo,
  ]);

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background-dark flex items-center justify-center px-4'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto'></div>
          <p className='text-base text-gray-300'>Verifying your session...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

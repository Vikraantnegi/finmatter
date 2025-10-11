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
    // Wait for auth to finish loading before making decisions
    if (isLoading) {
      return;
    }

    // If authenticated, use centralized routing logic
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
        // Custom redirectTo prop takes precedence if no standard redirect
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

  // While auth is loading, show loading
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated, don't render children (will redirect)
  if (isAuthenticated) {
    return null;
  }

  // If not authenticated, render the auth page
  return <>{children}</>;
}

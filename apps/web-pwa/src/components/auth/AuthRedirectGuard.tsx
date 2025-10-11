'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

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
  const { isLoading, isAuthenticated, onboardingCompleted } = useAuthStore();

  useEffect(() => {
    // Wait for auth to finish loading before making decisions
    if (isLoading) {
      return;
    }

    // If authenticated, redirect away from auth pages
    if (isAuthenticated) {
      // Determine where to redirect based on onboarding status
      const targetRoute = onboardingCompleted ? '/dashboard' : '/onboarding';
      const finalRedirectTo = redirectTo || targetRoute;

      router.replace(finalRedirectTo);
      return;
    }
  }, [isLoading, isAuthenticated, onboardingCompleted, router, redirectTo]);

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

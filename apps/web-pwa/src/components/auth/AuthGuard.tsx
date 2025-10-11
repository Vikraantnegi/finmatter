'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useReturnUrl } from '@/hooks/useReturnUrl';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireOnboarding?: boolean;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireOnboarding = false,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, onboardingCompleted } = useAuth();
  const { saveReturnUrl } = useReturnUrl();

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoading) {
        return;
      }

      // Initialize auth if not done yet
      if (user === null && !isLoading) {
        return;
      }

      // Handle authentication requirements
      if (requireAuth && !isAuthenticated) {
        // Redirect to login if not authenticated
        if (pathname !== '/auth/login' && pathname !== '/auth/verify-otp') {
          // Save current URL so we can return after login
          saveReturnUrl();
          router.push('/auth/login');
        }
        return;
      }

      // Handle onboarding requirements
      if (requireOnboarding && isAuthenticated && !onboardingCompleted) {
        // Redirect to onboarding if not completed
        if (pathname !== '/onboarding') {
          router.push('/onboarding');
        }
        return;
      }

      // Redirect authenticated users away from auth pages
      if (isAuthenticated && pathname.startsWith('/auth')) {
        if (onboardingCompleted) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
        return;
      }

      // Redirect completed users away from onboarding
      if (
        isAuthenticated &&
        onboardingCompleted &&
        pathname === '/onboarding'
      ) {
        router.push('/dashboard');
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
  ]);

  // Show loading spinner while checking auth OR when redirecting
  if (isLoading || (requireAuth && !isAuthenticated)) {
    // Trigger redirect immediately when not loading and not authenticated
    if (!isLoading && requireAuth && !isAuthenticated) {
      saveReturnUrl();
      router.push('/auth/login');
    }

    return (
      <div className='min-h-screen flex items-center justify-center gradient-bg'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  // Show loading spinner if onboarding requirements not met
  if (requireOnboarding && isAuthenticated && !onboardingCompleted) {
    return (
      <div className='min-h-screen flex items-center justify-center gradient-bg'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  return <>{children}</>;
}

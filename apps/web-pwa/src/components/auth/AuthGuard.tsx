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

export function AuthGuard({
  children,
  requireAuth = true,
  requireOnboarding = false,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, onboardingCompleted } = useAuth();
  const { saveReturnUrl, getReturnUrl } = useReturnUrl();

  useEffect(() => {
    const checkAuth = async () => {
      if (isLoading) {
        return;
      }

      // Initialize auth if not done yet
      if (user === null && !isLoading) {
        return;
      }

      // Use centralized routing logic
      const returnUrl = getReturnUrl();
      const redirect = getAuthRedirect({
        isAuthenticated,
        onboardingCompleted,
        currentPath: pathname,
        returnUrl: returnUrl || undefined,
      });

      if (redirect) {
        // Save return URL if we're redirecting to login
        if (redirect === '/auth/login' && requireAuth) {
          saveReturnUrl();
        }
        router.push(redirect);
        return;
      }

      // Additional checks for custom guard requirements
      // Handle authentication requirements
      if (requireAuth && !isAuthenticated) {
        if (pathname !== '/auth/login' && pathname !== '/auth/verify-otp') {
          saveReturnUrl();
          router.push('/auth/login');
        }
        return;
      }

      // Handle onboarding requirements
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

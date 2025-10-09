'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
// import { useAuthStore } from '@/stores/authStore';
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

  useEffect(() => {
    const checkAuth = async () => {
      console.log('AuthGuard: checkAuth called', {
        isLoading,
        isAuthenticated,
        onboardingCompleted,
        pathname,
      });

      if (isLoading) {
        console.log('AuthGuard: Still loading, skipping check');
        return;
      }

      // Initialize auth if not done yet
      if (user === null && !isLoading) {
        console.log(
          'AuthGuard: No user found, but useAuth should handle initialization',
        );
        return;
      }

      // Handle authentication requirements
      if (requireAuth && !isAuthenticated) {
        // Redirect to login if not authenticated
        if (pathname !== '/auth/login' && pathname !== '/auth/verify-otp') {
          console.log('AuthGuard: Redirecting to login');
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
      if (
        isAuthenticated &&
        (pathname === '/auth/login' || pathname === '/auth/verify-otp')
      ) {
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
  ]);

  // Show loading spinner while checking auth OR when redirecting
  if (isLoading || (requireAuth && !isAuthenticated)) {
    console.log(
      'AuthGuard: Showing loading spinner - isLoading:',
      isLoading,
      'requireAuth:',
      requireAuth,
      'isAuthenticated:',
      isAuthenticated,
    );

    // Trigger redirect immediately when not loading and not authenticated
    if (!isLoading && requireAuth && !isAuthenticated) {
      console.log('AuthGuard: Triggering immediate redirect to login');
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

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, onboardingCompleted, initializeAuth } =
    useAuthStore();

  useEffect(() => {
    // Initialize auth on first load
    const init = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error('Auth initialization error:', error);
        // If auth fails, redirect to login
        router.push('/auth/login');
      }
    };

    init();
  }, [initializeAuth, router]);

  useEffect(() => {
    if (!isLoading) {
      console.log('HomePage: Auth check complete', {
        isAuthenticated,
        onboardingCompleted,
      });
      if (!isAuthenticated) {
        console.log('HomePage: Redirecting to login');
        router.push('/auth/login');
      } else if (!onboardingCompleted) {
        console.log('HomePage: Redirecting to onboarding');
        router.push('/onboarding');
      } else {
        console.log('HomePage: Redirecting to dashboard');
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, onboardingCompleted, router]);

  // Always show full-screen loader during auth check
  return (
    <div className='min-h-screen flex items-center justify-center gradient-bg'>
      <div className='text-center flex flex-col items-center justify-center'>
        <LoadingSpinner size='lg' className='mb-4 mx-auto' />
        <div className='text-white text-xl font-medium'>
          Loading FinMatter...
        </div>
      </div>
    </div>
  );
}

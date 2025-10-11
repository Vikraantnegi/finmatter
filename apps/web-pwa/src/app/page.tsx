'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

/**
 * Home Page - Entry point that routes users based on auth state
 * Auth initialization is handled by AuthProvider in root layout
 */
export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, onboardingCompleted } = useAuthStore();

  useEffect(() => {
    // Route based on auth state (no need to initialize - AuthProvider does that)
    if (!isAuthenticated) {
      router.replace('/auth/login');
    } else if (!onboardingCompleted) {
      router.replace('/onboarding');
    } else {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, onboardingCompleted, router]);

  // This page just redirects - no UI needed
  // AuthProvider shows loading screen during initialization
  return null;
}

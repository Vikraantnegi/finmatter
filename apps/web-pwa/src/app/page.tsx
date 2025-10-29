'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { getAuthRedirect } from '@/lib/routing';

/**
 * Home Page - Entry point that routes users based on auth state
 * Auth initialization is handled by AuthProvider in root layout
 */
export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, onboardingCompleted } = useAuthStore();

  useEffect(() => {
    const redirect = getAuthRedirect({
      isAuthenticated,
      onboardingCompleted,
      currentPath: pathname,
    });

    if (redirect) {
      router.replace(redirect);
    }
  }, [isAuthenticated, onboardingCompleted, pathname, router]);

  return null;
}

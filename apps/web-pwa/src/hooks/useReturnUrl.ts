/**
 * useReturnUrl Hook
 * Manages deep link support - saves and restores user's intended destination after login
 */

'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const RETURN_URL_KEY = 'finmatter-return-url';

// Pages that should NOT be saved as return URLs
const EXCLUDED_PATHS = [
  '/auth/login',
  '/auth/verify-otp',
  '/auth/forgot-password',
  '/', // Root page (redirects anyway)
];

export function useReturnUrl() {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Save current URL as return destination
   * Call this before redirecting to login
   */
  const saveReturnUrl = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Don't save excluded paths
    const shouldSave = !EXCLUDED_PATHS.some(
      excluded => pathname === excluded || pathname.startsWith(`${excluded}/`),
    );

    if (shouldSave) {
      sessionStorage.setItem(RETURN_URL_KEY, pathname);
    }
  }, [pathname]);

  /**
   * Get saved return URL
   */
  const getReturnUrl = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(RETURN_URL_KEY);
  }, []);

  /**
   * Clear saved return URL
   */
  const clearReturnUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(RETURN_URL_KEY);
  }, []);

  /**
   * Navigate to saved return URL, or fallback if none exists
   * Automatically clears the saved URL after navigation
   */
  const navigateToReturnUrl = useCallback(
    (fallback: string = '/dashboard') => {
      const returnUrl = getReturnUrl();
      clearReturnUrl();

      if (returnUrl && returnUrl !== '/') {
        router.push(returnUrl);
      } else {
        router.push(fallback);
      }
    },
    [router, getReturnUrl, clearReturnUrl],
  );

  /**
   * Check if there's a saved return URL
   */
  const hasReturnUrl = useCallback((): boolean => {
    return !!getReturnUrl();
  }, [getReturnUrl]);

  return {
    saveReturnUrl,
    getReturnUrl,
    clearReturnUrl,
    navigateToReturnUrl,
    hasReturnUrl,
  };
}

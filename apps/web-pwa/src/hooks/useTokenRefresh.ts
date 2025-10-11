/**
 * useTokenRefresh Hook
 * Periodically checks token expiry and proactively refreshes before expiration
 * Prevents mid-action auth failures by keeping tokens fresh
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

const CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds
const REFRESH_THRESHOLD = 15 * 60 * 1000; // Refresh if < 15 minutes until expiry

export function useTokenRefresh() {
  const router = useRouter();
  const { sessionExpiresAt, refreshSession, clearAuth } = useAuthStore();

  useEffect(() => {
    const checkAndRefresh = async () => {
      if (!sessionExpiresAt) return;

      const now = Date.now();
      const expiry = new Date(sessionExpiresAt).getTime();
      const timeUntilExpiry = expiry - now;

      // Token expired - clear auth and redirect
      if (timeUntilExpiry <= 0) {
        clearAuth();

        // Save current URL for return after re-login
        const currentPath = window.location.pathname;
        const excludedPaths = ['/auth/login', '/auth/verify-otp', '/'];

        if (!excludedPaths.some(path => currentPath.startsWith(path))) {
          sessionStorage.setItem('finmatter-return-url', currentPath);
        }

        toast.error('Your session has expired. Please login again.', {
          duration: 3000,
        });

        setTimeout(() => {
          router.push('/auth/login');
        }, 1000);
        return;
      }

      // Refresh if expiring soon (< 15 minutes)
      if (timeUntilExpiry < REFRESH_THRESHOLD) {
        try {
          await refreshSession();
        } catch (error) {
          // Refresh failed - will be handled by next check or API call
        }
      }
    };

    // Run check immediately
    checkAndRefresh();

    // Then run periodically
    const interval = setInterval(checkAndRefresh, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [sessionExpiresAt, refreshSession, clearAuth, router]);
}

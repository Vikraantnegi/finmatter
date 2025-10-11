/**
 * AuthProvider Component
 * Centralizes auth initialization to run only once at app startup
 * Prevents duplicate initialization that was happening in HomePage + useAuth hook
 */

'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { initializeAuthDebug } from '@/lib/authDebug';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initializeAuth, clearAuth } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  // Enable periodic token refresh check
  useTokenRefresh();

  // Initialize auth debugging tools in development
  useEffect(() => {
    initializeAuthDebug();
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await initializeAuth();
      } catch (error) {
        // Auth initialization error - app will redirect to login via AuthGuard
      } finally {
        if (mounted) {
          setInitialized(true);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [initializeAuth]); // Run only once on mount

  // Cross-tab synchronization - listen for auth changes in other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Only handle changes to auth storage
      if (event.key !== 'auth-storage') return;

      if (!event.newValue) {
        // Auth was cleared in another tab (logout)
        clearAuth();
        window.location.href = '/auth/login';
      } else {
        try {
          const newState = JSON.parse(event.newValue);
          const newAuthState = newState.state;

          if (!newAuthState?.isAuthenticated) {
            // User logged out in another tab
            clearAuth();
            window.location.href = '/auth/login';
          } else {
            // User logged in another tab - sync state
            useAuthStore.setState(newAuthState);
          }
        } catch (error) {
          // Invalid storage data - ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [clearAuth]);

  // Show loading screen while initializing auth
  if (!initialized) {
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

  return <>{children}</>;
}

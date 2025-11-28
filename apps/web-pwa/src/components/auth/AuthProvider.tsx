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
import { SplashScreen } from '@/components/ui/SplashScreen';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const { initializeAuth, clearAuth } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useTokenRefresh();

  useEffect(() => {
    initializeAuthDebug();
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await initializeAuth();
      } catch (error) {
        // Error handled by error handler
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
  }, [initializeAuth]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== 'auth-storage') return;

      if (!event.newValue) {
        clearAuth();
        window.location.href = '/auth/login';
      } else {
        try {
          const newState = JSON.parse(event.newValue);
          const newAuthState = newState.state;

          if (!newAuthState?.isAuthenticated) {
            clearAuth();
            window.location.href = '/auth/login';
          } else {
            useAuthStore.setState(newAuthState);
          }
        } catch (error) {
          // Error handled by error handler
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [clearAuth]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { isAuthenticated, user, isLoading } = useAuthStore.getState();

        if (isLoading || !isAuthenticated || !user) {
          return;
        }

        if (window.location.pathname === '/onboarding') {
          return;
        }

        try {
          const { initializeAuth } = useAuthStore.getState();
          await initializeAuth();
        } catch (error) {
          console.error(
            'Failed to sync user state on visibility change:',
            error,
          );
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const [showSplash, setShowSplash] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (initialized) {
      setAuthReady(true);
    }
  }, [initialized]);

  if (showSplash) {
    return (
      <SplashScreen
        onComplete={() => {
          if (authReady) {
            setShowSplash(false);
          }
        }}
        minimumDisplayTime={2000}
      />
    );
  }

  if (!authReady) {
    return (
      <div className='min-h-screen bg-background-dark flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <LoadingSpinner size='lg' className='mx-auto' />
          <p className='text-base text-gray-300'>Initializing app...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthProvider;

'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isLoading,
    isAuthenticated,
    onboardingCompleted,
    setUser,
    setLoading,
    setOnboardingCompleted,
    setSession,
    clearAuth,
    initializeAuth,
  } = useAuthStore();

  // Initialize auth state on mount using the auth store's initializeAuth
  useEffect(() => {
    console.log('useAuth: Initializing auth on mount');

    // Check if already initialized to prevent loops
    const storeState = useAuthStore.getState();
    if (storeState.isLoading === false) {
      console.log('useAuth: Auth already initialized, skipping');
      return;
    }

    initializeAuth();
  }, []); // Empty dependency array to run only once

  const sendOTP = useCallback(
    async (phoneNumber: string) => {
      try {
        setLoading(true);
        const response = await authService.sendOTP(phoneNumber);

        if (response.success) {
          toast.success('OTP sent successfully!');
          return { success: true };
        } else {
          toast.error(
            typeof response.error === 'string'
              ? response.error
              : 'Failed to send OTP',
          );
          return { success: false, error: response.error };
        }
      } catch (error) {
        console.error('Send OTP error:', error);
        toast.error('Failed to send OTP. Please try again.');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [setLoading],
  );

  const verifyOTP = useCallback(
    async (phoneNumber: string, otp: string) => {
      try {
        setLoading(true);
        const response = await authService.verifyOTP(phoneNumber, otp);

        if (response.success && response.data?.user && response.data?.session) {
          // Type assertion: API returns additional fields beyond the base type
          const apiUser = response.data.user as typeof response.data.user & {
            onboardingCompleted?: boolean;
          };

          const user = {
            ...response.data.user,
            updatedAt: new Date().toISOString(),
          };

          // Save session to store
          setSession(
            response.data.session.token,
            response.data.session.expiresAt,
          );

          setUser(user);
          const onboardingCompleted = apiUser.onboardingCompleted || false;
          setOnboardingCompleted(onboardingCompleted);
          toast.success('Welcome to FinMatter!');

          // Navigation happens after all state updates complete
          // This is the proper async pattern - navigate after the async flow resolves
          const targetRoute = onboardingCompleted
            ? '/dashboard'
            : '/onboarding';
          router.push(targetRoute);
          router.refresh(); // Ensure clean render of the new route

          return { success: true, user };
        } else {
          toast.error(
            typeof response.error === 'string' ? response.error : 'Invalid OTP',
          );
          return { success: false, error: response.error };
        }
      } catch (error) {
        console.error('Verify OTP error:', error);
        toast.error('Failed to verify OTP. Please try again.');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [setUser, setOnboardingCompleted, setLoading, setSession, router],
  );

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await authService.signOut();
      clearAuth();
      toast.success('Signed out successfully!');

      // Navigation after state is cleared
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [clearAuth, setLoading, router]);

  const completeOnboarding = useCallback(
    async (userData: {
      firstName: string;
      lastName?: string;
      notificationsEnabled: boolean;
    }) => {
      try {
        setLoading(true);
        console.log('🔄 Starting onboarding completion...', userData);

        const response = await authService.completeOnboarding(userData);
        console.log('📦 Onboarding response:', response);

        if (response.success && response.data?.user) {
          console.log('✅ Onboarding completed successfully');
          setUser(response.data.user);
          setOnboardingCompleted(true);
          toast.success('Onboarding completed!');

          // Use replace to avoid back button issues and ensure clean navigation
          router.replace('/dashboard');

          return { success: true };
        } else {
          console.error('❌ Onboarding failed:', response.error);
          const errorMessage =
            response.error?.message || 'Failed to complete onboarding';
          toast.error(errorMessage);
          return { success: false, error: response.error };
        }
      } catch (error) {
        console.error('❌ Complete onboarding error:', error);

        // Handle different error types
        let errorMessage = 'Failed to complete onboarding. Please try again.';

        if (error instanceof Error) {
          if (
            error.message.includes('401') ||
            error.message.includes('Unauthorized')
          ) {
            errorMessage = 'Session expired. Please login again.';
            // Redirect to login
            router.push('/auth/login');
          } else if (
            error.message.includes('400') ||
            error.message.includes('validation')
          ) {
            errorMessage = 'Invalid data. Please check your information.';
          } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
          } else {
            errorMessage = error.message;
          }
        }

        toast.error(errorMessage);
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [setUser, setOnboardingCompleted, setLoading, router],
  );

  return {
    // State
    user,
    isLoading,
    isAuthenticated,
    onboardingCompleted,

    // Actions
    sendOTP,
    verifyOTP,
    signOut,
    completeOnboarding,
  };
}

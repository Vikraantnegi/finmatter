'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { apiClient } from '@/lib/apiClient';
import { useReturnUrl } from '@/hooks/useReturnUrl';
import toast from 'react-hot-toast';

export function useAuth() {
  const router = useRouter();
  const { navigateToReturnUrl } = useReturnUrl();
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
  } = useAuthStore();

  // Auth initialization is now handled by AuthProvider in root layout
  // No need to initialize here - prevents duplicate initialization

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
          const initialUser = {
            ...response.data.user,
            updatedAt: new Date().toISOString(),
          };

          // Save session to store
          setSession(
            response.data.session.token,
            response.data.session.expiresAt,
          );

          // Set auth token for subsequent API calls
          apiClient.setAuthToken(response.data.session.token);

          // Fetch complete user profile data from our API
          // IMPORTANT: Wait for profile fetch before navigating
          try {
            const profileResponse = await authService.getCurrentUser(
              initialUser.id,
            );

            if (profileResponse.success && profileResponse.data?.user) {
              // Use the complete profile data
              const completeUser = profileResponse.data.user;
              setUser(completeUser);
              setOnboardingCompleted(completeUser.onboardingCompleted || false);

              toast.success('Welcome to FinMatter!');

              // Navigate based on VERIFIED profile data
              if (!completeUser.onboardingCompleted) {
                router.push('/onboarding');
              } else {
                navigateToReturnUrl('/dashboard');
              }
              router.refresh();

              return { success: true, user: completeUser };
            } else {
              // Profile fetch failed - treat as error
              throw new Error('Failed to load user profile');
            }
          } catch (profileError) {
            // Profile fetch failed - clear auth and redirect to login
            console.error('Profile fetch error:', profileError);
            clearAuth();
            toast.error('Failed to load profile. Please try logging in again.');
            router.push('/auth/login');
            return { success: false, error: profileError };
          }
        } else {
          toast.error(
            typeof response.error === 'string' ? response.error : 'Invalid OTP',
          );
          return { success: false, error: response.error };
        }
      } catch (error) {
        toast.error('Failed to verify OTP. Please try again.');
        return { success: false, error };
      } finally {
        setLoading(false);
      }
    },
    [
      setUser,
      setOnboardingCompleted,
      setLoading,
      setSession,
      clearAuth,
      router,
      navigateToReturnUrl,
    ],
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

        const response = await authService.completeOnboarding(userData);

        if (response.success && response.data?.user) {
          setUser(response.data.user);
          setOnboardingCompleted(true);
          toast.success('Onboarding completed!');

          // Navigate immediately with push (not replace) to ensure clean transition
          // This prevents Next.js from re-rendering the current page with stale state
          window.location.href = '/dashboard';

          return { success: true };
        } else {
          const errorMessage =
            response.error?.message || 'Failed to complete onboarding';
          toast.error(errorMessage);
          return { success: false, error: response.error };
        }
      } catch (error) {
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

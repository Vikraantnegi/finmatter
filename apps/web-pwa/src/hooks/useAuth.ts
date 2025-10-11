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

          // Set auth token for subsequent API calls
          apiClient.setAuthToken(response.data.session.token);

          // Fetch complete user profile data from our API
          try {
            const profileResponse = await authService.getCurrentUser(user.id);
            if (profileResponse.success && profileResponse.data?.user) {
              setUser(profileResponse.data.user);
              setOnboardingCompleted(
                profileResponse.data.user.onboardingCompleted || false,
              );
            } else {
              setUser(user);
              setOnboardingCompleted(apiUser.onboardingCompleted || false);
            }
          } catch (error) {
            setUser(user);
            setOnboardingCompleted(apiUser.onboardingCompleted || false);
          }

          toast.success('Welcome to FinMatter!');

          // Navigate to onboarding if not completed, otherwise to return URL or dashboard
          if (!apiUser.onboardingCompleted) {
            router.push('/onboarding');
          } else {
            // Navigate to saved return URL or dashboard
            navigateToReturnUrl('/dashboard');
          }
          router.refresh(); // Ensure clean render of the new route

          return { success: true, user };
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

          // Use replace to avoid back button issues and ensure clean navigation
          router.replace('/dashboard');

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

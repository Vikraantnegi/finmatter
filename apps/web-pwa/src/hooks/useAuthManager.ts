/**
 * Authentication Manager Hook
 * Provides authentication state and methods using the centralized AuthManager
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authManager, AuthState, AuthSession } from '@/lib/authManager';
import { authService } from '@/services/authService';
import { apiClient } from '@/lib/apiClient';
import toast from 'react-hot-toast';

export function useAuthManager() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>(authManager.getState());

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authManager.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    authManager.initializeAuth();
  }, []);

  /**
   * Send OTP to phone number
   */
  const sendOTP = useCallback(async (phoneNumber: string) => {
    try {
      authManager.setLoading(true);
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
      authManager.setLoading(false);
    }
  }, []);

  /**
   * Verify OTP and complete login
   */
  const verifyOTP = useCallback(
    async (phoneNumber: string, otp: string) => {
      try {
        authManager.setLoading(true);
        const response = await authService.verifyOTP(phoneNumber, otp);

        if (response.success && response.data?.user && response.data?.session) {
          const user = {
            ...response.data.user,
            updatedAt: new Date().toISOString(),
          };
          const sessionData: AuthSession = {
            token: response.data.session.token,
            refreshToken: response.data.session.refreshToken,
            expiresAt: response.data.session.expiresAt,
            userId: user.id,
          };

          // Set session in auth manager
          authManager.setSession(sessionData, user);

          // Set auth token for API calls
          apiClient.setAuthToken(sessionData.token);

          // Fetch complete user profile data
          try {
            console.log('🔄 Fetching complete user profile after login...');
            const profileResponse = await authService.getCurrentUser(user.id);
            if (profileResponse.success && profileResponse.data?.user) {
              console.log('✅ Complete user profile fetched:', profileResponse.data.user);
              authManager.updateUser(profileResponse.data.user);
            }
          } catch (error) {
            console.warn('⚠️ Error fetching complete profile:', error);
          }

          toast.success('Welcome to FinMatter!');

          // Navigate based on onboarding status
          const targetRoute = (user as any).onboardingCompleted
            ? '/dashboard'
            : '/onboarding';
          router.push(targetRoute);
          router.refresh();

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
        authManager.setLoading(false);
      }
    },
    [router],
  );

  /**
   * Sign out user
   */
  const signOut = useCallback(async () => {
    try {
      authManager.setLoading(true);
      await authService.signOut();
      authManager.clearAuth();
      apiClient.clearAuthToken();
      toast.success('Signed out successfully!');

      // Navigate to login
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      authManager.setLoading(false);
    }
  }, [router]);

  /**
   * Complete onboarding
   */
  const completeOnboarding = useCallback(
    async (userData: {
      firstName: string;
      lastName?: string;
      notificationsEnabled: boolean;
    }) => {
      try {
        authManager.setLoading(true);
        console.log('🔄 Starting onboarding completion...', userData);

        const response = await authService.completeOnboarding(userData);
        console.log('📦 Onboarding response:', response);

        if (response.success && response.data?.user) {
          console.log('✅ Onboarding completed successfully');
          authManager.updateUser(response.data.user);
          authManager.setAuthState({ onboardingCompleted: true });
          toast.success('Onboarding completed!');

          // Navigate to dashboard
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

        let errorMessage = 'Failed to complete onboarding. Please try again.';

        if (error instanceof Error) {
          if (
            error.message.includes('401') ||
            error.message.includes('Unauthorized')
          ) {
            errorMessage = 'Session expired. Please login again.';
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
        authManager.setLoading(false);
      }
    },
    [router],
  );

  /**
   * Refresh user data from server
   */
  const refreshUserData = useCallback(async () => {
    if (!authState.user?.id) return;

    try {
      const response = await authService.getCurrentUser(authState.user.id);
      if (response.success && response.data?.user) {
        authManager.updateUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails due to auth issues, clear auth
      if (error instanceof Error && error.message.includes('401')) {
        authManager.clearAuth();
        router.push('/auth/login');
      }
    }
  }, [authState.user?.id, router]);

  /**
   * Check if user needs to be redirected
   */
  const checkAuthRedirect = useCallback(() => {
    if (authState.isLoading) return;

    if (!authState.isAuthenticated) {
      router.push('/auth/login');
    } else if (!authState.onboardingCompleted) {
      router.push('/onboarding');
    }
  }, [authState.isLoading, authState.isAuthenticated, authState.onboardingCompleted, router]);

  return {
    // State
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    onboardingCompleted: authState.onboardingCompleted,
    session: authState.session,

    // Methods
    sendOTP,
    verifyOTP,
    signOut,
    completeOnboarding,
    refreshUserData,
    checkAuthRedirect,

    // Utilities
    isSessionValid: () => authManager.isSessionValid(),
    isSessionExpired: () => authManager.isSessionExpired(),
  };
}

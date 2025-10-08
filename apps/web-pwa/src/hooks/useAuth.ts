'use client';

import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function useAuth() {
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

  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        // Check if user is logged in via Supabase
        const {
          data: { user },
        } = await authService.getCurrentUser();

        if (user) {
          setUser(user);
          // Check onboarding status
          const isOnboardingCompleted =
            user.user_metadata?.onboarding_completed ?? false;
          setOnboardingCompleted(isOnboardingCompleted);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setUser, setLoading, setOnboardingCompleted, clearAuth]);

  const sendOTP = useCallback(
    async (phoneNumber: string) => {
      try {
        setLoading(true);
        const response = await authService.sendOTP(phoneNumber);

        if (response.success) {
          toast.success('OTP sent successfully!');
          return { success: true };
        } else {
          toast.error(typeof response.error === 'string' ? response.error : 'Failed to send OTP');
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
          const user = {
            ...response.data.user,
            updatedAt: new Date().toISOString(),
          };
          
          // Save session to store
          setSession(response.data.session.token, response.data.session.expiresAt);
          
          setUser(user as any);
          const onboardingCompleted = (response.data.user as any).onboardingCompleted || false;
          setOnboardingCompleted(onboardingCompleted);
          toast.success('Welcome to FinMatter!');
          
          // Redirect based on onboarding status
          if (onboardingCompleted) {
            router.push('/dashboard');
          } else {
            router.push('/onboarding');
          }
          
          return { success: true, user };
        } else {
          toast.error(typeof response.error === 'string' ? response.error : 'Invalid OTP');
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
      router.push('/auth/login');
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
        const response = await authService.completeOnboarding(userData);

        if (response.success && response.data?.user) {
          setUser(response.data.user);
          setOnboardingCompleted(true);
          toast.success('Onboarding completed!');
          router.push('/dashboard');
          return { success: true };
        } else {
          toast.error(
            response.error?.message || 'Failed to complete onboarding',
          );
          return { success: false, error: response.error };
        }
      } catch (error) {
        console.error('Complete onboarding error:', error);
        toast.error('Failed to complete onboarding. Please try again.');
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

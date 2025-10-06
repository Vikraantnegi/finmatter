/**
 * Authentication Store
 * Manages phone-based authentication state using Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Types
import { AuthUserProfile, AuthUserSession } from '@finmatter/types';

// Services
import { authService } from '../services/AuthService';

// Utils
import { isOTPReVerificationRequired } from '../utils/otpVerification';

// MMKV storage for persistence
const storage = new MMKV({
  id: 'finmatter-auth-store',
  encryptionKey: 'finmatter-auth-key',
});

// Custom storage adapter for Zustand
const zustandStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: any) => {
    storage.set(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

interface AuthState {
  // Core auth state
  user: AuthUserProfile | null;
  session: AuthUserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Onboarding state
  onboardingCompleted: boolean;
  userName: string | null;
  notificationsEnabled: boolean;
  smsPermissionGranted: boolean;

  // Biometric re-authentication state
  showBiometricPrompt: boolean;

  // Actions
  setUser: (user: AuthUserProfile | null) => void;
  setSession: (session: AuthUserSession | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setUserName: (name: string | null) => void;
  setNotificationPermission: (enabled: boolean) => void;
  setSMSPermission: (granted: boolean) => void;
  setShowBiometricPrompt: (show: boolean) => void;

  // Auth operations
  checkAuthStatus: () => Promise<void>;
  logout: () => Promise<void>;
  setUserProfile: (name: string, email?: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // Biometric handlers
  handleBiometricSuccess: () => void;
  handleBiometricFallback: () => void;
  handleBiometricCancel: () => void;

  // Helper functions
  shouldShowBiometricPrompt: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      onboardingCompleted: false,
      userName: null,
      notificationsEnabled: false,
      smsPermissionGranted: false,
      showBiometricPrompt: false,

      // Setters
      setUser: (user) => set({ user, isAuthenticated: !!user && !!get().session }),
      setSession: (session) => set({ session, isAuthenticated: !!get().user && !!session }),
      setLoading: (isLoading) => set({ isLoading }),
      setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),
      setUserName: (userName) => set({ userName }),
      setNotificationPermission: (notificationsEnabled) => set({ notificationsEnabled }),
      setSMSPermission: (smsPermissionGranted) => set({ smsPermissionGranted }),
      setShowBiometricPrompt: (showBiometricPrompt) => set({ showBiometricPrompt }),

      // Auth operations
      checkAuthStatus: async () => {
        try {
          set({ isLoading: true });
          const userSession = await authService.getUserSession();

          if (userSession) {
            set({ 
              user: userSession.user, 
              session: userSession.session,
              isAuthenticated: true 
            });

            // Check if OTP re-verification is required (30-day security requirement)
            const needsOTPReVerification = isOTPReVerificationRequired(
              userSession.user.lastOtpVerification,
            );

            if (needsOTPReVerification) {
              // Force logout to require OTP re-verification
              await get().logout();
              return;
            }

            // Check if user has biometric enabled and show prompt
            if (userSession.user.biometricEnabled) {
              const shouldShowBiometric = await get().shouldShowBiometricPrompt();
              if (shouldShowBiometric) {
                set({ showBiometricPrompt: true });
              }
            }
          } else {
            set({ 
              user: null, 
              session: null, 
              isAuthenticated: false 
            });
          }
        } catch (error) {
          console.error('Auth status check error:', error);
          set({ 
            user: null, 
            session: null, 
            isAuthenticated: false 
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await authService.clearUserSession();
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            onboardingCompleted: false,
            userName: null,
            notificationsEnabled: false,
            smsPermissionGranted: false,
          });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      setUserProfile: async (name: string, email?: string) => {
        try {
          // Update profile via API
          const response = await authService.updateUserProfile({ name, email });
          if (response.success) {
            set({ userName: name });
            // Update local user object if needed
            const currentUser = get().user;
            if (currentUser) {
              set({
                user: {
                  ...currentUser,
                  // Note: AuthUserProfile doesn't have name/email fields yet
                  // This will be updated when we extend the type
                }
              });
            }
          } else {
            throw new Error(response.error || 'Failed to update profile');
          }
        } catch (error) {
          console.error('Profile update error:', error);
          throw error;
        }
      },

      completeOnboarding: async () => {
        try {
          // Update user profile to mark onboarding as completed
          const user = get().user;
          if (user) {
            await authService.updateUserProfile({
              onboardingCompleted: true,
            });
          }
          set({ onboardingCompleted: true });
        } catch (error) {
          console.error('Onboarding completion error:', error);
          // Still mark as completed locally even if API fails
          set({ onboardingCompleted: true });
        }
      },

      // Biometric handlers
      handleBiometricSuccess: async () => {
        set({ showBiometricPrompt: false });
        // Store timestamp of successful biometric authentication
        try {
          await storage.set('last_biometric_prompt', Date.now().toString());
        } catch (error) {
          console.error('Error storing biometric prompt timestamp:', error);
        }
        // User is now authenticated with biometric
      },

      handleBiometricFallback: () => {
        set({ showBiometricPrompt: false });
        // Navigate to OTP verification screen
        // This would require navigation context or a callback
      },

      handleBiometricCancel: () => {
        set({ showBiometricPrompt: false });
        // User cancelled biometric, continue with normal flow
      },

      // Helper functions
      shouldShowBiometricPrompt: async (): Promise<boolean> => {
        try {
          // Check if this is a fresh app launch or returning from background
          // We'll use a simple timestamp-based approach for now
          const lastBiometricPrompt = await storage.getString('last_biometric_prompt');
          const now = Date.now();
          
          // Show biometric prompt if:
          // 1. Never shown before, OR
          // 2. Last shown more than 5 minutes ago (app was in background)
          if (!lastBiometricPrompt) {
            return true;
          }
          
          const lastPromptTime = parseInt(lastBiometricPrompt, 10);
          const timeSinceLastPrompt = now - lastPromptTime;
          const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
          
          return timeSinceLastPrompt > fiveMinutes;
        } catch (error) {
          console.error('Error checking biometric prompt timing:', error);
          // Default to showing prompt if there's an error
          return true;
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => zustandStorage),
      // Only persist certain fields, not functions or derived state
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        onboardingCompleted: state.onboardingCompleted,
        userName: state.userName,
        notificationsEnabled: state.notificationsEnabled,
        smsPermissionGranted: state.smsPermissionGranted,
      }),
    }
  )
);

// Initialize auth state on app start
useAuthStore.getState().checkAuthStatus();

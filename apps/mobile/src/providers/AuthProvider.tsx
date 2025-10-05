/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Authentication Provider
 * Manages phone-based authentication state and context
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

// Types
import { AuthUserProfile, AuthUserSession } from '@finmatter/types';

// Services
import { authService } from '../services/AuthService';

// Components
import BiometricPrompt from '../components/BiometricPrompt';

// Utils
import { isOTPReVerificationRequired } from '../utils/otpVerification';

interface AuthContextType {
  user: AuthUserProfile | null;
  session: AuthUserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  userName: string | null;
  notificationsEnabled: boolean;
  smsPermissionGranted: boolean;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  setUserProfile: (name: string, email?: string) => Promise<void>;
  setNotificationPermission: (enabled: boolean) => void;
  setSMSPermission: (granted: boolean) => void;
  completeOnboarding: () => Promise<void>;

  // Biometric re-authentication
  showBiometricPrompt: boolean;
  handleBiometricSuccess: () => void;
  handleBiometricFallback: () => void;
  handleBiometricCancel: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [session, setSession] = useState<AuthUserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Onboarding state
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [smsPermissionGranted, setSmsPermissionGranted] = useState(false);

  // Biometric re-authentication state
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);

  const isAuthenticated = !!user && !!session;

  // Initialize auth state from storage
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const userSession = await authService.getUserSession();

      if (userSession) {
        setUser(userSession.user);
        setSession(userSession.session);

        // Check if OTP re-verification is required (30-day security requirement)
        const needsOTPReVerification = isOTPReVerificationRequired(
          userSession.user.lastOtpVerification,
        );

        if (needsOTPReVerification) {
          // Force logout to require OTP re-verification
          await logout();
          return;
        }

        // Check if user has biometric enabled and show prompt
        if (userSession.user.biometricEnabled) {
          // Check if we need to show biometric prompt (not on first launch after login)
          const shouldShowBiometric = await shouldShowBiometricPrompt();
          if (shouldShowBiometric) {
            setShowBiometricPrompt(true);
          }
        }
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      setUser(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const shouldShowBiometricPrompt = async (): Promise<boolean> => {
    // TODO: Implement logic to check if biometric prompt should be shown
    // For now, we'll show it if the app was launched from background (not fresh launch)
    // This would require tracking app state changes
    return true; // Simplified for now
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.clearUserSession();
      setUser(null);
      setSession(null);
      // Reset onboarding state on logout
      setOnboardingCompleted(false);
      setUserName(null);
      setNotificationsEnabled(false);
      setSmsPermissionGranted(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const setUserProfile = async (
    name: string,
    email?: string,
  ): Promise<void> => {
    try {
      // Update profile via API
      const response = await authService.updateUserProfile({ name, email });
      if (response.success) {
        setUserName(name);
        // Update local user object if needed
        if (user) {
          setUser({
            ...user,
            // Note: AuthUserProfile doesn't have name/email fields yet
            // This will be updated when we extend the type
          });
        }
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const setNotificationPermission = (enabled: boolean): void => {
    setNotificationsEnabled(enabled);
  };

  const setSMSPermission = (granted: boolean): void => {
    setSmsPermissionGranted(granted);
  };

  const completeOnboarding = async (): Promise<void> => {
    try {
      // Update user profile to mark onboarding as completed
      if (user) {
        await authService.updateUserProfile({
          onboardingCompleted: true,
        });
      }
      setOnboardingCompleted(true);
    } catch (error) {
      console.error('Onboarding completion error:', error);
      // Still mark as completed locally even if API fails
      setOnboardingCompleted(true);
    }
  };

  const handleBiometricSuccess = (): void => {
    setShowBiometricPrompt(false);
    // User is now authenticated with biometric
  };

  const handleBiometricFallback = (): void => {
    setShowBiometricPrompt(false);
    // Navigate to OTP verification screen
    // This would require navigation context or a callback
  };

  const handleBiometricCancel = (): void => {
    setShowBiometricPrompt(false);
    // User cancelled biometric, continue with normal flow
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    onboardingCompleted,
    userName,
    notificationsEnabled,
    smsPermissionGranted,
    logout,
    checkAuthStatus,
    setUserProfile,
    setNotificationPermission,
    setSMSPermission,
    completeOnboarding,
    showBiometricPrompt,
    handleBiometricSuccess,
    handleBiometricFallback,
    handleBiometricCancel,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <BiometricPrompt
        isVisible={showBiometricPrompt}
        onSuccess={handleBiometricSuccess}
        onFallback={handleBiometricFallback}
        onCancel={handleBiometricCancel}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

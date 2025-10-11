/**
 * Auth Debugging Helper
 * Development-only tool for debugging authentication state
 * Usage in browser console: __DEBUG_AUTH__()
 */

/* eslint-disable no-console */

import { useAuthStore } from '@/stores/authStore';

export function initializeAuthDebug() {
  // Only enable in development
  if (process.env.NODE_ENV !== 'development') return;

  if (typeof window === 'undefined') return;

  // Add debug function to window
  (window as any).__DEBUG_AUTH__ = () => {
    const state = useAuthStore.getState();

    console.log('\n🔐 === FinMatter Auth State Debug ===\n');

    console.table({
      Authenticated: state.isAuthenticated,
      Loading: state.isLoading,
      'User ID': state.user?.id || 'null',
      Phone: state.user?.phoneNumber || 'null',
      'First Name': state.user?.profileData?.firstName || 'null',
      'Onboarding Complete': state.onboardingCompleted,
      'Token Exists': !!state.sessionToken,
      'Token Preview': state.sessionToken
        ? `${state.sessionToken.substring(0, 30)}...`
        : 'null',
      'Token Expires At': state.sessionExpiresAt || 'null',
      'Time Until Expiry': state.sessionExpiresAt
        ? `${Math.round((new Date(state.sessionExpiresAt).getTime() - Date.now()) / 60000)} minutes`
        : 'N/A',
      'Is Expired': state.sessionExpiresAt
        ? new Date(state.sessionExpiresAt).getTime() < Date.now()
        : 'N/A',
    });

    console.log('\n📦 Full User Object:');
    console.log(state.user);

    console.log('\n🔑 Token Details:');
    console.log({
      sessionToken: state.sessionToken
        ? `${state.sessionToken.substring(0, 50)}...`
        : null,
      sessionExpiresAt: state.sessionExpiresAt,
      expiryDate: state.sessionExpiresAt
        ? new Date(state.sessionExpiresAt)
        : null,
    });

    console.log('\n🍪 Cookies:');
    console.log(document.cookie);

    console.log('\n💾 LocalStorage (auth-storage):');
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        console.log(parsed);
      } else {
        console.log('No auth storage found');
      }
    } catch (error) {
      console.error('Error reading auth storage:', error);
    }

    console.log('\n🎯 Return URL:');
    console.log(sessionStorage.getItem('finmatter-return-url') || 'None saved');

    console.log('\n=================================\n');

    return {
      state,
      isValid: state.isAuthenticated && state.user !== null,
      tokenExpired: state.sessionExpiresAt
        ? new Date(state.sessionExpiresAt).getTime() < Date.now()
        : true,
    };
  };

  // Add helper functions
  (window as any).__CLEAR_AUTH__ = () => {
    useAuthStore.getState().clearAuth();
    console.log('✅ Auth state cleared');
  };

  (window as any).__SIMULATE_TOKEN_EXPIRY__ = () => {
    const state = useAuthStore.getState();
    if (state.sessionExpiresAt) {
      // Set expiry to 2 minutes from now for testing
      const twoMinutesFromNow = new Date(
        Date.now() + 2 * 60 * 1000,
      ).toISOString();
      useAuthStore.setState({
        ...state,
        sessionExpiresAt: twoMinutesFromNow,
      });
      console.log(
        `⏰ Token expiry set to 2 minutes from now: ${twoMinutesFromNow}`,
      );
      console.log('Wait 2 minutes to test expiry behavior');
    } else {
      console.log('❌ No session token to expire');
    }
  };

  console.log('\n🔧 Auth Debug Tools Enabled');
  console.log('Available commands:');
  console.log('  __DEBUG_AUTH__()          - Show current auth state');
  console.log('  __CLEAR_AUTH__()          - Clear auth state');
  console.log(
    '  __SIMULATE_TOKEN_EXPIRY__() - Set token to expire in 2 minutes',
  );
  console.log('\n');
}

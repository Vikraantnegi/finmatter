'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@finmatter/types';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/apiClient';
import { authCookies } from '@/lib/cookies';
import { authService } from '@/services/authService';

// Extended user type for API responses that include onboarding status
interface UserWithOnboarding extends User {
  onboardingCompleted?: boolean;
  firstName?: string;
  lastName?: string;
  name?: string;
}

// Token refresh threshold - only refresh if expiring in next 15 minutes
const REFRESH_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

// Helper function to check if token should be refreshed
const shouldRefreshToken = (expiresAt: string): boolean => {
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const timeUntilExpiry = expiry - now;
  return timeUntilExpiry < REFRESH_THRESHOLD_MS && timeUntilExpiry > 0;
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Onboarding state
  onboardingCompleted: boolean;
  userName: string | null;
  notificationsEnabled: boolean;

  // Session state
  sessionToken: string | null;
  sessionExpiresAt: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setSession: (token: string, expiresAt: string) => void;
  clearSession: () => void;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearAuth: () => void;

  // Onboarding actions
  setOnboardingCompleted: (completed: boolean) => void;
  setUserName: (name: string) => void;
  setNotificationPermission: (enabled: boolean) => void;
  completeOnboarding: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false, // Default to false - will be set to true only during auth initialization
      isAuthenticated: false,

      // Onboarding state
      onboardingCompleted: false,
      userName: null,
      notificationsEnabled: false,

      // Session state
      sessionToken: null,
      sessionExpiresAt: null,

      setUser: user => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        });
      },

      setLoading: loading => {
        set({ isLoading: loading });
      },

      setSession: (token: string, expiresAt: string) => {
        set({ sessionToken: token, sessionExpiresAt: expiresAt });
      },

      clearSession: () => {
        set({ sessionToken: null, sessionExpiresAt: null });
      },

      refreshSession: async () => {
        // Refresh token is in httpOnly cookie - server reads it automatically
        // We just need to call the refresh endpoint
        try {
          const response = await authService.refreshToken();

          if (response.success && response.data?.session) {
            set({
              sessionToken: response.data.session.token,
              sessionExpiresAt: response.data.session.expiresAt,
            });
            // Update API client with new access token
            // Refresh token is managed by server via httpOnly cookie
            apiClient.setAuthToken(response.data.session.token);
            return;
          }
        } catch (error) {
          // If refresh fails, clear auth state to prevent loops
          get().clearAuth();
          return;
        }

        // If refresh failed, clear auth
        get().clearAuth();
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          // Sign out from Supabase failed, but continue with local cleanup
        }

        // Always clear local auth state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          onboardingCompleted: false,
          userName: null,
          notificationsEnabled: false,
          sessionToken: null,
          sessionExpiresAt: null,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          onboardingCompleted: false,
          userName: null,
          notificationsEnabled: false,
          sessionToken: null,
          sessionExpiresAt: null,
        });
      },

      initializeAuth: async () => {
        try {
          // Start loading
          set({ isLoading: true });

          // Check cookies for tokens (priority over localStorage)
          const cookieAccessToken = authCookies.getAccessToken();

          // Check persisted state
          const {
            sessionToken: currentSessionToken,
            sessionExpiresAt: currentSessionExpiry,
            user: currentUser,
          } = get();

          // Use cookie token if available, otherwise use localStorage token
          const activeToken = cookieAccessToken || currentSessionToken;

          if (activeToken && currentSessionExpiry && currentUser) {
            const now = new Date();
            const expiresAt = new Date(currentSessionExpiry);

            // Check if token is expired
            if (now >= expiresAt) {
              // Token expired - clear and redirect
              get().clearSession();
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }

            // Only refresh if expiring soon (< 15 minutes)
            if (shouldRefreshToken(currentSessionExpiry)) {
              await get().refreshSession();
            }

            // Fetch fresh user profile data from our API
            try {
              const response = (await apiClient.get(
                `/api/users/${currentUser.id}`,
              )) as {
                success: boolean;
                data?: { user: UserWithOnboarding };
                error?: any;
              };
              if (response.success && response.data?.user) {
                set({
                  user: response.data.user,
                  isAuthenticated: true,
                  isLoading: false,
                  onboardingCompleted:
                    response.data.user.onboardingCompleted || false,
                });
                return;
              }
            } catch (error) {
              set({
                isAuthenticated: true,
                isLoading: false,
                onboardingCompleted:
                  (currentUser as any).onboardingCompleted || false,
              });
              return;
            }
          }

          // Check if Supabase is properly configured
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          if (!supabaseUrl || !supabaseKey || supabaseUrl.length < 10) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }

          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Auth initialization timeout')),
              3000,
            ),
          );

          const sessionPromise = supabase.auth.getSession();

          const {
            data: { session },
          } = (await Promise.race([sessionPromise, timeoutPromise])) as any;

          if (session?.user) {
            // Set the auth token for API calls
            apiClient.setAuthToken(session.access_token);

            try {
              // Fetch user profile from our API endpoint
              const response = (await apiClient.get(
                `/api/users/${session.user.id}`,
              )) as {
                success: boolean;
                data?: { user: UserWithOnboarding };
                error?: any;
              };
              if (response.success && response.data?.user) {
                set({
                  user: response.data.user,
                  isAuthenticated: true,
                  isLoading: false,
                  onboardingCompleted:
                    response.data.user.onboardingCompleted || false,
                  sessionToken: session.access_token,
                  sessionExpiresAt: new Date(
                    session.expires_at! * 1000,
                  ).toISOString(),
                });
                return;
              }
            } catch (error) {
              // Fallback to direct Supabase query
              const profilePromise = supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

              const { data: profile } = (await Promise.race([
                profilePromise,
                timeoutPromise,
              ])) as any;

              const user: User = {
                id: session.user.id,
                phoneNumber: session.user.phone || '',
                createdAt: session.user.created_at,
                updatedAt: session.user.updated_at || new Date().toISOString(),
                biometricEnabled: false,
                isVerified: true,
                profileData: {
                  firstName:
                    profile?.profile_data?.firstName ||
                    profile?.name?.split(' ')[0] ||
                    '',
                  lastName:
                    profile?.profile_data?.lastName ||
                    profile?.name?.split(' ').slice(1).join(' ') ||
                    '',
                },
              };

              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                onboardingCompleted: profile?.onboarding_completed || false,
                sessionToken: session.access_token,
                sessionExpiresAt: new Date(
                  session.expires_at! * 1000,
                ).toISOString(),
              });
              return;
            }
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Onboarding actions
      setOnboardingCompleted: onboardingCompleted => {
        set({ onboardingCompleted });
      },

      setUserName: userName => {
        set({ userName });
      },

      setNotificationPermission: notificationsEnabled => {
        set({ notificationsEnabled });
      },

      completeOnboarding: async () => {
        try {
          const user = get().user;
          const userName = get().userName;
          const notificationsEnabled = get().notificationsEnabled;

          if (!user) {
            throw new Error('User not authenticated');
          }

          // Call API to complete onboarding using apiClient
          const response = (await apiClient.put('/api/users/onboarding', {
            firstName: userName || 'User',
            notificationsEnabled: notificationsEnabled || false,
          })) as {
            success: boolean;
            error?: { message?: string };
            data?: { user: any };
          };

          if (response.success) {
            // Update the user data with the response from the API
            if (response.data?.user) {
              const updatedUser: User = {
                ...user,
                profileData: {
                  firstName: response.data.user.firstName || userName || '',
                  lastName: response.data.user.lastName || '',
                },
              };
              set({
                onboardingCompleted: true,
                user: updatedUser,
              });
            } else {
              set({ onboardingCompleted: true });
            }
          } else {
            throw new Error(
              response.error?.message || 'Failed to complete onboarding',
            );
          }
        } catch (error) {
          // Still mark as completed locally even if API fails
          set({ onboardingCompleted: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        onboardingCompleted: state.onboardingCompleted,
        userName: state.userName,
        notificationsEnabled: state.notificationsEnabled,
        sessionToken: state.sessionToken,
        sessionExpiresAt: state.sessionExpiresAt,
      }),
    },
  ),
);

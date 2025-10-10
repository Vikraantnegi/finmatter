'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@finmatter/types';
import { supabase } from '@/lib/supabase';
import { expiringStorage } from '@/lib/expiringStorage';
import { apiClient } from '@/lib/apiClient';

// Extended user type for API responses that include onboarding status
interface UserWithOnboarding extends User {
  onboardingCompleted?: boolean;
  firstName?: string;
  lastName?: string;
  name?: string;
}

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
  refreshSession: () => void;
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
      isLoading: true,
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

      refreshSession: () => {
        const { sessionToken } = get();
        if (sessionToken) {
          const newExpiresAt = new Date(
            Date.now() + 10 * 24 * 60 * 60 * 1000,
          ).toISOString();
          set({ sessionExpiresAt: newExpiresAt });
          // Also extend in storage
          expiringStorage.extendExpiry('auth-storage');
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
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
        } catch (error) {
          console.error('Error signing out:', error);
        }
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
          console.log('AuthStore: Starting auth initialization');
          set({ isLoading: true });

          // Check if we have a valid session from persisted state
          const { sessionToken, sessionExpiresAt, user } = get();
          console.log('AuthStore: Checking persisted state', {
            sessionToken: !!sessionToken,
            sessionExpiresAt,
            user: !!user,
          });

          if (sessionToken && sessionExpiresAt && user) {
            const now = new Date();
            const expiresAt = new Date(sessionExpiresAt);

            if (now < expiresAt) {
              // Session is still valid, refresh it and fetch fresh user data
              console.log('AuthStore: Session is valid, refreshing and fetching user data');
              get().refreshSession();
              
              // Fetch fresh user profile data from our API
              try {
                const response = await apiClient.get(`/api/users/${user.id}`) as { 
                  success: boolean; 
                  data?: { user: UserWithOnboarding }; 
                  error?: any 
                };
                if (response.success && response.data?.user) {
                  console.log('AuthStore: Fresh user data fetched:', response.data.user);
                  set({
                    user: response.data.user,
                    isAuthenticated: true,
                    isLoading: false,
                    onboardingCompleted: response.data.user.onboardingCompleted || false,
                  });
                  return;
                }
              } catch (error) {
                console.warn('AuthStore: Failed to fetch fresh user data, using cached data:', error);
                set({ isLoading: false });
                return;
              }
            } else {
              // Session expired, clear it
              console.log('AuthStore: Session expired, clearing');
              get().clearSession();
            }
          }

          // Check if Supabase is properly configured
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          console.log('AuthStore: Supabase config check', {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey,
            urlLength: supabaseUrl?.length || 0,
          });

          if (!supabaseUrl || !supabaseKey || supabaseUrl.length < 10) {
            console.warn(
              'AuthStore: Supabase not properly configured, skipping session check',
            );
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

          console.log('AuthStore: Attempting to get Supabase session...');
          const sessionPromise = supabase.auth.getSession();

          const {
            data: { session },
          } = (await Promise.race([sessionPromise, timeoutPromise])) as any;
          console.log('AuthStore: Supabase session result:', {
            hasSession: !!session,
            hasUser: !!session?.user,
          });

          if (session?.user) {
            console.log('AuthStore: Found Supabase session, fetching profile from API');
            
            // Set the auth token for API calls
            apiClient.setAuthToken(session.access_token);
            
            try {
              // Fetch user profile from our API endpoint
              const response = await apiClient.get(`/api/users/${session.user.id}`) as { 
                success: boolean; 
                data?: { user: UserWithOnboarding }; 
                error?: any 
              };
              if (response.success && response.data?.user) {
                console.log('AuthStore: User profile fetched from API:', response.data.user);
                
                set({
                  user: response.data.user,
                  isAuthenticated: true,
                  isLoading: false,
                  onboardingCompleted: response.data.user.onboardingCompleted || false,
                  sessionToken: session.access_token,
                  sessionExpiresAt: new Date(session.expires_at! * 1000).toISOString(),
                });
                return;
              }
            } catch (error) {
              console.warn('AuthStore: Failed to fetch user profile from API, falling back to Supabase:', error);
              
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
                  firstName: profile?.profile_data?.firstName || profile?.name?.split(' ')[0] || '',
                  lastName: profile?.profile_data?.lastName || profile?.name?.split(' ').slice(1).join(' ') || '',
                },
              };

              set({
                user,
                isAuthenticated: true,
                isLoading: false,
                onboardingCompleted: profile?.onboarding_completed || false,
                sessionToken: session.access_token,
                sessionExpiresAt: new Date(session.expires_at! * 1000).toISOString(),
              });
              return;
            }
          } else {
            console.log('AuthStore: No Supabase session found');
            console.log('AuthStore: Setting isLoading to false');
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          console.log('AuthStore: Setting isLoading to false after error');
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
          const response = await apiClient.put('/api/users/onboarding', {
            firstName: userName || 'User',
            notificationsEnabled: notificationsEnabled || false,
          }) as { success: boolean; error?: { message?: string }; data?: { user: any } };

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
                user: updatedUser 
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
          console.error('Error completing onboarding:', error);
          // Still mark as completed locally even if API fails
          set({ onboardingCompleted: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: expiringStorage,
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

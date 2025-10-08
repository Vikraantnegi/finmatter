'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@finmatter/types';
import { supabase } from '@/lib/supabase';
import { expiringStorage } from '@/lib/expiringStorage';

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
          const newExpiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
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
          set({ isLoading: true });

          // Check if we have a valid session from persisted state
          const { sessionToken, sessionExpiresAt, user } = get();
          
          if (sessionToken && sessionExpiresAt && user) {
            const now = new Date();
            const expiresAt = new Date(sessionExpiresAt);
            
            if (now < expiresAt) {
              // Session is still valid, refresh it
              get().refreshSession();
              set({ isLoading: false });
              return;
            } else {
              // Session expired, clear it
              get().clearSession();
            }
          }

          // No valid session, check Supabase session
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            // Fetch user profile
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const user: User = {
              id: session.user.id,
              phoneNumber: session.user.phone || '',
              createdAt: session.user.created_at,
              updatedAt: session.user.updated_at || new Date().toISOString(),
              biometricEnabled: false,
              isVerified: true,
              profileData: {
                firstName: profile?.first_name || '',
                lastName: profile?.last_name || '',
              },
            };

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              onboardingCompleted: profile?.onboarding_completed || false,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
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

          // Call API to complete onboarding
          const token = localStorage.getItem('auth-token');
          if (!token) {
            throw new Error('No auth token found');
          }

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/users/onboarding`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                firstName: userName || 'User',
                notificationsEnabled: notificationsEnabled || false,
              }),
            },
          );

          if (!response.ok) {
            throw new Error('Failed to complete onboarding');
          }

          const data = await response.json();

          if (data.success) {
            set({ onboardingCompleted: true });
          } else {
            throw new Error(
              data.error?.message || 'Failed to complete onboarding',
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

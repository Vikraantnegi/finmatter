/**
 * Supabase Mobile Client
 * Configured for React Native with secure storage
 */

import { createClient } from '@supabase/supabase-js';
import { MMKV } from 'react-native-mmkv';

// Secure storage instance for auth tokens
const storage = new MMKV({
  id: 'finmatter-supabase',
  encryptionKey: 'finmatter-supabase-key',
});

// Custom storage adapter for Supabase
const customStorage = {
  getItem: (key: string) => {
    return storage.getString(key) || null;
  },
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
};

// Environment variables for Supabase configuration
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Supabase client for React Native
 * Uses MMKV for secure token storage
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Type exports
export type { User, Session } from '@supabase/supabase-js';

/**
 * Helper function to get current session
 */
export const getCurrentSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return session;
};

/**
 * Helper function to sign out and clear storage
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }

  // Clear any additional app-specific storage
  storage.clearAll();
};

/**
 * Helper function to check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return !!session;
};

/**
 * Helper function to get current user
 */
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting user:', error);
    return null;
  }

  return user;
};

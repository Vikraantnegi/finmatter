/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Authentication Provider
 * Manages user authentication state and context
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { MMKV } from 'react-native-mmkv';

// Types
import { User, UserSession } from '@finmatter/types';

// Services
import { authService } from '../services/AuthService';

interface AuthContextType {
  user: User | null;
  session: UserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    userData?: Partial<User>,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage instance
const storage = new MMKV({
  id: 'finmatter-auth',
  encryptionKey: 'finmatter-auth-key',
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!session;

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = storage.getString('user');
        const storedSession = storage.getString('session');

        if (storedUser && storedSession) {
          const userData = JSON.parse(storedUser);
          const sessionData = JSON.parse(storedSession);

          // Check if session is still valid
          if (
            sessionData.expiresAt &&
            new Date(sessionData.expiresAt) > new Date()
          ) {
            setUser(userData);
            setSession(sessionData);
          } else {
            // Try to refresh token
            try {
              await refreshToken();
            } catch {
              // Clear invalid session
              storage.delete('user');
              storage.delete('session');
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear corrupted data
        storage.delete('user');
        storage.delete('session');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password);

      setUser(response.user);
      setSession(response.session);

      // Store in secure storage
      storage.set('user', JSON.stringify(response.user));
      storage.set('session', JSON.stringify(response.session));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    userData?: Partial<User>,
  ): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.signup(email, password, userData);

      setUser(response.user);
      setSession(response.session);

      // Store in secure storage
      storage.set('user', JSON.stringify(response.user));
      storage.set('session', JSON.stringify(response.session));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (session?.token) {
        await authService.logout(session.token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and storage
      setUser(null);
      setSession(null);
      storage.delete('user');
      storage.delete('session');
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      if (!session?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(session.refreshToken);

      setSession(response.session);
      storage.set('session', JSON.stringify(response.session));
    } catch (error) {
      // Refresh failed, logout user
      await logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

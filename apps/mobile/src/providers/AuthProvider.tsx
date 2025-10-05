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

interface AuthContextType {
  user: AuthUserProfile | null;
  session: AuthUserSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [session, setSession] = useState<AuthUserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const logout = async (): Promise<void> => {
    try {
      await authService.clearUserSession();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    logout,
    checkAuthStatus,
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

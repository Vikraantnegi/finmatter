/**
 * Authentication Manager
 * Centralized authentication state and token management
 */

import { User } from '@finmatter/types';
import { apiClient } from './apiClient';

export interface AuthSession {
  token: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
}

class AuthManager {
  private static instance: AuthManager;
  private authState: AuthState = {
    user: null,
    session: null,
    isLoading: false,
    isAuthenticated: false,
    onboardingCompleted: false,
  };

  private listeners: Set<(state: AuthState) => void> = new Set();

  private constructor() {
    this.initializeFromStorage();
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * Initialize auth state from localStorage
   */
  private initializeFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('finmatter-auth');
      if (stored) {
        const data = JSON.parse(stored);
        this.authState = {
          ...this.authState,
          ...data,
          isLoading: false,
        };
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to initialize auth from storage:', error);
      this.clearAuth();
    }
  }

  /**
   * Save auth state to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const dataToStore = {
        user: this.authState.user,
        session: this.authState.session,
        isAuthenticated: this.authState.isAuthenticated,
        onboardingCompleted: this.authState.onboardingCompleted,
      };
      localStorage.setItem('finmatter-auth', JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to save auth to storage:', error);
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authState));
  }

  /**
   * Subscribe to auth state changes
   */
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.authState);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current auth state
   */
  public getState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Check if current session is valid
   */
  public isSessionValid(): boolean {
    if (!this.authState.session) return false;

    const now = new Date();
    const expiresAt = new Date(this.authState.session.expiresAt);

    // Check if token expires within 5 minutes (refresh threshold)
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    return expiresAt > fiveMinutesFromNow;
  }

  /**
   * Check if session is expired
   */
  public isSessionExpired(): boolean {
    if (!this.authState.session) return true;

    const now = new Date();
    const expiresAt = new Date(this.authState.session.expiresAt);

    return now >= expiresAt;
  }

  /**
   * Validate token with server
   */
  public async validateToken(): Promise<boolean> {
    if (!this.authState.session?.token || !this.authState.user?.id) {
      return false;
    }

    try {
      // Make a request to get user profile to validate token
      const response = await apiClient.get(`/api/users/${this.authState.user.id}`) as {
        success: boolean;
        data?: any;
        error?: any;
      };
      return response.success;
    } catch (error) {
      console.warn('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Set authentication state
   */
  public setAuthState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates };
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Set user session
   */
  public setSession(session: AuthSession, user: User): void {
    this.authState = {
      ...this.authState,
      session,
      user,
      isAuthenticated: true,
      isLoading: false,
    };
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Update user data
   */
  public updateUser(user: User): void {
    this.authState = {
      ...this.authState,
      user,
    };
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Set loading state
   */
  public setLoading(isLoading: boolean): void {
    this.authState = {
      ...this.authState,
      isLoading,
    };
    this.notifyListeners();
  }

  /**
   * Clear authentication state
   */
  public clearAuth(): void {
    this.authState = {
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      onboardingCompleted: false,
    };

    if (typeof window !== 'undefined') {
      localStorage.removeItem('finmatter-auth');
    }

    this.notifyListeners();
  }

  /**
   * Initialize authentication on app start
   */
  public async initializeAuth(): Promise<void> {
    this.setLoading(true);

    try {
      // Check if we have a stored session
      if (this.authState.session && this.authState.user) {
        // Check if session is expired
        if (this.isSessionExpired()) {
          console.log('AuthManager: Session expired, clearing auth');
          this.clearAuth();
          return;
        }

        // Validate token with server
        const isValid = await this.validateToken();
        if (!isValid) {
          console.log('AuthManager: Token validation failed, clearing auth');
          this.clearAuth();
          return;
        }

        // Session is valid, fetch fresh user data
        try {
          const response = await apiClient.get(`/api/users/${this.authState.user.id}`) as {
            success: boolean;
            data?: { user: any };
            error?: any;
          };
          if (response.success && response.data?.user) {
            this.updateUser(response.data.user);
            console.log('AuthManager: Fresh user data fetched');
          }
        } catch (error) {
          console.warn('AuthManager: Failed to fetch fresh user data:', error);
        }

        console.log('AuthManager: Authentication initialized successfully');
        return;
      }

      // No stored session, check Supabase
      console.log('AuthManager: No stored session, checking Supabase...');
      // This will be handled by the existing Supabase flow
      this.setLoading(false);
    } catch (error) {
      console.error('AuthManager: Failed to initialize auth:', error);
      this.clearAuth();
    }
  }

  /**
   * Refresh session (extend expiry)
   */
  public refreshSession(): void {
    if (!this.authState.session) return;

    const newExpiresAt = new Date(
      Date.now() + 10 * 24 * 60 * 60 * 1000, // 10 days
    ).toISOString();

    this.authState = {
      ...this.authState,
      session: {
        ...this.authState.session,
        expiresAt: newExpiresAt,
      },
    };

    this.saveToStorage();
    this.notifyListeners();
  }
}

export const authManager = AuthManager.getInstance();

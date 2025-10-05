/**
 * Authentication Service
 * Handles API calls for phone-based authentication with OTP
 */

import { apiClient } from '@finmatter/shared';
import type {
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  AuthUserProfile,
  AuthUserSession,
} from '@finmatter/types';
import { storage } from '../lib/storage';

class AuthService {
  /**
   * Sends OTP to the provided phone number
   */
  async sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
    const response = await apiClient.post<SendOTPResponse>('/auth/send-otp', {
      phoneNumber,
    } as SendOTPRequest);

    return response.data || response;
  }

  /**
   * Verifies OTP and creates user session
   */
  async verifyOTP(
    phoneNumber: string,
    otp: string,
  ): Promise<VerifyOTPResponse> {
    const response = await apiClient.post<VerifyOTPResponse>(
      '/auth/verify-otp',
      {
        phoneNumber,
        otp,
      } as VerifyOTPRequest,
    );

    return response.data || response;
  }

  /**
   * Stores user session securely on device
   */
  async storeUserSession(data: {
    user: AuthUserProfile;
    session: AuthUserSession;
  }): Promise<void> {
    try {
      await storage.set('user_session', data);
      await storage.set('access_token', data.session.token);
      await storage.set('refresh_token', data.session.refreshToken);
      await storage.set('user_profile', data.user);
    } catch (error) {
      console.error('Failed to store user session:', error);
      throw new Error('Failed to save authentication data');
    }
  }

  /**
   * Retrieves stored user session
   */
  async getUserSession(): Promise<{
    user: AuthUserProfile;
    session: AuthUserSession;
  } | null> {
    try {
      const userSession = await storage.get<{
        user: AuthUserProfile;
        session: AuthUserSession;
      }>('user_session');
      return userSession || null;
    } catch (error) {
      console.error('Failed to retrieve user session:', error);
      return null;
    }
  }

  /**
   * Updates user's biometric preference
   */
  async updateBiometricPreference(
    userId: string,
    enabled: boolean,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current session
      const session = await this.getUserSession();
      if (!session) {
        return { success: false, error: 'No active session' };
      }

      // Update preference via API (this would be a new endpoint)
      // For now, we'll update the local storage
      const updatedUser = {
        ...session.user,
        biometricEnabled: enabled,
      };

      await storage.set('user_profile', updatedUser);
      const updatedSession = {
        ...session,
        user: updatedUser,
      };
      await storage.set('user_session', updatedSession);

      return { success: true };
    } catch (error) {
      console.error('Failed to update biometric preference:', error);
      return { success: false, error: 'Failed to update preference' };
    }
  }

  /**
   * Clears stored user session
   */
  async clearUserSession(): Promise<void> {
    try {
      await storage.delete('user_session');
      await storage.delete('access_token');
      await storage.delete('refresh_token');
      await storage.delete('user_profile');
    } catch (error) {
      console.error('Failed to clear user session:', error);
    }
  }

  /**
   * Checks if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await this.getUserSession();
      return !!session;
    } catch {
      return false;
    }
  }

  /**
   * Gets stored access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await storage.get<string>('access_token');
    } catch {
      return null;
    }
  }

  /**
   * Gets stored refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await storage.get<string>('refresh_token');
    } catch {
      return null;
    }
  }

  /**
   * Gets stored user profile
   */
  async getUserProfile(): Promise<AuthUserProfile | null> {
    try {
      return await storage.get<AuthUserProfile>('user_profile');
    } catch {
      return null;
    }
  }

  /**
   * Updates user profile (name, email, onboarding status)
   */
  async updateUserProfile(data: {
    name?: string;
    email?: string;
    onboardingCompleted?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current session
      const session = await this.getUserSession();
      if (!session) {
        return { success: false, error: 'No active session' };
      }

      // Update user profile via API
      const response = await apiClient.put('/users/profile', data);

      // Check if response indicates success (assuming response.data contains the result)
      if (response.data || response.status === 200) {
        // Update local storage
        const updatedUser = {
          ...session.user,
          // Note: AuthUserProfile doesn't have these fields yet
          // This will be updated when we extend the type
        };

        await storage.set('user_profile', updatedUser);
        const updatedSession = {
          ...session,
          user: updatedUser,
        };
        await storage.set('user_session', updatedSession);

        return { success: true };
      } else {
        return { success: false, error: 'Failed to update profile' };
      }
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }
}

export const authService = new AuthService();

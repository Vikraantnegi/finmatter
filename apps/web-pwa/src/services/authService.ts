import { apiClient } from '@/lib/apiClient';
import { SendOTPResponse, VerifyOTPResponse } from '@finmatter/types';
import { retryWithBackoff, handleApiError, logError } from '@/lib/errorHandler';

export class AuthService {
  async sendOTP(phone: string): Promise<SendOTPResponse> {
    try {
      const response = await retryWithBackoff(async () => {
        return await apiClient.post<SendOTPResponse>('/api/auth/send-otp', {
          phoneNumber: phone,
        });
      });
      return response;
    } catch (error) {
      logError(error, {
        endpoint: '/api/auth/send-otp',
        phoneNumber: phone,
        additionalData: { operation: 'sendOTP' },
      });

      const errorInfo = handleApiError(error);
      throw new Error(errorInfo.message);
    }
  }

  async verifyOTP(phone: string, otp: string): Promise<VerifyOTPResponse> {
    try {
      const response = await retryWithBackoff(async () => {
        return await apiClient.post<VerifyOTPResponse>('/api/auth/verify-otp', {
          phoneNumber: phone,
          otp,
        });
      });
      return response;
    } catch (error) {
      logError(error, {
        endpoint: '/api/auth/verify-otp',
        phoneNumber: phone,
        additionalData: {
          operation: 'verifyOTP',
          otp: `${otp.substring(0, 2)}****`,
        },
      });

      const errorInfo = handleApiError(error);
      throw new Error(errorInfo.message);
    }
  }

  async signOut(): Promise<void> {
    try {
      await apiClient.post('/api/auth/signout');
      apiClient.clearAuthToken();
    } catch (error) {
      logError(error, {
        endpoint: '/api/auth/signout',
        additionalData: { operation: 'signOut' },
      });

      // Don't throw error for sign out - always clear local state
      apiClient.clearAuthToken();
    }
  }

  async getCurrentUser(userId: string): Promise<any> {
    try {
      const response = await retryWithBackoff(async () => {
        return await apiClient.get(`/api/users/${userId}`);
      });
      return response;
    } catch (error) {
      logError(error, {
        endpoint: `/api/users/${userId}`,
        additionalData: { operation: 'getCurrentUser' },
      });

      const errorInfo = handleApiError(error);
      throw new Error(errorInfo.message);
    }
  }

  async completeOnboarding(userData: {
    firstName: string;
    lastName?: string;
    notificationsEnabled: boolean;
  }): Promise<any> {
    try {
      const response = await apiClient.put('/api/users/onboarding', userData);
      return response;
    } catch (error) {
      console.error('Complete onboarding error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();

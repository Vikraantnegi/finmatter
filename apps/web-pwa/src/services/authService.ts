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

      // Return error response instead of throwing
      const errorInfo = handleApiError(error);
      return {
        success: false,
        error: {
          code: errorInfo.code,
          message: errorInfo.message,
          statusCode: (error as any)?.response?.status || 500,
        },
        timestamp: new Date().toISOString(),
      } as SendOTPResponse;
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
    } catch (error: any) {
      logError(error, {
        endpoint: '/api/auth/verify-otp',
        phoneNumber: phone,
        additionalData: {
          operation: 'verifyOTP',
          otp: `${otp.substring(0, 2)}****`,
        },
      });

      // Check if API already returned an error response structure
      // (Sometimes axios doesn't throw, just returns error response)
      if (error?.response?.data && typeof error.response.data === 'object') {
        const apiResponse = error.response.data;

        // If it's already in our ApiResponse format, return it
        if ('success' in apiResponse && 'error' in apiResponse) {
          return apiResponse as VerifyOTPResponse;
        }
      }

      // Otherwise, construct error response from error details
      const errorInfo = handleApiError(error);

      // Also check what the actual API error structure is
      const apiError = error?.response?.data?.error;
      const errorCode = apiError?.code || errorInfo.code;
      const errorMessage = apiError?.message || errorInfo.message;

      console.log('AuthService verifyOTP error details:', {
        error,
        response: error?.response,
        responseData: error?.response?.data,
        apiError,
        extractedCode: errorCode,
        extractedMessage: errorMessage,
      });

      return {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          statusCode: error?.response?.status || 500,
          details: apiError?.details || error?.response?.data.as?.details,
        },
        timestamp: new Date().toISOString(),
      } as VerifyOTPResponse;
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

  /**
   * Refresh access token using httpOnly refresh token cookie
   * No need to pass refresh token - it's automatically sent via cookie
   */
  async refreshToken(): Promise<any> {
    try {
      const response = await retryWithBackoff(async () => {
        // Empty body - refresh token comes from httpOnly cookie
        return await apiClient.post('/api/auth/refresh', {});
      });
      return response;
    } catch (error) {
      logError(error, {
        endpoint: '/api/auth/refresh',
        additionalData: { operation: 'refreshToken' },
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
    const response = await apiClient.put('/api/users/onboarding', userData);
    return response;
  }
}

export const authService = new AuthService();

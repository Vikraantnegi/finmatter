import { apiClient } from '@/lib/apiClient';
import { SendOTPResponse, VerifyOTPResponse } from '@finmatter/types';
import { retryWithBackoff, handleApiError, logError } from '@/lib/errorHandler';
import { API_ROUTES } from '@/constants/apiRoutes';

export class AuthService {
  async sendOTP(phone: string): Promise<SendOTPResponse> {
    try {
      const response = await retryWithBackoff(async () => {
        return await apiClient.post<SendOTPResponse>(API_ROUTES.AUTH.SEND_OTP, {
          phoneNumber: phone,
        });
      });
      return response;
    } catch (error) {
      logError(error, {
        endpoint: API_ROUTES.AUTH.SEND_OTP,
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
        return await apiClient.post<VerifyOTPResponse>(
          API_ROUTES.AUTH.VERIFY_OTP,
          {
            phoneNumber: phone,
            otp,
          },
        );
      });
      return response;
    } catch (error: any) {
      logError(error, {
        endpoint: API_ROUTES.AUTH.VERIFY_OTP,
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
      await apiClient.post(API_ROUTES.AUTH.SIGN_OUT);
      apiClient.clearAuthToken();
    } catch (error) {
      logError(error, {
        endpoint: API_ROUTES.AUTH.SIGN_OUT,
        additionalData: { operation: 'signOut' },
      });

      // Don't throw error for sign out - always clear local state
      apiClient.clearAuthToken();
    }
  }

  async getCurrentUser(userId: string): Promise<any> {
    try {
      const response = await retryWithBackoff(async () => {
        return await apiClient.get(API_ROUTES.USER.BY_ID(userId));
      });
      return response;
    } catch (error) {
      logError(error, {
        endpoint: API_ROUTES.USER.BY_ID(userId),
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
        return await apiClient.post(API_ROUTES.AUTH.REFRESH_TOKEN, {});
      });
      return response;
    } catch (error) {
      logError(error, {
        endpoint: API_ROUTES.AUTH.REFRESH_TOKEN,
        additionalData: { operation: 'refreshToken' },
      });

      const errorInfo = handleApiError(error);
      throw new Error(errorInfo.message);
    }
  }

  async completeOnboarding(userData: {
    firstName: string;
    lastName?: string;
    avatar?: string;
    notificationsEnabled: boolean;
    locationEnabled?: boolean;
    smsEnabled?: boolean;
  }): Promise<any> {
    const response = await apiClient.put(API_ROUTES.USER.ONBOARDING, userData);
    return response;
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatar?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    preferences?: {
      notifications?: {
        push?: {
          enabled?: boolean;
        };
        email?: {
          enabled?: boolean;
        };
      };
    };
  }): Promise<any> {
    const response = await apiClient.put(API_ROUTES.USER.PROFILE, data);
    return response;
  }
}

export const authService = new AuthService();

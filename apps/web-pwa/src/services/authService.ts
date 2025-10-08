import { apiClient } from '@/lib/apiClient';
import { SendOTPResponse, VerifyOTPResponse } from '@finmatter/types';

export class AuthService {
  async sendOTP(phone: string): Promise<SendOTPResponse> {
    try {
      const response = await apiClient.post<SendOTPResponse>('/api/auth/send-otp', {
        phoneNumber: phone,
      });
      return response;
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  }

  async verifyOTP(phone: string, otp: string): Promise<VerifyOTPResponse> {
    try {
      const response = await apiClient.post<VerifyOTPResponse>('/api/auth/verify-otp', {
        phoneNumber: phone,
        otp,
      });
      return response;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await apiClient.post('/api/auth/signout');
      apiClient.clearAuthToken();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();

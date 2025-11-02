/**
 * Authentication types for FinMatter
 * Phone-based OTP authentication
 */

import { User } from './user';

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode?: number;
    details?: any;
  };
  timestamp: string;
}

// OTP Auth Requests
export type SendOTPRequest = {
  phoneNumber: string;
};

export type VerifyOTPRequest = {
  phoneNumber: string;
  otp: string;
};

// OTP Auth Responses
export type SendOTPResponse = ApiResponse<{
  message: string;
  expiresIn: number; // seconds
}>;

export type VerifyOTPResponse = ApiResponse<{
  user: User;
  session: {
    token: string;
    expiresAt: string;
  };
}>;

// Refresh Token
export type RefreshTokenRequest = {
  refreshToken?: string; // Optional since it might come from cookie
};

export type RefreshTokenResponse = ApiResponse<{
  token: string;
  expiresAt: string;
}>;

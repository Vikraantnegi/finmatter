/**
 * Authentication types for FinMatter
 * Phone-based authentication system
 */

import type { ApiResponse } from './common';

// Phone Authentication Types
export type PhoneAuthRequest = {
  phoneNumber: string;
};

export type SendOTPRequest = PhoneAuthRequest;

export type SendOTPResponse = ApiResponse<{
  success: boolean;
  message: string;
  expiresIn: number; // seconds
}>;

export type VerifyOTPRequest = {
  phoneNumber: string;
  otp: string;
};

export type VerifyOTPResponse = ApiResponse<{
  user: {
    id: string;
    phoneNumber: string;
    isVerified: boolean;
    biometricEnabled: boolean;
    createdAt: string;
    lastLogin?: string;
  };
  session: {
    token: string;
    refreshToken: string;
    expiresAt: string;
  };
}>;

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = ApiResponse<{
  session: {
    token: string;
    refreshToken: string;
    expiresAt: string;
  };
}>;

export type LogoutRequest = {
  token: string;
};

export type LogoutResponse = ApiResponse<{
  success: boolean;
  message: string;
}>;

// Auth-specific User Profile Types (aligned with database schema)
export type AuthUserProfile = {
  id: string;
  phoneNumber: string;
  isVerified: boolean;
  biometricEnabled: boolean;
  createdAt: string;
  lastLogin?: string;
  updatedAt: string;
  lastOtpVerification?: string; // ISO date string of last OTP verification
  profileData?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatar?: string;
    dateOfBirth?: string;
    preferences?: AuthUserPreferences;
  };
};

export type AuthUserPreferences = {
  currency: string;
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    push: boolean;
    sms: boolean;
    email: boolean;
  };
  privacy: {
    hideCardNumbers: boolean;
    shareAnalytics: boolean;
    allowPersonalization: boolean;
  };
};

export type UpdateProfileRequest = {
  profileData?: Partial<AuthUserProfile['profileData']>;
  biometricEnabled?: boolean;
};

export type UpdateProfileResponse = ApiResponse<{
  user: AuthUserProfile;
}>;

// Auth Session Types
export type AuthUserSession = {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  deviceInfo?: {
    platform: string;
    version: string;
    deviceId: string;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt: string;
};

// Rate Limiting Types
export type RateLimitInfo = {
  attempts: number;
  remaining: number;
  resetTime: string;
  retryAfter?: number;
};

export type RateLimitResponse = {
  success: false;
  error: {
    code: 'RATE_LIMIT_EXCEEDED';
    message: string;
    retryAfter?: number;
  };
  rateLimit: RateLimitInfo;
};

// Error Types
export type AuthError = {
  code:
    | 'INVALID_OTP'
    | 'OTP_EXPIRED'
    | 'PHONE_NOT_FOUND'
    | 'RATE_LIMIT_EXCEEDED'
    | 'INVALID_TOKEN';
  message: string;
  details?: Record<string, any>;
};

export type AuthErrorResponse = {
  success: false;
  error: AuthError;
  timestamp: string;
};

/**
 * User types for FinMatter
 * Phone-based authentication system
 */

export enum OnboardingSteps {
  PROFILE = 'profile',
  LOCATION = 'location',
  NOTIFICATION = 'notification',
  SMS = 'sms',
}

export type User = {
  id: string;
  phoneNumber: string;
  isVerified: boolean;
  biometricEnabled: boolean;
  onboardingCompleted?: boolean;
  avatar?: string;
  notificationsEnabled?: boolean;
  locationEnabled?: boolean;
  smsEnabled?: boolean;
  profileData?: UserProfileData;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  // Extended fields
  firstName?: string;
  lastName?: string;
  name?: string;
};

export type UserProfileData = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  dateOfBirth?: string;
  preferences?: UserPreferences;
};

export type NotificationPreferences = {
  email: {
    enabled: boolean;
    transactions: boolean;
    goals: boolean;
    recommendations: boolean;
    security: boolean;
  };
  push: {
    enabled: boolean;
    transactions: boolean;
    goals: boolean;
    recommendations: boolean;
    security: boolean;
  };
  sms: {
    enabled: boolean;
    security: boolean;
    important: boolean;
  };
};

export type UserPreferences = {
  currency?: string;
  timezone?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  notifications?: NotificationPreferences;
  privacy?: {
    hideCardNumbers?: boolean;
    shareAnalytics?: boolean;
    allowPersonalization?: boolean;
  };
};

// Database user type (snake_case from Supabase)
export type DatabaseUser = {
  id: string;
  phone_number: string;
  created_at: string;
  last_login?: string;
  last_otp_verification?: string;
  biometric_enabled: boolean;
  is_verified: boolean;
  notifications_enabled: boolean;
  location_enabled: boolean;
  sms_enabled: boolean;
  profile_data?: UserProfileData;
  updated_at: string;
  onboarding_completed?: boolean;
};

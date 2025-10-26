import type { AuditFields, Currency } from './common';
/**
 * User-related types for FinMatter
 * Updated to align with phone authentication and database schema
 */
export type UserRole = 'user' | 'admin' | 'beta_tester';
export type UserStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending_verification';
export type CustomUsersTableUser = {
  id: string;
  phone_number: string;
  created_at: string;
  last_login?: string;
  biometric_enabled: boolean;
  is_verified: boolean;
  profile_data?: UserProfileData;
  updated_at: string;
  email?: string;
  notifications_enabled?: boolean;
  onboarding_completed?: boolean;
  last_otp_verification?: string;
};
export type User = {
  id: string;
  phoneNumber: string;
  createdAt: string;
  lastLogin?: string;
  biometricEnabled: boolean;
  isVerified: boolean;
  profileData?: UserProfileData;
  updatedAt: string;
};
export type UserProfileData = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  dateOfBirth?: string;
  preferences?: UserPreferences;
  subscription?: UserSubscription;
};
export type LegacyUser = AuditFields & {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: Date;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  dateOfBirth?: Date;
  preferences: UserPreferences;
  subscription?: UserSubscription;
};
export type UserPreferences = {
  currency: Currency;
  timezone: string;
  language: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  ui: UIPreferences;
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
export type PrivacyPreferences = {
  hideCardNumbers: boolean;
  shareAnalytics: boolean;
  allowPersonalization: boolean;
  dataRetention: '1_year' | '2_years' | '5_years' | 'indefinite';
};
export type UIPreferences = {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  showTutorials: boolean;
  hapticFeedback: boolean;
};
export type UserSubscription = {
  plan: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate?: Date;
  features: string[];
  limits: SubscriptionLimits;
};
export type SubscriptionLimits = {
  cards: number;
  transactions: number;
  aiQueries: number;
  statements: number;
  goals: number;
};
export type UserProfile = Pick<
  User,
  | 'id'
  | 'phoneNumber'
  | 'isVerified'
  | 'biometricEnabled'
  | 'profileData'
  | 'createdAt'
  | 'lastLogin'
>;
export type UserWithOnboarding = User & {
  onboardingCompleted?: boolean;
  firstName?: string;
  lastName?: string;
  name?: string;
};
export type CreateUserRequest = {
  phoneNumber: string;
  profileData?: Partial<UserProfileData>;
};
export type UpdateUserRequest = {
  profileData?: Partial<UserProfileData>;
  biometricEnabled?: boolean;
};
export type UserSession = {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  deviceInfo?: {
    platform: string;
    version: string;
    deviceId: string;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastUsedAt: Date;
};
//# sourceMappingURL=user.d.ts.map

import type { AuditFields, Currency } from './common';

/**
 * User-related types for FinMatter
 */

export type UserRole = 'user' | 'admin' | 'beta_tester';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export type User = AuditFields & {
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
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'displayName'
  | 'avatar'
  | 'preferences'
>;

export type CreateUserRequest = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  preferences?: Partial<UserPreferences>;
};

export type UpdateUserRequest = Partial<
  Pick<User, 'firstName' | 'lastName' | 'displayName' | 'avatar' | 'preferences'>
>;

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

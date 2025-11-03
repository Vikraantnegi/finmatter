/**
 * API Routes Constants
 * Centralized API endpoint definitions for type-safe route management
 */

// Auth Routes
export const AUTH_ROUTES = {
  SEND_OTP: '/api/auth/send-otp',
  VERIFY_OTP: '/api/auth/verify-otp',
  REFRESH_TOKEN: '/api/auth/refresh',
  SIGN_OUT: '/api/auth/signout',
} as const;

// User Routes
export const USER_ROUTES = {
  // Static routes
  ONBOARDING: '/api/users/onboarding',
  PROFILE: '/api/users/profile',

  // Dynamic route builders
  BY_ID: (userId: string) => `/api/users/${userId}` as const,
  DELETE: (userId: string) => `/api/users/${userId}` as const,
} as const;

// Health Routes
export const HEALTH_ROUTES = {
  CHECK: '/api/health',
} as const;

// Card Routes
export const CARD_ROUTES = {
  BIN_LOOKUP: '/api/cards/bin-lookup',
  LIST: '/api/cards',
  ADD: '/api/cards',
  BY_ID: (cardId: string) => `/api/cards/${cardId}` as const,
  UPDATE: (cardId: string) => `/api/cards/${cardId}` as const,
  DELETE: (cardId: string) => `/api/cards/${cardId}` as const,
} as const;

// Combined API Routes object
export const API_ROUTES = {
  AUTH: AUTH_ROUTES,
  USER: USER_ROUTES,
  HEALTH: HEALTH_ROUTES,
  CARD: CARD_ROUTES,
} as const;

// Type helpers for route parameters
export type UserId = string;

// Helper type to extract route string types
export type ApiRoute =
  | (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES]
  | (typeof HEALTH_ROUTES)[keyof typeof HEALTH_ROUTES]
  | ReturnType<typeof USER_ROUTES.BY_ID>
  | ReturnType<typeof USER_ROUTES.DELETE>
  | typeof USER_ROUTES.ONBOARDING
  | typeof USER_ROUTES.PROFILE;

// Export individual route groups for convenience
export { AUTH_ROUTES as auth, USER_ROUTES as user, HEALTH_ROUTES as health };

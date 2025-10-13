/**
 * Standard API Response Types for FinMatter
 * Used across all API endpoints for consistency and type safety
 */

import type { User, UserWithOnboarding } from './user';
import type { Card, CardBenefit } from './card';

/**
 * Generic API response wrapper
 * All API endpoints should return this structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

/**
 * API error structure - designed to be user-friendly and actionable
 */
export interface ApiError {
  code: string; // Machine-readable error code (e.g., 'CARD_ALREADY_EXISTS')
  message: string; // Human-readable error message for display
  details?: any; // Additional error details (validation errors, etc.)
  field?: string; // Which field caused the error (for form validation highlighting)
  suggestion?: string; // What the user should do next (actionable guidance)
}

/**
 * API metadata for debugging, monitoring, and observability
 */
export interface ApiMeta {
  requestId?: string; // Unique request identifier for tracing
  timestamp: string; // ISO timestamp of response
  duration?: number; // Response time in milliseconds
  version?: string; // API version (for future versioning)
}

/**
 * Paginated response wrapper
 * Used for list endpoints that support pagination
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  limit: number; // Items per page
  offset: number; // Current offset
  total: number; // Total items available
  hasMore: boolean; // Whether more items exist
  page: number; // Current page number (1-indexed)
  totalPages: number; // Total number of pages
}

// ============================================
// AUTH API RESPONSES
// ============================================

export type SendOTPResponse = ApiResponse<{
  message: string;
  expiresIn: number; // Seconds until OTP expires
}>;

export type VerifyOTPResponse = ApiResponse<{
  user: User;
  session: {
    token: string;
    expiresAt: string;
  };
}>;

export type RefreshTokenResponse = ApiResponse<{
  session: {
    token: string;
    expiresAt: string;
  };
}>;

// ============================================
// USER API RESPONSES
// ============================================

export type GetUserResponse = ApiResponse<{ 
  user: UserWithOnboarding;
}>;

export type UpdateUserResponse = ApiResponse<{ 
  user: UserWithOnboarding;
}>;

export type CompleteOnboardingResponse = ApiResponse<{ 
  user: UserWithOnboarding;
}>;

// ============================================
// CARDS API RESPONSES
// ============================================

export type GetCardsResponse = ApiResponse<{
  cards: Card[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}>;

export type GetCardResponse = ApiResponse<{ 
  card: Card;
}>;

export type CreateCardResponse = ApiResponse<{ 
  card: Card;
}>;

export type UpdateCardResponse = ApiResponse<{ 
  card: Card;
}>;

export type DeleteCardResponse = ApiResponse<{ 
  message: string;
  card: Card;
}>;

// ============================================
// CARD BENEFITS API RESPONSES
// ============================================

export type CardBenefitResponse = {
  id: string;
  category: string;
  description: string;
  value: string;
  rewardRate: number;
  rewardType: string;
  rewardCap?: number | null;
  capPeriod?: string | null;
  conditions: string[];
  isActive: boolean;
};

export type CardMetadataResponse = {
  cardType: string;
  network: string;
  rewardType: string;
  annualFee: number;
  primaryColor?: string;
  secondaryColor?: string;
  description?: string;
  rewardRules?: Record<string, any>;
};

export type GetCardBenefitsResponse = ApiResponse<{
  cardId: string;
  cardName: string;
  bankName: string;
  benefits: CardBenefitResponse[];
  metadata?: CardMetadataResponse;
}>;

// ============================================
// HELPER TYPE GUARDS
// ============================================

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(
  response: ApiResponse<any>
): response is ApiResponse<any> & { success: false; error: ApiError } {
  return response.success === false && response.error !== undefined;
}

// ============================================
// ERROR CODES (for consistency)
// ============================================

export const API_ERROR_CODES = {
  // Auth errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  CARD_NOT_FOUND: 'CARD_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  BENEFIT_NOT_FOUND: 'BENEFIT_NOT_FOUND',
  
  // Conflict errors
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CARD_ALREADY_EXISTS: 'CARD_ALREADY_EXISTS',
  DUPLICATE_CARD: 'DUPLICATE_CARD',
  
  // Database errors
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_INSERT_FAILED: 'DB_INSERT_FAILED',
  DB_UPDATE_FAILED: 'DB_UPDATE_FAILED',
  DB_DELETE_FAILED: 'DB_DELETE_FAILED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Generic errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

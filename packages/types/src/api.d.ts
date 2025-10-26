/**
 * Standard API Response Types for FinMatter
 * Used across all API endpoints for consistency and type safety
 */
import type { User, UserWithOnboarding } from './user';
import type { Card } from './card';
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
  code: string;
  message: string;
  details?: any;
  field?: string;
  suggestion?: string;
}
/**
 * API metadata for debugging, monitoring, and observability
 */
export interface ApiMeta {
  requestId?: string;
  timestamp: string;
  duration?: number;
  version?: string;
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
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
  page: number;
  totalPages: number;
}
export type SendOTPResponse = ApiResponse<{
  message: string;
  expiresIn: number;
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
export type GetUserResponse = ApiResponse<{
  user: UserWithOnboarding;
}>;
export type UpdateUserResponse = ApiResponse<{
  user: UserWithOnboarding;
}>;
export type CompleteOnboardingResponse = ApiResponse<{
  user: UserWithOnboarding;
}>;
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
/**
 * Type guard to check if response is successful
 */
export declare function isSuccessResponse<T>(
  response: ApiResponse<T>,
): response is ApiResponse<T> & {
  success: true;
  data: T;
};
/**
 * Type guard to check if response is an error
 */
export declare function isErrorResponse(
  response: ApiResponse<any>,
): response is ApiResponse<any> & {
  success: false;
  error: ApiError;
};
export declare const API_ERROR_CODES: {
  readonly AUTH_REQUIRED: 'AUTH_REQUIRED';
  readonly INVALID_TOKEN: 'INVALID_TOKEN';
  readonly INVALID_OTP: 'INVALID_OTP';
  readonly OTP_EXPIRED: 'OTP_EXPIRED';
  readonly TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS';
  readonly VALIDATION_ERROR: 'VALIDATION_ERROR';
  readonly INVALID_INPUT: 'INVALID_INPUT';
  readonly MISSING_FIELD: 'MISSING_FIELD';
  readonly NOT_FOUND: 'NOT_FOUND';
  readonly CARD_NOT_FOUND: 'CARD_NOT_FOUND';
  readonly USER_NOT_FOUND: 'USER_NOT_FOUND';
  readonly BENEFIT_NOT_FOUND: 'BENEFIT_NOT_FOUND';
  readonly ALREADY_EXISTS: 'ALREADY_EXISTS';
  readonly CARD_ALREADY_EXISTS: 'CARD_ALREADY_EXISTS';
  readonly DUPLICATE_CARD: 'DUPLICATE_CARD';
  readonly DB_QUERY_FAILED: 'DB_QUERY_FAILED';
  readonly DB_INSERT_FAILED: 'DB_INSERT_FAILED';
  readonly DB_UPDATE_FAILED: 'DB_UPDATE_FAILED';
  readonly DB_DELETE_FAILED: 'DB_DELETE_FAILED';
  readonly RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED';
  readonly INTERNAL_ERROR: 'INTERNAL_ERROR';
  readonly NETWORK_ERROR: 'NETWORK_ERROR';
  readonly UNKNOWN_ERROR: 'UNKNOWN_ERROR';
};
export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
//# sourceMappingURL=api.d.ts.map

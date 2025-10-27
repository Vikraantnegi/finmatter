'use strict';
/**
 * Standard API Response Types for FinMatter
 * Used across all API endpoints for consistency and type safety
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.API_ERROR_CODES = void 0;
exports.isSuccessResponse = isSuccessResponse;
exports.isErrorResponse = isErrorResponse;
// ============================================
// HELPER TYPE GUARDS
// ============================================
/**
 * Type guard to check if response is successful
 */
function isSuccessResponse(response) {
  return response.success === true && response.data !== undefined;
}
/**
 * Type guard to check if response is an error
 */
function isErrorResponse(response) {
  return response.success === false && response.error !== undefined;
}
// ============================================
// ERROR CODES (for consistency)
// ============================================
exports.API_ERROR_CODES = {
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
};
//# sourceMappingURL=api.js.map

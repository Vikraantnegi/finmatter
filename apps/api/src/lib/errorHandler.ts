/**
 * Enhanced Error Handling Library
 * Provides structured error responses and logging
 */

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
  statusCode?: number;
}

export interface ErrorResponse {
  success: false;
  error: ApiError;
  meta?: {
    retryable: boolean;
    retryAfter?: number;
    supportUrl?: string;
  };
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error types
export const ErrorCodes = {
  // Authentication errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PHONE_NUMBER: 'INVALID_PHONE_NUMBER',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_SEND_FAILED: 'OTP_SEND_FAILED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  USER_CREATION_FAILED: 'USER_CREATION_FAILED',
  SESSION_CREATION_FAILED: 'SESSION_CREATION_FAILED',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SMS_RATE_LIMIT_EXCEEDED: 'SMS_RATE_LIMIT_EXCEEDED',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  DUPLICATE_USER: 'DUPLICATE_USER',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export const ErrorMessages = {
  [ErrorCodes.VALIDATION_ERROR]: 'Invalid request data provided',
  [ErrorCodes.INVALID_PHONE_NUMBER]:
    'Invalid phone number format. Please check your number and try again',
  [ErrorCodes.INVALID_OTP]: 'Invalid OTP. Please check and try again',
  [ErrorCodes.OTP_EXPIRED]: 'OTP has expired. Please request a new one',
  [ErrorCodes.OTP_SEND_FAILED]: 'Failed to send OTP. Please try again',
  [ErrorCodes.VERIFICATION_FAILED]: 'OTP verification failed. Please try again',
  [ErrorCodes.USER_CREATION_FAILED]: 'Failed to create user account',
  [ErrorCodes.SESSION_CREATION_FAILED]: 'Failed to create session',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment',
  [ErrorCodes.SMS_RATE_LIMIT_EXCEEDED]:
    'Too many SMS requests. Please wait a few minutes',
  [ErrorCodes.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCodes.USER_NOT_FOUND]: 'User not found',
  [ErrorCodes.DUPLICATE_USER]: 'User already exists',
  [ErrorCodes.NETWORK_ERROR]: 'Network error. Please check your connection',
  [ErrorCodes.TIMEOUT_ERROR]: 'Request timeout. Please try again',
  [ErrorCodes.INTERNAL_ERROR]: 'An unexpected error occurred',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
} as const;

/**
 * Create a structured error response
 */
export function createErrorResponse(
  code: keyof typeof ErrorCodes,
  message?: string,
  details?: any,
  options?: {
    statusCode?: number;
    retryable?: boolean;
    retryAfter?: number;
    requestId?: string;
  },
): ErrorResponse {
  const errorMessage = message || ErrorMessages[code];
  const statusCode = options?.statusCode || getDefaultStatusCode(code);

  const error: any = {
    code,
    statusCode,
    message: errorMessage,
    details,
    timestamp: new Date().toISOString(),
  };

  if (options?.requestId) {
    error.requestId = options.requestId;
  }

  const meta: any = {
    retryable: options?.retryable ?? isRetryableError(code),
    supportUrl: 'https://finmatter.com/support',
  };

  if (options?.retryAfter !== undefined) {
    meta.retryAfter = options.retryAfter;
  }

  return {
    success: false,
    error,
    meta,
  };
}

/**
 * Get default status code for error type
 */
function getDefaultStatusCode(code: keyof typeof ErrorCodes): number {
  const statusMap: Record<string, number> = {
    [ErrorCodes.VALIDATION_ERROR]: 400,
    [ErrorCodes.INVALID_PHONE_NUMBER]: 422,
    [ErrorCodes.INVALID_OTP]: 400,
    [ErrorCodes.OTP_EXPIRED]: 400,
    [ErrorCodes.OTP_SEND_FAILED]: 500,
    [ErrorCodes.VERIFICATION_FAILED]: 500,
    [ErrorCodes.USER_CREATION_FAILED]: 500,
    [ErrorCodes.SESSION_CREATION_FAILED]: 500,
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
    [ErrorCodes.SMS_RATE_LIMIT_EXCEEDED]: 429,
    [ErrorCodes.DATABASE_ERROR]: 500,
    [ErrorCodes.USER_NOT_FOUND]: 404,
    [ErrorCodes.DUPLICATE_USER]: 409,
    [ErrorCodes.NETWORK_ERROR]: 503,
    [ErrorCodes.TIMEOUT_ERROR]: 408,
    [ErrorCodes.INTERNAL_ERROR]: 500,
    [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
  };

  return statusMap[code] || 500;
}

/**
 * Check if error is retryable
 */
function isRetryableError(code: keyof typeof ErrorCodes): boolean {
  const retryableErrors: Array<keyof typeof ErrorCodes> = [
    ErrorCodes.OTP_SEND_FAILED,
    ErrorCodes.VERIFICATION_FAILED,
    ErrorCodes.DATABASE_ERROR,
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.TIMEOUT_ERROR,
    ErrorCodes.SERVICE_UNAVAILABLE,
  ];

  return retryableErrors.includes(code);
}

/**
 * Log error with context
 */
export function logError(
  error: Error | AppError,
  context?: {
    requestId?: string;
    userId?: string;
    phoneNumber?: string;
    endpoint?: string;
    additionalData?: any;
  },
) {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
    statusCode: error instanceof AppError ? error.statusCode : 500,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error occurred:', errorInfo);
  }

  // logToService(errorInfo);
}

/**
 * Handle and format Supabase errors
 */
export function handleSupabaseError(error: any, context?: string): AppError {
  const errorMessage = error?.message || 'Unknown Supabase error';
  const errorCode = error?.code || error?.status || '';

  // Log full error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('🔍 Supabase Error Details:', {
      message: errorMessage,
      code: errorCode,
      status: error?.status,
      fullError: error,
    });
  }

  // Twilio specific error codes
  if (errorMessage.includes('21211')) {
    return new AppError(
      ErrorCodes.INVALID_PHONE_NUMBER,
      'Invalid phone number format. Please check your number and try again.',
      422,
    );
  }

  if (errorMessage.includes('21214')) {
    return new AppError(
      ErrorCodes.INVALID_PHONE_NUMBER,
      'This phone number type is not supported for SMS.',
      422,
    );
  }

  if (errorMessage.includes('21614')) {
    return new AppError(
      ErrorCodes.INVALID_PHONE_NUMBER,
      'Invalid country code. Please include the correct country code (e.g., +91 for India).',
      422,
    );
  }

  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many')
  ) {
    return new AppError(
      ErrorCodes.SMS_RATE_LIMIT_EXCEEDED,
      'Too many SMS requests. Please wait a few minutes before trying again.',
      429,
    );
  }

  const lowerMessage = errorMessage.toLowerCase();

  if (
    lowerMessage.includes('invalid') &&
    !lowerMessage.includes('expired or invalid') &&
    !lowerMessage.includes('has expired or is invalid')
  ) {
    // Pure invalid case
    return new AppError(
      ErrorCodes.INVALID_OTP,
      'Invalid OTP. Please check and try again.',
      400,
    );
  }

  if (lowerMessage.includes('incorrect') || lowerMessage.includes('wrong')) {
    return new AppError(
      ErrorCodes.INVALID_OTP,
      'Invalid OTP. Please check and try again.',
      400,
    );
  }

  if (lowerMessage.includes('expired') || lowerMessage.includes('timeout')) {
    if (lowerMessage.includes('expired') && lowerMessage.includes('invalid')) {
      const invalidIndex = lowerMessage.indexOf('invalid');
      const expiredIndex = lowerMessage.indexOf('expired');

      if (
        lowerMessage.includes('invalid token') ||
        lowerMessage.includes('invalid code') ||
        lowerMessage.includes('incorrect token') ||
        lowerMessage.includes('incorrect code') ||
        (invalidIndex > -1 &&
          expiredIndex > -1 &&
          invalidIndex < expiredIndex + 10)
      ) {
        return new AppError(
          ErrorCodes.INVALID_OTP,
          'Invalid OTP. Please check and try again.',
          400,
        );
      }

      console.warn(
        '⚠️ Ambiguous Supabase error - both expired and invalid mentioned:',
        {
          errorMessage,
          errorCode,
          suggestion:
            'Cannot differentiate - defaulting to INVALID_OTP for better UX. User can retry or resend.',
        },
      );
      return new AppError(
        ErrorCodes.INVALID_OTP,
        'Invalid OTP. Please check and try again.',
        400,
      );
    }

    return new AppError(
      ErrorCodes.OTP_EXPIRED,
      'OTP has expired. Please request a new one.',
      400,
    );
  }

  return new AppError(
    ErrorCodes.VERIFICATION_FAILED,
    `OTP ${context || 'verification'} failed. Please try again.`,
    500,
    true,
    { originalError: errorMessage },
  );
}

/**
 * Frontend Error Handling Utilities
 * Provides user-friendly error messages and error recovery
 */

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
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

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

/**
 * User-friendly error messages
 */
export const ErrorMessages: Record<string, string> = {
  VALIDATION_ERROR: 'Please check your input and try again',
  INVALID_PHONE_NUMBER: 'Invalid phone number. Please check and try again',
  INVALID_OTP: 'Invalid OTP. Please check the code and try again',
  OTP_EXPIRED: 'OTP has expired. Please request a new one',
  OTP_SEND_FAILED: 'Failed to send OTP. Please try again',
  VERIFICATION_FAILED: 'Verification failed. Please try again',
  USER_CREATION_FAILED: 'Failed to create account. Please try again',
  SESSION_CREATION_FAILED: 'Failed to create session. Please try again',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment',
  SMS_RATE_LIMIT_EXCEEDED: 'Too many SMS requests. Please wait a few minutes',
  DATABASE_ERROR: 'Service temporarily unavailable. Please try again',
  USER_NOT_FOUND: 'User not found',
  DUPLICATE_USER: 'User already exists',
  NETWORK_ERROR: 'Network error. Please check your connection',
  TIMEOUT_ERROR: 'Request timeout. Please try again',
  INTERNAL_ERROR: 'Something went wrong. Please try again',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
};

/**
 * Get user-friendly error message
 */
export function getErrorMessage(
  errorCode: string,
  fallbackMessage?: string,
): string {
  return (
    ErrorMessages[errorCode] ||
    fallbackMessage ||
    'An unexpected error occurred'
  );
}

/**
 * Check if error is retryable
 */
export function isRetryableError(errorCode: string): boolean {
  const retryableErrors = [
    'OTP_SEND_FAILED',
    'VERIFICATION_FAILED',
    'DATABASE_ERROR',
    'NETWORK_ERROR',
    'TIMEOUT_ERROR',
    'SERVICE_UNAVAILABLE',
    'INTERNAL_ERROR',
  ];

  return retryableErrors.includes(errorCode);
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  options: Partial<RetryOptions> = {},
): number {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const delay = Math.min(
    opts.baseDelay * Math.pow(opts.backoffFactor, attempt - 1),
    opts.maxDelay,
  );

  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on the last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      // Check if error is retryable
      const errorCode = (error as any)?.response?.data?.error?.code;
      if (!isRetryableError(errorCode)) {
        break;
      }

      // Wait before retrying
      const delay = calculateRetryDelay(attempt, opts);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Handle API error response
 */
export function handleApiError(error: any): {
  message: string;
  code: string;
  retryable: boolean;
  retryAfter?: number;
} {
  const errorResponse = error?.response?.data as ErrorResponse;

  if (errorResponse?.error) {
    return {
      message: getErrorMessage(
        errorResponse.error.code,
        errorResponse.error.message,
      ),
      code: errorResponse.error.code,
      retryable:
        errorResponse.meta?.retryable ??
        isRetryableError(errorResponse.error.code),
      retryAfter: errorResponse.meta?.retryAfter,
    };
  }

  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
    return {
      message: 'Network error. Please check your connection',
      code: 'NETWORK_ERROR',
      retryable: true,
    };
  }

  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return {
      message: 'Request timeout. Please try again',
      code: 'TIMEOUT_ERROR',
      retryable: true,
    };
  }

  // Default error
  return {
    message: 'Something went wrong. Please try again',
    code: 'INTERNAL_ERROR',
    retryable: false,
  };
}

/**
 * Create error context for logging
 */
export function createErrorContext(
  error: any,
  context?: {
    endpoint?: string;
    userId?: string;
    phoneNumber?: string;
    additionalData?: any;
  },
) {
  return {
    error: {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    },
    response: error?.response?.data,
    context,
    timestamp: new Date().toISOString(),
    userAgent:
      typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  };
}

/**
 * Log error with context
 */
export function logError(
  error: any,
  context?: {
    endpoint?: string;
    userId?: string;
    phoneNumber?: string;
    additionalData?: any;
  },
) {
  const errorContext = createErrorContext(error, context);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Frontend Error:', errorContext);
  }

  // TODO: In production, send to logging service
  // sendToLoggingService(errorContext);
}

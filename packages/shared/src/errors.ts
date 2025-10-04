/**
 * Error handling utilities for FinMatter
 */

import { ERROR_CODES } from './constants';

/**
 * Custom error class for FinMatter
 */
export class FinMatterError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    code: string = ERROR_CODES.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'FinMatterError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FinMatterError);
    }
  }
}

/**
 * Validation error class
 */
export class ValidationError extends FinMatterError {
  public readonly field: string;

  constructor(message: string, field: string, details?: Record<string, any>) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends FinMatterError {
  constructor(message: string = 'Authentication required') {
    super(message, ERROR_CODES.AUTHENTICATION_ERROR, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends FinMatterError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, ERROR_CODES.AUTHORIZATION_ERROR, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends FinMatterError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, ERROR_CODES.NOT_FOUND, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends FinMatterError {
  constructor(message: string = 'Resource conflict') {
    super(message, ERROR_CODES.CONFLICT, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends FinMatterError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super('Rate limit exceeded', ERROR_CODES.RATE_LIMIT_EXCEEDED, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * PDF parsing error class
 */
export class PDFParsingError extends FinMatterError {
  constructor(
    message: string = 'Failed to parse PDF statement',
    details?: Record<string, any>
  ) {
    super(message, ERROR_CODES.PDF_PARSING_ERROR, 422, details);
    this.name = 'PDFParsingError';
  }
}

/**
 * AI service error class
 */
export class AIServiceError extends FinMatterError {
  constructor(
    message: string = 'AI service unavailable',
    details?: Record<string, any>
  ) {
    super(message, ERROR_CODES.AI_SERVICE_ERROR, 503, details);
    this.name = 'AIServiceError';
  }
}

/**
 * External API error class
 */
export class ExternalAPIError extends FinMatterError {
  public readonly service: string;

  constructor(
    service: string,
    message: string = 'External service error',
    details?: Record<string, any>
  ) {
    super(message, ERROR_CODES.EXTERNAL_API_ERROR, 502, details);
    this.name = 'ExternalAPIError';
    this.service = service;
  }
}

/**
 * Database error class
 */
export class DatabaseError extends FinMatterError {
  public readonly operation: string;

  constructor(
    operation: string,
    message: string = 'Database operation failed',
    details?: Record<string, any>
  ) {
    super(message, 'DATABASE_ERROR', 500, details);
    this.name = 'DatabaseError';
    this.operation = operation;
  }
}

/**
 * File upload error class
 */
export class FileUploadError extends FinMatterError {
  public readonly fileName: string;
  public readonly fileSize: number;

  constructor(
    fileName: string,
    fileSize: number,
    message: string = 'File upload failed',
    details?: Record<string, any>
  ) {
    super(message, 'FILE_UPLOAD_ERROR', 400, details);
    this.name = 'FileUploadError';
    this.fileName = fileName;
    this.fileSize = fileSize;
  }
}

/**
 * Network error class
 */
export class NetworkError extends FinMatterError {
  public readonly url: string;

  constructor(
    url: string,
    message: string = 'Network request failed',
    details?: Record<string, any>
  ) {
    super(message, 'NETWORK_ERROR', 0, details);
    this.name = 'NetworkError';
    this.url = url;
  }
}

/**
 * Timeout error class
 */
export class TimeoutError extends FinMatterError {
  public readonly timeout: number;

  constructor(
    timeout: number,
    message: string = 'Request timeout',
    details?: Record<string, any>
  ) {
    super(message, 'TIMEOUT_ERROR', 408, details);
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}

/**
 * Check if error is a FinMatter error
 */
export const isFinMatterError = (error: any): error is FinMatterError => {
  return error instanceof FinMatterError;
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: any): error is ValidationError => {
  return error instanceof ValidationError;
};

/**
 * Check if error is an authentication error
 */
export const isAuthenticationError = (
  error: any
): error is AuthenticationError => {
  return error instanceof AuthenticationError;
};

/**
 * Check if error is an authorization error
 */
export const isAuthorizationError = (
  error: any
): error is AuthorizationError => {
  return error instanceof AuthorizationError;
};

/**
 * Check if error is a not found error
 */
export const isNotFoundError = (error: any): error is NotFoundError => {
  return error instanceof NotFoundError;
};

/**
 * Convert any error to FinMatterError
 */
export const toFinMatterError = (error: any): FinMatterError => {
  if (isFinMatterError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new FinMatterError(
      error.message,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      500,
      {
        originalError: error.name,
        stack: error.stack,
      }
    );
  }

  if (typeof error === 'string') {
    return new FinMatterError(error);
  }

  return new FinMatterError('Unknown error occurred');
};

/**
 * Create error response object
 */
export const createErrorResponse = (
  error: any
): {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
} => {
  const finMatterError = toFinMatterError(error);

  return {
    success: false,
    error: {
      code: finMatterError.code,
      message: finMatterError.message,
      ...(finMatterError.details && { details: finMatterError.details }),
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Handle async errors
 */
export const handleAsyncError = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw toFinMatterError(error);
    }
  };
};

/**
 * Handle sync errors
 */
export const handleSyncError = <T extends any[], R>(fn: (...args: T) => R) => {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      throw toFinMatterError(error);
    }
  };
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryCondition?: (error: any) => boolean;
  } = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = () => true,
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !retryCondition(error)) {
        throw toFinMatterError(error);
      }

      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw toFinMatterError(lastError);
};

/**
 * Validate error object
 */
export const validateError = (error: any): boolean => {
  return (
    error &&
    typeof error === 'object' &&
    typeof error.message === 'string' &&
    (typeof error.code === 'string' || typeof error.code === 'undefined')
  );
};

/**
 * Get error message from any error type
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    if (error.message) {
      return error.message;
    }

    if (error.error && typeof error.error === 'string') {
      return error.error;
    }

    if (error.msg) {
      return error.msg;
    }
  }

  return 'An unexpected error occurred';
};

/**
 * Get error code from any error type
 */
export const getErrorCode = (error: any): string => {
  if (error && typeof error === 'object') {
    if (error.code) {
      return error.code;
    }

    if (error.errorCode) {
      return error.errorCode;
    }
  }

  return ERROR_CODES.INTERNAL_SERVER_ERROR;
};

/**
 * Log error with context
 */
export const logError = (
  error: any,
  context: {
    operation?: string;
    userId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
  } = {}
): void => {
  const finMatterError = toFinMatterError(error);

  const logData = {
    error: {
      name: finMatterError.name,
      message: finMatterError.message,
      code: finMatterError.code,
      statusCode: finMatterError.statusCode,
      details: finMatterError.details,
      stack: finMatterError.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  };

  // In production, you would send this to a logging service
  console.error('FinMatter Error:', JSON.stringify(logData, null, 2));
};

/**
 * Create error boundary for React components
 */
export const createErrorBoundary = (error: any, errorInfo: any) => {
  const finMatterError = toFinMatterError(error);

  logError(finMatterError, {
    operation: 'React Error Boundary',
    metadata: {
      componentStack: errorInfo?.componentStack,
      errorBoundary: errorInfo?.errorBoundary,
    },
  });

  return finMatterError;
};

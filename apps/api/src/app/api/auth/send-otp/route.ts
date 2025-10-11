/**
 * Send OTP API Endpoint
 * POST /api/auth/send-otp
 * Sends OTP to user's phone number for authentication
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import {
  createErrorResponse,
  handleSupabaseError,
  logError,
  ErrorCodes,
} from '@/lib/errorHandler';
import { z } from 'zod';

// Request validation schema
const SendOTPSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^\+?[0-9]\d{1,14}$/, 'Invalid phone number format')
    .refine(
      phone => {
        // Check if it starts with +91 for Indian numbers
        if (phone.startsWith('+91') || phone.startsWith('91')) {
          return true;
        }
        // Check if it's a 10-digit number that should have +91
        if (phone.length === 10 && /^[6-9]\d{9}$/.test(phone)) {
          return false; // This should have +91 prefix
        }
        return true;
      },
      {
        message: 'Indian phone numbers must include +91 country code',
      },
    ),
});

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 10 * 60 * 1000, // 10 minutes
};

/**
 * Check rate limit for phone number
 */
function checkRateLimit(phoneNumber: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const key = phoneNumber;
  const stored = rateLimitStore.get(key);

  if (!stored) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return { allowed: true };
  }

  if (now > stored.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return { allowed: true };
  }

  if (stored.count >= RATE_LIMIT.maxAttempts) {
    const retryAfter = Math.ceil((stored.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  stored.count++;
  rateLimitStore.set(key, stored);
  return { allowed: true };
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return handleCorsPreflight();
}

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number
 */
export async function POST(request: NextRequest) {
  let body: any;
  try {
    // Parse and validate request body
    body = await request.json();
    const validation = SendOTPSchema.safeParse(body);

    if (!validation.success) {
      const errorResponse = createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid phone number format',
        validation.error.errors,
      );
      return createCorsResponse(errorResponse, { status: 400 });
    }

    const { phoneNumber } = validation.data;

    // Check rate limit
    const rateLimit = checkRateLimit(phoneNumber);
    if (!rateLimit.allowed) {
      const errorResponse = createErrorResponse(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        `Too many OTP requests. Please try again in ${rateLimit.retryAfter} seconds.`,
        undefined,
        {
          retryAfter: rateLimit.retryAfter,
          retryable: true,
        },
      );

      // Add rate limit info to the response
      const response = {
        ...errorResponse,
        rateLimit: {
          attempts: RATE_LIMIT.maxAttempts,
          remaining: 0,
          resetTime: new Date(
            Date.now() + rateLimit.retryAfter! * 1000,
          ).toISOString(),
          retryAfter: rateLimit.retryAfter,
        },
      };

      return createCorsResponse(response, { status: 429 });
    }

    // Send OTP using Supabase Auth with Twilio
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      phone: phoneNumber,
      options: {
        channel: 'sms',
      },
    });

    if (error) {
      logError(error, {
        phoneNumber,
        endpoint: '/api/auth/send-otp',
        additionalData: { error: error.message },
      });

      const appError = handleSupabaseError(error, 'sending');
      const errorResponse = createErrorResponse(
        appError.code as keyof typeof ErrorCodes,
        appError.message,
        { originalError: error.message },
        {
          statusCode: appError.statusCode,
          retryable: appError.statusCode >= 500,
        },
      );

      return createCorsResponse(errorResponse, { status: appError.statusCode });
    }

    // Return success response
    return createCorsResponse({
      success: true,
      data: {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 300, // 5 minutes in seconds
      },
    });
  } catch (error) {
    logError(error as Error, {
      endpoint: '/api/auth/send-otp',
      additionalData: { requestBody: body },
    });

    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'An unexpected error occurred while sending OTP',
      undefined,
      { retryable: true },
    );

    return createCorsResponse(errorResponse, { status: 500 });
  }
}

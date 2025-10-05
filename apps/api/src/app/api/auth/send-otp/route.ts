/**
 * Send OTP API Endpoint
 * POST /api/auth/send-otp
 * Sends OTP to user's phone number for authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { z } from 'zod';

// Request validation schema
const SendOTPSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
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
 * POST /api/auth/send-otp
 * Send OTP to phone number
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = SendOTPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone number format',
            details: validation.error.errors,
          },
        },
        { status: 400 },
      );
    }

    const { phoneNumber } = validation.data;

    // Check rate limit
    const rateLimit = checkRateLimit(phoneNumber);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many OTP requests. Please try again in ${rateLimit.retryAfter} seconds.`,
          },
          rateLimit: {
            attempts: RATE_LIMIT.maxAttempts,
            remaining: 0,
            resetTime: new Date(
              Date.now() + rateLimit.retryAfter! * 1000,
            ).toISOString(),
            retryAfter: rateLimit.retryAfter,
          },
        },
        { status: 429 },
      );
    }

    // Send OTP using Supabase Auth
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      phone: phoneNumber,
      options: {
        channel: 'sms',
      },
    });

    if (error) {
      console.error('Supabase OTP error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OTP_SEND_FAILED',
            message: 'Failed to send OTP. Please try again.',
            details: error.message,
          },
        },
        { status: 500 },
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 300, // 5 minutes in seconds
      },
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    );
  }
}

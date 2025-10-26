/**
 * Rate Limiting Utility for Next.js API Routes
 * Prevents API abuse and protects against DDoS attacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase/client';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting
// TODO: Replace with Redis in production for multi-instance support
const store: RateLimitStore = {};

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(
  () => {
    const now = Date.now();
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  },
  5 * 60 * 1000,
);

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string; // Custom error message
  keyPrefix?: string; // Prefix for the rate limit key
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  identifier: string, // Usually IP or user ID
  options: RateLimitOptions,
): {
  limited: boolean;
  remaining: number;
  resetTime: number;
  retryAfter: number;
} {
  const now = Date.now();
  const key = `${options.keyPrefix || 'default'}:${identifier}`;

  // Initialize or reset if window expired
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    return {
      limited: false,
      remaining: options.max - 1,
      resetTime: store[key]!.resetTime,
      retryAfter: 0,
    };
  }

  // Increment count
  store[key].count++;

  // Check if limited
  if (store[key].count > options.max) {
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
    return {
      limited: true,
      remaining: 0,
      resetTime: store[key].resetTime,
      retryAfter,
    };
  }

  return {
    limited: false,
    remaining: options.max - store[key].count,
    resetTime: store[key].resetTime,
    retryAfter: 0,
  };
}

/**
 * Get user ID from request (for authenticated rate limiting)
 */
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return null;
    }

    return data.user.id;
  } catch {
    return null;
  }
}

/**
 * Get client identifier (user ID or IP address)
 */
export async function getClientIdentifier(req: NextRequest): Promise<string> {
  // Try to get user ID first (more accurate for logged-in users)
  const userId = await getUserIdFromRequest(req);
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Create rate limit error response
 */
function createRateLimitResponse(
  message: string,
  retryAfter: number,
  max: number,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
        details: {
          retryAfter,
        },
        suggestion: `Please wait ${retryAfter} seconds before trying again.`,
      },
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': '0',
      },
    },
  );
}

/**
 * Rate limit middleware wrapper for Next.js API routes
 * Usage: export const POST = withRateLimit(handler, options);
 */
export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: RateLimitOptions,
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Get client identifier
    const identifier = await getClientIdentifier(req);

    // Check rate limit
    const rateLimit = checkRateLimit(identifier, options);

    if (rateLimit.limited) {
      return createRateLimitResponse(
        options.message || 'Too many requests. Please try again later.',
        rateLimit.retryAfter,
        options.max,
      );
    }

    // Execute handler
    const response = await handler(req, ...args);

    // Add rate limit headers to response
    if (response instanceof NextResponse) {
      response.headers.set('X-RateLimit-Limit', options.max.toString());
      response.headers.set(
        'X-RateLimit-Remaining',
        rateLimit.remaining.toString(),
      );
      response.headers.set(
        'X-RateLimit-Reset',
        Math.ceil(rateLimit.resetTime / 1000).toString(),
      );
    }

    return response;
  };
}

// ============================================
// Preset rate limit configurations
// ============================================

/**
 * Strict rate limit for card creation (prevent spam)
 */
export const CARD_CREATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 cards per 15 minutes
  message: 'Too many cards added. Please try again in a few minutes.',
  keyPrefix: 'card_create',
};

/**
 * Standard rate limit for general API calls
 */
export const GENERAL_LIMIT: RateLimitOptions = {
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Max 60 requests per minute
  message: 'Too many requests. Please slow down.',
  keyPrefix: 'general',
};

/**
 * Strict rate limit for authentication endpoints
 */
export const AUTH_LIMIT: RateLimitOptions = {
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Max 5 OTP requests per 10 minutes
  message: 'Too many login attempts. Please try again later.',
  keyPrefix: 'auth',
};

/**
 * Rate limit for file uploads
 */
export const UPLOAD_LIMIT: RateLimitOptions = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Max 20 uploads per hour
  message: 'Upload limit reached. Please try again later.',
  keyPrefix: 'upload',
};

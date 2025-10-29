/**
 * Verify OTP API Endpoint
 * POST /api/auth/verify-otp
 * Verifies OTP and creates user session
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
const VerifyOTPSchema = z.object({
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
  otp: z
    .string()
    .min(6, 'OTP must be at least 6 digits')
    .regex(/^\d+$/, 'OTP must contain only digits'),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * POST /api/auth/verify-otp
 * Verify OTP and create session
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  let body: any;
  try {
    // Parse and validate request body
    body = await request.json();
    const validation = VerifyOTPSchema.safeParse(body);

    if (!validation.success) {
      const errorResponse = createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid request data',
        validation.error.errors,
      );
      return createCorsResponse(errorResponse, {
        status: 400,
        origin: origin || undefined,
      });
    }

    const { phoneNumber, otp } = validation.data;

    // Verify OTP using Supabase Auth with Twilio
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      phone: phoneNumber,
      token: otp,
      type: 'sms',
    });

    if (error) {
      logError(error, {
        phoneNumber,
        endpoint: '/api/auth/verify-otp',
        additionalData: {
          otp: `${otp.substring(0, 2)}****`,
          error: error.message,
          // Log full error structure to debug Supabase error codes
          errorCode: error.code,
          errorStatus: error.status,
          fullError: JSON.stringify(error, null, 2),
        },
      });

      const appError = handleSupabaseError(error, 'verification');
      const errorResponse = createErrorResponse(
        appError.code as keyof typeof ErrorCodes,
        appError.message,
        { originalError: error.message },
        {
          statusCode: appError.statusCode,
          retryable: appError.statusCode >= 500,
        },
      );

      return createCorsResponse(errorResponse, {
        status: appError.statusCode,
        origin: origin || undefined,
      });
    }

    if (!data.user || !data.session) {
      const errorResponse = createErrorResponse(
        ErrorCodes.SESSION_CREATION_FAILED,
        'Failed to create session. Please try again.',
        { userId: data.user?.id },
        { retryable: true },
      );
      return createCorsResponse(errorResponse, {
        status: 500,
        origin: origin || undefined,
      });
    }

    // Get or create user in our custom users table
    let userRecord;
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      // PGRST116 = no rows found
      logError(userError, {
        userId: data.user.id,
        phoneNumber,
        endpoint: '/api/auth/verify-otp',
        additionalData: { operation: 'user_lookup', error: userError.message },
      });

      const errorResponse = createErrorResponse(
        ErrorCodes.DATABASE_ERROR,
        'Failed to retrieve user data',
        { originalError: userError.message },
        { retryable: true },
      );
      return createCorsResponse(errorResponse, {
        status: 500,
        origin: origin || undefined,
      });
    }

    if (existingUser) {
      // Update last login and OTP verification
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          last_login: new Date().toISOString(),
          is_verified: true,
          last_otp_verification: new Date().toISOString(), // Track OTP verification for 30-day logic
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        // Update user error logged
        userRecord = existingUser;
      } else {
        userRecord = updatedUser;
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: data.user.id, // Use the Supabase auth user ID
          phone_number: phoneNumber,
          is_verified: true,
          last_login: new Date().toISOString(),
          last_otp_verification: new Date().toISOString(), // Track OTP verification for 30-day logic
          profile_data: {
            firstName: '', // Required by constraint, will be set during onboarding
            lastName: '',
          },
        })
        .select()
        .single();

      if (createError) {
        logError(createError, {
          userId: data.user.id,
          phoneNumber,
          endpoint: '/api/auth/verify-otp',
          additionalData: {
            operation: 'user_creation',
            error: createError.message,
          },
        });

        const errorResponse = createErrorResponse(
          ErrorCodes.USER_CREATION_FAILED,
          'Failed to create user account',
          { originalError: createError.message },
          { retryable: true },
        );
        return createCorsResponse(errorResponse, {
          status: 500,
          origin: origin || undefined,
        });
      }

      userRecord = newUser;
    }

    // Return success response with user and session, and set auth cookies
    const response = createCorsResponse(
      {
        success: true,
        data: {
          user: {
            id: userRecord.id,
            phoneNumber: userRecord.phone_number,
            isVerified: userRecord.is_verified,
            biometricEnabled: userRecord.biometric_enabled,
            createdAt: userRecord.created_at,
            lastLogin: userRecord.last_login,
            onboardingCompleted: userRecord.onboarding_completed || false,
          },
          session: {
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
          },
        },
      },
      { origin: origin || undefined },
    );

    // Set authentication cookies with proper security
    const cookieOptions = {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: true, // Both tokens should be httpOnly for security
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax' as const,
      path: '/',
    };

    // Set access token cookie (httpOnly)
    let accessTokenCookie = `finmatter-auth-token=${data.session.access_token}; Max-Age=${cookieOptions.maxAge}; Path=${cookieOptions.path}; SameSite=${cookieOptions.sameSite}; HttpOnly`;
    if (cookieOptions.secure) accessTokenCookie += '; Secure';
    response.headers.append('Set-Cookie', accessTokenCookie);

    // Set refresh token cookie (httpOnly)
    let refreshTokenCookie = `finmatter-refresh-token=${data.session.refresh_token}; Max-Age=${cookieOptions.maxAge}; Path=${cookieOptions.path}; SameSite=${cookieOptions.sameSite}; HttpOnly`;
    if (cookieOptions.secure) refreshTokenCookie += '; Secure';
    response.headers.append('Set-Cookie', refreshTokenCookie);

    // Set a non-httpOnly cookie with just the token expiry for client-side checks
    let tokenExpiryInfo = `finmatter-token-expiry=${data.session.expires_at}; Max-Age=${cookieOptions.maxAge}; Path=${cookieOptions.path}; SameSite=${cookieOptions.sameSite}`;
    if (cookieOptions.secure) tokenExpiryInfo += '; Secure';
    response.headers.append('Set-Cookie', tokenExpiryInfo);

    return response;
  } catch (error) {
    logError(error as Error, {
      endpoint: '/api/auth/verify-otp',
      additionalData: { requestBody: body },
    });

    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'An unexpected error occurred during OTP verification',
      undefined,
      { retryable: true },
    );

    return createCorsResponse(errorResponse, {
      status: 500,
      origin: origin || undefined,
    });
  }
}

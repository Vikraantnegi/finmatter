/**
 * Verify OTP API Endpoint
 * POST /api/auth/verify-otp
 * Verifies OTP and creates user session
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { z } from 'zod';

// Request validation schema
const VerifyOTPSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  otp: z
    .string()
    .min(6, 'OTP must be at least 6 digits')
    .regex(/^\d+$/, 'OTP must contain only digits'),
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and create session
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = VerifyOTPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        },
        { status: 400 },
      );
    }

    const { phoneNumber, otp } = validation.data;

    // Verify OTP using Supabase Auth
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      phone: phoneNumber,
      token: otp,
      type: 'sms',
    });

    if (error) {
      console.error('Supabase OTP verification error:', error);

      // Handle specific error cases
      if (
        error.message.includes('expired') ||
        error.message.includes('timeout')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'OTP_EXPIRED',
              message: 'OTP has expired. Please request a new one.',
            },
          },
          { status: 400 },
        );
      }

      if (
        error.message.includes('invalid') ||
        error.message.includes('incorrect')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_OTP',
              message: 'Invalid OTP. Please check and try again.',
            },
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VERIFICATION_FAILED',
            message: 'OTP verification failed. Please try again.',
            details: error.message,
          },
        },
        { status: 500 },
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SESSION',
            message: 'Failed to create session. Please try again.',
          },
        },
        { status: 500 },
      );
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
      console.error('Database user lookup error:', userError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to retrieve user data.',
          },
        },
        { status: 500 },
      );
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
        console.error('Update user error:', updateError);
        userRecord = existingUser;
      } else {
        userRecord = updatedUser;
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          phone_number: phoneNumber,
          is_verified: true,
          last_login: new Date().toISOString(),
          last_otp_verification: new Date().toISOString(), // Track OTP verification for 30-day logic
          profile_data: {},
        })
        .select()
        .single();

      if (createError) {
        console.error('Create user error:', createError);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'USER_CREATION_FAILED',
              message: 'Failed to create user account.',
            },
          },
          { status: 500 },
        );
      }

      userRecord = newUser;
    }

    // Return success response with user and session
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userRecord.id,
          phoneNumber: userRecord.phone_number,
          isVerified: userRecord.is_verified,
          biometricEnabled: userRecord.biometric_enabled,
          createdAt: userRecord.created_at,
          lastLogin: userRecord.last_login,
        },
        session: {
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
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

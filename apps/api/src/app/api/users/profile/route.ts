/**
 * User Profile API Endpoint
 * GET /api/users/profile - Get current user's profile
 * PUT /api/users/profile - Update current user's profile
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  avatar: z.string().optional(),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  preferences: z
    .object({
      notifications: z
        .object({
          push: z
            .object({
              enabled: z.boolean().optional(),
            })
            .optional(),
          email: z
            .object({
              enabled: z.boolean().optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * Get authenticated user ID from request
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new FinMatterError('Unauthorized', 'AUTH_REQUIRED', 401);
  }

  const token = authHeader.split(' ')[1];
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new FinMatterError('Invalid token', 'INVALID_TOKEN', 401);
  }

  return user.id;
}

/**
 * GET /api/users/profile - Get current user's profile
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);

    // Fetch user from custom users table
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw new FinMatterError(
        'Failed to fetch user profile',
        'FETCH_PROFILE_ERROR',
        500,
      );
    }

    if (!user) {
      throw new FinMatterError('User not found', 'USER_NOT_FOUND', 404);
    }

    return createCorsResponse(
      {
        success: true,
        data: {
          id: user.id,
          phoneNumber: user.phone_number,
          createdAt: user.created_at,
          lastLogin: user.last_login,
          biometricEnabled: user.biometric_enabled,
          isVerified: user.is_verified,
          profileData: user.profile_data,
          updatedAt: user.updated_at,
        },
      },
      {
        status: 200,
        origin: origin || undefined,
      },
    );
  } catch (error) {
    if (error instanceof FinMatterError) {
      return createCorsResponse(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        {
          status: error.statusCode,
          origin: origin || undefined,
        },
      );
    }

    console.error('Unexpected error in GET /api/users/profile:', error);
    return createCorsResponse(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
      {
        status: 500,
        origin: origin || undefined,
      },
    );
  }
}

/**
 * PUT /api/users/profile - Update current user's profile
 */
export async function PUT(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const body = await request.json();

    // Validate request body
    const validatedData = UpdateProfileSchema.parse(body);

    // Get existing user data
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('profile_data, phone_number')
      .eq('id', userId)
      .single();

    if (fetchError) {
      throw new FinMatterError(
        'Failed to fetch existing user data',
        'FETCH_USER_ERROR',
        500,
      );
    }

    // Merge existing profile_data with new data
    const updatedProfileData = {
      ...(existingUser.profile_data || {}),
      ...(validatedData.firstName && { firstName: validatedData.firstName }),
      ...(validatedData.lastName !== undefined && {
        lastName: validatedData.lastName,
      }),
      ...(validatedData.displayName !== undefined && {
        displayName: validatedData.displayName,
      }),
      ...(validatedData.avatar !== undefined && {
        avatar: validatedData.avatar,
      }),
      ...(validatedData.dateOfBirth !== undefined && {
        dateOfBirth: validatedData.dateOfBirth,
      }),
      ...(validatedData.preferences && {
        preferences: {
          ...(existingUser.profile_data?.preferences || {}),
          ...validatedData.preferences,
        },
      }),
    };

    // Prepare update object
    const updateData: {
      profile_data: any;
      phone_number?: string;
      updated_at: string;
    } = {
      profile_data: updatedProfileData,
      updated_at: new Date().toISOString(),
    };

    // Update phone number if provided
    if (validatedData.phoneNumber) {
      updateData.phone_number = validatedData.phoneNumber;
    }

    // Update user in database
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      throw new FinMatterError(
        'Failed to update profile',
        'UPDATE_PROFILE_ERROR',
        500,
      );
    }

    return createCorsResponse(
      {
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: updatedUser.id,
          phoneNumber: updatedUser.phone_number,
          createdAt: updatedUser.created_at,
          lastLogin: updatedUser.last_login,
          biometricEnabled: updatedUser.biometric_enabled,
          isVerified: updatedUser.is_verified,
          profileData: updatedUser.profile_data,
          updatedAt: updatedUser.updated_at,
        },
      },
      {
        status: 200,
        origin: origin || undefined,
      },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createCorsResponse(
        {
          success: false,
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        {
          status: 400,
          origin: origin || undefined,
        },
      );
    }

    if (error instanceof FinMatterError) {
      return createCorsResponse(
        {
          success: false,
          error: error.message,
          code: error.code,
        },
        {
          status: error.statusCode,
          origin: origin || undefined,
        },
      );
    }

    console.error('Unexpected error in PUT /api/users/profile:', error);
    return createCorsResponse(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
      {
        status: 500,
        origin: origin || undefined,
      },
    );
  }
}

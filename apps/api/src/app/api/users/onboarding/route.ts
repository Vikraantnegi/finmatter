/**
 * User Onboarding API Endpoint
 * PUT /api/users/onboarding - Complete user onboarding
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
const CompleteOnboardingSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().max(50).optional(),
  avatar: z.string().optional(),
  notificationsEnabled: z.boolean().optional().default(false),
  locationEnabled: z.boolean().optional().default(false),
  smsEnabled: z.boolean().optional().default(false),
});

/**
 * Helper function to get authenticated user ID
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.split(' ')[1];

  const { data: userResponse, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  if (userError || !userResponse?.user) {
    throw new Error('Invalid token');
  }

  return userResponse.user.id;
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * PUT /api/users/onboarding
 * Complete user onboarding
 */
export async function PUT(request: NextRequest) {
  const origin = request.headers.get('origin');
  let body;
  try {
    const userId = await getAuthenticatedUserId(request);

    // Parse and validate request body
    try {
      body = await request.json();
    } catch (parseError) {
      const errorResponse = createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid JSON in request body',
        {
          parseError:
            parseError instanceof Error
              ? parseError.message
              : 'Unknown parsing error',
        },
      );
      return createCorsResponse(errorResponse, {
        status: 400,
        origin: origin || undefined,
      });
    }

    const validation = CompleteOnboardingSchema.safeParse(body);
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

    const {
      firstName,
      lastName,
      avatar,
      notificationsEnabled,
      locationEnabled,
      smsEnabled,
    } = validation.data;

    // Check if user has already completed onboarding (idempotency)
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select(
        'onboarding_completed, profile_data, phone_number, is_verified, biometric_enabled, created_at, updated_at',
      )
      .eq('id', userId)
      .single();

    if (fetchError) {
      logError(fetchError, {
        userId,
        endpoint: '/api/users/onboarding',
        additionalData: {
          operation: 'fetch_user',
          error: fetchError.message,
        },
      });

      const appError = handleSupabaseError(fetchError, 'select');
      const errorResponse = createErrorResponse(
        appError.code as keyof typeof ErrorCodes,
        appError.message,
        { originalError: fetchError.message, userId },
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

    // If already onboarded, return success with current data (idempotent)
    if (currentUser?.onboarding_completed) {
      return createCorsResponse(
        {
          success: true,
          message: 'Onboarding already completed',
          data: {
            user: {
              id: userId,
              phoneNumber: currentUser.phone_number,
              firstName: currentUser.profile_data?.firstName || '',
              lastName: currentUser.profile_data?.lastName || '',
              onboardingCompleted: true,
              isVerified: currentUser.is_verified,
              biometricEnabled: currentUser.biometric_enabled,
              createdAt: currentUser.created_at,
              updatedAt: currentUser.updated_at,
            },
          },
        },
        { origin: origin || undefined },
      );
    }

    // Update user record (first time onboarding)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        onboarding_completed: true,
        notifications_enabled: notificationsEnabled || false,
        profile_data: {
          firstName,
          lastName: lastName || '',
          avatar: avatar || '',
          notificationsEnabled: notificationsEnabled || false,
          locationEnabled: locationEnabled || false,
          smsEnabled: smsEnabled || false,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logError(error, {
        userId,
        endpoint: '/api/users/onboarding',
        additionalData: {
          error: error.message,
          firstName,
          notificationsEnabled,
        },
      });

      const appError = handleSupabaseError(error, 'update');
      const errorResponse = createErrorResponse(
        appError.code as keyof typeof ErrorCodes,
        appError.message,
        { originalError: error.message, userId },
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

    return createCorsResponse(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            phoneNumber: user.phone_number,
            firstName: user.profile_data?.firstName || '',
            lastName: user.profile_data?.lastName || '',
            onboardingCompleted: user.onboarding_completed,
            isVerified: user.is_verified,
            biometricEnabled: user.biometric_enabled,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          },
        },
      },
      { origin: origin || undefined },
    );
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        const errorResponse = createErrorResponse(
          ErrorCodes.USER_NOT_FOUND,
          'Authentication required',
          { message: 'Please login to continue' },
          { statusCode: 401 },
        );
        return createCorsResponse(errorResponse, {
          status: 401,
          origin: origin || undefined,
        });
      }

      if (error.message === 'Invalid token') {
        const errorResponse = createErrorResponse(
          ErrorCodes.VERIFICATION_FAILED,
          'Invalid or expired token',
          { message: 'Please login again' },
          { statusCode: 401 },
        );
        return createCorsResponse(errorResponse, {
          status: 401,
          origin: origin || undefined,
        });
      }
    }

    logError(error as Error, {
      endpoint: '/api/users/onboarding',
      additionalData: { requestBody: body },
    });

    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'An unexpected error occurred while completing onboarding',
      {
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { retryable: true },
    );

    return createCorsResponse(errorResponse, {
      status: 500,
      origin: origin || undefined,
    });
  }
}

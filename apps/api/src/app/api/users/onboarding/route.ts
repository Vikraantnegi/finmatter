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
  notificationsEnabled: z.boolean().optional().default(false),
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
export async function OPTIONS() {
  return handleCorsPreflight();
}

/**
 * PUT /api/users/onboarding
 * Complete user onboarding
 */
export async function PUT(request: NextRequest) {
  let body;
  try {
    const userId = await getAuthenticatedUserId(request);

    // Parse and validate request body
    body = await request.json();
    const validation = CompleteOnboardingSchema.safeParse(body);

    if (!validation.success) {
      const errorResponse = createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid request data',
        validation.error.errors,
      );
      return createCorsResponse(errorResponse, { status: 400 });
    }

    const { firstName, lastName, notificationsEnabled } = validation.data;

    // Update user record
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        name: lastName ? `${firstName} ${lastName}` : firstName,
        onboarding_completed: true,
        notifications_enabled: notificationsEnabled || false,
        profile_data: {
          firstName,
          lastName: lastName || '',
          notificationsEnabled: notificationsEnabled || false,
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
        additionalData: { error: error.message },
      });

      const appError = handleSupabaseError(error, 'update');
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

    return createCorsResponse({
      success: true,
      data: {
        user: {
          id: user.id,
          phoneNumber: user.phone_number,
          name: user.name,
          firstName:
            user.profile_data?.firstName || user.name?.split(' ')[0] || '',
          lastName:
            user.profile_data?.lastName ||
            user.name?.split(' ').slice(1).join(' ') ||
            '',
          onboardingCompleted: user.onboarding_completed,
          isVerified: user.is_verified,
          biometricEnabled: user.biometric_enabled,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      },
    });
  } catch (error) {
    logError(error as Error, {
      endpoint: '/api/users/onboarding',
      additionalData: { requestBody: body },
    });

    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'An unexpected error occurred while completing onboarding',
      undefined,
      { retryable: true },
    );

    return createCorsResponse(errorResponse, { status: 500 });
  }
}

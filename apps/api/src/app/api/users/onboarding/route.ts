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
  console.log(
    '🔑 Auth header:',
    authHeader ? `${authHeader.substring(0, 20)}...` : 'null',
  );

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.split(' ')[1];
  console.log('🎫 Token:', token ? `${token.substring(0, 20)}...` : 'null');

  const { data: userResponse, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  console.log('👤 Supabase response:', {
    hasUser: !!userResponse?.user,
    error: userError?.message,
  });

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
    console.log('🔍 Onboarding API called');
    console.log(
      '📋 Request headers:',
      Object.fromEntries(request.headers.entries()),
    );

    const userId = await getAuthenticatedUserId(request);
    console.log('✅ User authenticated:', userId);

    // Parse and validate request body
    try {
      body = await request.json();
      console.log('📦 Request body:', body);
    } catch (parseError) {
      console.error('❌ Request body parsing failed:', parseError);
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
      return createCorsResponse(errorResponse, { status: 400 });
    }

    const validation = CompleteOnboardingSchema.safeParse(body);
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.error.errors);
      const errorResponse = createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid request data',
        validation.error.errors,
      );
      return createCorsResponse(errorResponse, { status: 400 });
    }

    const { firstName, lastName, notificationsEnabled } = validation.data;
    console.log('✅ Data validated:', {
      firstName,
      lastName,
      notificationsEnabled,
    });

    // Update user record
    console.log('🔄 Updating user record...');
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
      console.error('❌ Database update failed:', error);
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

      return createCorsResponse(errorResponse, { status: appError.statusCode });
    }

    console.log('✅ User updated successfully:', user?.id);

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
    console.error('❌ Onboarding API error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        const errorResponse = createErrorResponse(
          ErrorCodes.USER_NOT_FOUND,
          'Authentication required',
          { message: 'Please login to continue' },
          { statusCode: 401 },
        );
        return createCorsResponse(errorResponse, { status: 401 });
      }

      if (error.message === 'Invalid token') {
        const errorResponse = createErrorResponse(
          ErrorCodes.VERIFICATION_FAILED,
          'Invalid or expired token',
          { message: 'Please login again' },
          { statusCode: 401 },
        );
        return createCorsResponse(errorResponse, { status: 401 });
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

    return createCorsResponse(errorResponse, { status: 500 });
  }
}

/**
 * User Profile API Endpoint
 * GET /api/users/:userId - Get user profile by ID
 * PUT /api/users/:userId - Update user profile by ID
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
import { dbUserToApiUser } from '@/lib/dataTransform';
import { z } from 'zod';

// Request validation schema for updates
const UpdateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).optional(),
  lastName: z.string().max(50).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().min(10).max(20).optional(),
  displayName: z.string().max(150).optional(),
  avatar: z.string().max(2048).optional(),
  dateOfBirth: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
  onboardingCompleted: z.boolean().optional(),
});

// Helper function to get authenticated user ID and validate access
async function getAuthenticatedUserIdAndValidateAccess(
  request: NextRequest,
  targetUserId: string,
): Promise<string> {
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

  const authenticatedUserId = userResponse.user.id;

  // Validate that the authenticated user can access the target user's data
  // For now, users can only access their own data
  if (authenticatedUserId !== targetUserId) {
    throw new Error('Forbidden: Cannot access other user data');
  }

  return authenticatedUserId;
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * GET /api/users/:userId
 * Get user profile by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  const origin = request.headers.get('origin');
  try {
    const userId = await getAuthenticatedUserIdAndValidateAccess(
      request,
      params.userId,
    );

    // Fetch complete user profile from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logError(error, {
        userId,
        endpoint: `/api/users/${userId}`,
        additionalData: {
          error: error.message,
        },
      });

      const appError = handleSupabaseError(error, 'select');
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

    if (!user) {
      const errorResponse = createErrorResponse(
        ErrorCodes.USER_NOT_FOUND,
        'User profile not found',
        { userId },
        { statusCode: 404, retryable: false },
      );
      return createCorsResponse(errorResponse, {
        status: 404,
        origin: origin || undefined,
      });
    }

    // Return complete user profile data using consistent transformation
    return createCorsResponse(
      {
        success: true,
        data: {
          user: dbUserToApiUser(user),
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

      if (error.message === 'Forbidden: Cannot access other user data') {
        const errorResponse = createErrorResponse(
          ErrorCodes.VERIFICATION_FAILED,
          'Access denied',
          { message: 'Cannot access other user data' },
          { statusCode: 403 },
        );
        return createCorsResponse(errorResponse, {
          status: 403,
          origin: origin || undefined,
        });
      }
    }

    logError(error as Error, {
      endpoint: `/api/users/${params.userId}`,
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: params.userId,
      },
    });

    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to fetch user profile',
      {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
      { retryable: true },
    );

    return createCorsResponse(errorResponse, {
      status: 500,
      origin: origin || undefined,
    });
  }
}

/**
 * PUT /api/users/:userId
 * Update user profile by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  const origin = request.headers.get('origin');
  try {
    const userId = await getAuthenticatedUserIdAndValidateAccess(
      request,
      params.userId,
    );

    // Parse and validate request body
    let body;
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

    const validation = UpdateUserSchema.safeParse(body);
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

    const updateData = validation.data;

    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      logError(fetchError, {
        userId,
        endpoint: `/api/users/${userId}`,
        additionalData: { error: fetchError.message },
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

    if (!existingUser) {
      const errorResponse = createErrorResponse(
        ErrorCodes.USER_NOT_FOUND,
        'User profile not found',
        { userId },
        { statusCode: 404, retryable: false },
      );
      return createCorsResponse(errorResponse, {
        status: 404,
        origin: origin || undefined,
      });
    }

    const profileData: Record<string, any> = {
      ...(existingUser.profile_data || {}),
    };

    if (updateData.firstName !== undefined) {
      profileData.firstName = updateData.firstName;
    }

    if (updateData.lastName !== undefined) {
      profileData.lastName = updateData.lastName;
    }

    if (updateData.displayName !== undefined) {
      profileData.displayName = updateData.displayName;
    }

    if (updateData.avatar !== undefined) {
      profileData.avatar = updateData.avatar || '';
    }

    if (updateData.dateOfBirth !== undefined) {
      profileData.dateOfBirth = updateData.dateOfBirth;
    }

    const dbUpdateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
      profile_data: profileData,
    };

    if (updateData.phoneNumber !== undefined) {
      dbUpdateData.phone_number = updateData.phoneNumber;
    }

    if (updateData.email !== undefined) {
      dbUpdateData.email = updateData.email;
    }

    if (updateData.notificationsEnabled !== undefined) {
      dbUpdateData.notifications_enabled = updateData.notificationsEnabled;
    }

    if (updateData.onboardingCompleted !== undefined) {
      dbUpdateData.onboarding_completed = updateData.onboardingCompleted;
    }

    // Update user record
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(dbUpdateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logError(error, {
        userId,
        endpoint: `/api/users/${userId}`,
        additionalData: {
          error: error.message,
          updateData,
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
          user: dbUserToApiUser(user),
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

      if (error.message === 'Forbidden: Cannot access other user data') {
        const errorResponse = createErrorResponse(
          ErrorCodes.VERIFICATION_FAILED,
          'Access denied',
          { message: 'Cannot access other user data' },
          { statusCode: 403 },
        );
        return createCorsResponse(errorResponse, {
          status: 403,
          origin: origin || undefined,
        });
      }
    }

    logError(error as Error, {
      endpoint: `/api/users/${params.userId}`,
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: params.userId,
      },
    });

    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to update user profile',
      {
        originalError: error instanceof Error ? error.message : 'Unknown error',
      },
      { retryable: true },
    );

    return createCorsResponse(errorResponse, {
      status: 500,
      origin: origin || undefined,
    });
  }
}

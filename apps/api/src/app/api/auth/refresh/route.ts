/**
 * Refresh Token API Endpoint
 * POST /api/auth/refresh
 * Refreshes access token using refresh token to extend session
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

// Note: Refresh token validation schema removed - now using httpOnly cookie instead of request body

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from httpOnly cookie
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    // Get refresh token from httpOnly cookie (more secure than request body)
    const refreshTokenCookie = request.cookies.get('finmatter-refresh-token');
    const refreshToken = refreshTokenCookie?.value;

    if (!refreshToken) {
      const errorResponse = createErrorResponse(
        ErrorCodes.VERIFICATION_FAILED,
        'No refresh token found. Please login again.',
        undefined,
        { retryable: false },
      );
      return createCorsResponse(errorResponse, { status: 401, origin: origin || undefined });
    }

    // Refresh the session using Supabase
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      logError(error, {
        endpoint: '/api/auth/refresh',
        additionalData: { error: error.message },
      });

      const appError = handleSupabaseError(error, 'refresh');
      const errorResponse = createErrorResponse(
        appError.code as keyof typeof ErrorCodes,
        appError.message,
        { originalError: error.message },
        {
          statusCode: appError.statusCode,
          retryable: appError.statusCode >= 500,
        },
      );

      return createCorsResponse(errorResponse, { status: appError.statusCode, origin: origin || undefined });
    }

    if (!data.session) {
      const errorResponse = createErrorResponse(
        ErrorCodes.SESSION_CREATION_FAILED,
        'Failed to refresh session. Please login again.',
        undefined,
        { retryable: false },
      );
      return createCorsResponse(errorResponse, { status: 401, origin: origin || undefined });
    }

    // Return success response with new session and update cookies
    const response = createCorsResponse({
      success: true,
      data: {
        session: {
          token: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
        },
        message: 'Session refreshed successfully',
      },
    }, { origin: origin || undefined });

    // Update authentication cookies with new tokens and proper security
    const accessTokenOptions = {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: false, // Need client-side access for API calls
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax' as const,
      path: '/',
    };

    const refreshTokenOptions = {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      httpOnly: true, // More secure for refresh tokens
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax' as const,
      path: '/',
    };

    // Set new access token cookie
    const accessTokenCookie = `finmatter-auth-token=${data.session.access_token}; Max-Age=${accessTokenOptions.maxAge}; Path=${accessTokenOptions.path}; SameSite=${accessTokenOptions.sameSite}${accessTokenOptions.secure ? '; Secure' : ''}`;

    // Set new refresh token cookie
    const newRefreshTokenCookie = `finmatter-refresh-token=${data.session.refresh_token}; Max-Age=${refreshTokenOptions.maxAge}; Path=${refreshTokenOptions.path}; SameSite=${refreshTokenOptions.sameSite}; HttpOnly${refreshTokenOptions.secure ? '; Secure' : ''}`;

    response.headers.append('Set-Cookie', accessTokenCookie);
    response.headers.append('Set-Cookie', newRefreshTokenCookie);

    return response;
  } catch (error) {
    logError(error as Error, {
      endpoint: '/api/auth/refresh',
      additionalData: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'An unexpected error occurred while refreshing session',
      undefined,
      { retryable: true },
    );

    return createCorsResponse(errorResponse, { status: 500, origin: origin || undefined });
  }
}

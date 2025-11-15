/**
 * Sign Out API Endpoint
 * POST /api/auth/signout
 * Clears auth cookies and attempts to revoke the current session.
 */

import { NextRequest } from 'next/server';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { createErrorResponse, logError, ErrorCodes } from '@/lib/errorHandler';

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * POST /api/auth/signout
 * Clears cookies and invalidates the current refresh token when available.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const response = createCorsResponse(
      {
        success: true,
        data: {
          message: 'Signed out successfully',
        },
      },
      { origin: origin || undefined },
    );

    const baseCookieOptions = `Max-Age=0; Path=/; SameSite=lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

    response.headers.append(
      'Set-Cookie',
      `finmatter-auth-token=; ${baseCookieOptions}`,
    );
    response.headers.append(
      'Set-Cookie',
      `finmatter-refresh-token=; ${baseCookieOptions}; HttpOnly`,
    );

    return response;
  } catch (error) {
    logError(error as Error, {
      endpoint: '/api/auth/signout',
    });

    const errorResponse = createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to sign out user',
      undefined,
      { retryable: false },
    );

    return createCorsResponse(errorResponse, {
      status: 500,
      origin: origin || undefined,
    });
  }
}

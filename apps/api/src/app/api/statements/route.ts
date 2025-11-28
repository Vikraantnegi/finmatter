/**
 * Statements API Endpoint
 * GET /api/statements - List user's statements
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { AppError } from '@/lib/errorHandler';

/**
 * Get authenticated user ID from request
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new AppError('INVALID_TOKEN', 'Invalid or expired token', 401);
  }

  return user.id;
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * GET /api/statements
 * List user's statements with optional filters
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('card_id');
    const status = searchParams.get('status') as
      | 'pending'
      | 'processing'
      | 'success'
      | 'failed'
      | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabaseAdmin
      .from('statements')
      .select(
        `
        *,
        cards (
          id,
          last_four_digits,
          card_name,
          bank_name
        )
      `,
      )
      .eq('user_id', userId)
      .order('upload_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (cardId) {
      query = query.eq('card_id', cardId);
    }

    if (status) {
      query = query.eq('parsing_status', status);
    }

    const { data: statements, error } = await query;

    if (error) {
      throw new AppError(
        'DATABASE_ERROR',
        'Failed to fetch statements',
        500,
        true,
        { error: error.message },
      );
    }

    // Get total count for pagination
    let countQuery = supabaseAdmin
      .from('statements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (cardId) {
      countQuery = countQuery.eq('card_id', cardId);
    }

    if (status) {
      countQuery = countQuery.eq('parsing_status', status);
    }

    const { count } = await countQuery;

    return createCorsResponse(
      {
        success: true,
        data: {
          statements: statements || [],
          pagination: {
            total: count || 0,
            limit,
            offset,
            hasMore: (count || 0) > offset + limit,
          },
        },
      },
      { origin: origin || undefined },
    );
  } catch (error) {
    if (error instanceof AppError) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            timestamp: new Date().toISOString(),
            details: error.details,
          },
        },
        { status: error.statusCode, origin: origin || undefined },
      );
    }

    return createCorsResponse(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500, origin: origin || undefined },
    );
  }
}

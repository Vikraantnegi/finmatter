/**
 * GET /api/cards/:id/latest-statement
 * Get the latest successfully parsed statement for a card
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
 * GET /api/cards/:id/latest-statement
 * Get the latest successfully parsed statement for a card
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const cardId = params.id;

    // Verify card ownership
    const { data: card, error: cardError } = await supabaseAdmin
      .from('cards')
      .select('id')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (cardError || !card) {
      throw new AppError(
        'CARD_NOT_FOUND',
        'Card not found or access denied',
        404,
      );
    }

    // Get latest successfully parsed statement
    const { data: statement, error: statementError } = await supabaseAdmin
      .from('statements')
      .select('*')
      .eq('card_id', cardId)
      .eq('user_id', userId)
      .eq('parsing_status', 'success')
      .order('parsed_at', { ascending: false })
      .limit(1)
      .single();

    if (statementError || !statement) {
      // No statement found - return null
      return createCorsResponse(
        {
          success: true,
          data: { statement: null },
        },
        { origin: origin || undefined },
      );
    }

    return createCorsResponse(
      {
        success: true,
        data: { statement },
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

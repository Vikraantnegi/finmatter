/**
 * Individual Transaction API Endpoint
 * GET /api/transactions/[id] - Get specific transaction
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * Helper function to get authenticated user ID
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new FinMatterError('Unauthorized', 'AUTH_REQUIRED', 401);
  }

  const token = authHeader.split(' ')[1];
  const { data: userResponse, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  if (userError || !userResponse?.user) {
    throw new FinMatterError('Unauthorized', 'INVALID_TOKEN', 401);
  }

  return userResponse.user.id;
}

/**
 * GET /api/transactions/[id] - Get specific transaction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const transactionId = params.id;

    // Fetch the transaction with card information
    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .select(
        `
        *,
        card:cards (
          id,
          card_name,
          bank_name,
          last_four_digits,
          network
        )
      `,
      )
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (error || !transaction) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          },
        },
        { status: 404, origin: origin || undefined },
      );
    }

    return createCorsResponse(
      {
        success: true,
        data: { transaction },
      },
      { origin: origin || undefined },
    );
  } catch (error) {
    if (error instanceof FinMatterError) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode, origin: origin || undefined },
      );
    }

    console.error('Get transaction error:', error);
    return createCorsResponse(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500, origin: origin || undefined },
    );
  }
}

/**
 * Statement EMI Loans API Endpoint
 * GET /api/statements/[id]/emi-loans - Get EMI loans for a specific statement
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
  const authHeader = request.headers.get('Authorization');

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
 * GET /api/statements/[id]/emi-loans
 * Get EMI loans for a specific statement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const statementId = params.id;

    // First verify the statement belongs to the user
    const { data: statement, error: statementError } = await supabaseAdmin
      .from('statements')
      .select('id')
      .eq('id', statementId)
      .eq('user_id', userId)
      .single();

    if (statementError || !statement) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'STATEMENT_NOT_FOUND',
            message: 'Statement not found',
          },
        },
        { status: 404, origin: origin || undefined },
      );
    }

    // Fetch EMI loans for this statement
    const { data: emiLoans, error } = await supabaseAdmin
      .from('statement_emi_loans')
      .select('*')
      .eq('statement_id', statementId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch EMI loans:', error);
      throw new FinMatterError(
        'Failed to fetch EMI loans',
        'DB_QUERY_FAILED',
        500,
        { error },
      );
    }

    return createCorsResponse(
      {
        success: true,
        data: {
          emiLoans: emiLoans || [],
        },
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

    console.error('Get EMI loans error:', error);
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

/**
 * Statement Status API Endpoint
 * GET /api/statements/[id]/status - Get statement processing status
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
  if (!authHeader?.startsWith('Bearer ')) {
    throw new FinMatterError(
      'Missing or invalid authorization header',
      'UNAUTHORIZED',
      401,
    );
  }

  const token = authHeader.substring(7);
  const { data: userResponse, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !userResponse.user) {
    throw new FinMatterError('Invalid token', 'INVALID_TOKEN', 401);
  }

  return userResponse.user.id;
}

/**
 * GET /api/statements/[id]/status
 * Get statement processing status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const statementId = params.id;

    if (!statementId) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Statement ID is required',
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Get statement status
    const { data: statement, error } = await supabaseAdmin
      .from('statements')
      .select(
        `
        id,
        parsing_status,
        parsing_error,
        transaction_count,
        parsed_at,
        uploaded_at,
        file_name,
        file_size
      `,
      )
      .eq('id', statementId)
      .eq('user_id', userId)
      .single();

    if (error || !statement) {
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

    return createCorsResponse(
      {
        success: true,
        data: {
          statement: {
            id: statement.id,
            status: statement.parsing_status,
            error: statement.parsing_error,
            transactionCount: statement.transaction_count,
            parsedAt: statement.parsed_at,
            uploadedAt: statement.uploaded_at,
            fileName: statement.file_name,
            fileSize: statement.file_size,
          },
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

    console.error('Statement status error:', error);
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

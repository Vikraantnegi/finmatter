/**
 * Statement API Endpoint (Individual Statement)
 * GET /api/statements/:id - Get statement details
 * DELETE /api/statements/:id - Delete statement
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
 * GET /api/statements/:id
 * Get statement details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const statementId = params.id;

    const { data: statement, error } = await supabaseAdmin
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
      .eq('id', statementId)
      .eq('user_id', userId)
      .single();

    if (error || !statement) {
      throw new AppError(
        'STATEMENT_NOT_FOUND',
        'Statement not found or access denied',
        404,
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

/**
 * DELETE /api/statements/:id
 * Delete statement and associated transactions
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const statementId = params.id;

    // Verify statement ownership
    const { data: statement, error: fetchError } = await supabaseAdmin
      .from('statements')
      .select('id, file_path, user_id')
      .eq('id', statementId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !statement) {
      throw new AppError(
        'STATEMENT_NOT_FOUND',
        'Statement not found or access denied',
        404,
      );
    }

    // Delete file from storage
    await supabaseAdmin.storage
      .from('statements')
      .remove([statement.file_path])
      .catch(() => {
        // Ignore storage deletion errors
      });

    // Delete statement (transactions will be cascade deleted)
    const { error: deleteError } = await supabaseAdmin
      .from('statements')
      .delete()
      .eq('id', statementId)
      .eq('user_id', userId);

    if (deleteError) {
      throw new AppError(
        'DELETE_FAILED',
        'Failed to delete statement',
        500,
        true,
        { error: deleteError.message },
      );
    }

    return createCorsResponse(
      {
        success: true,
        data: { message: 'Statement deleted successfully' },
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

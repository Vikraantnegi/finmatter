/**
 * Transaction API Endpoint (Individual Transaction)
 * GET /api/transactions/:id - Get transaction details
 * PATCH /api/transactions/:id - Update transaction (category, notes)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { AppError } from '@/lib/errorHandler';
import { z } from 'zod';

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
 * Update transaction schema
 */
const UpdateTransactionSchema = z.object({
  category: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * GET /api/transactions/:id
 * Get transaction details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const transactionId = params.id;

    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .select(
        `
        *,
        cards (
          id,
          last_four_digits,
          card_name,
          bank_name
        ),
        statements (
          id,
          file_name,
          upload_date
        )
      `,
      )
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (error || !transaction) {
      throw new AppError(
        'TRANSACTION_NOT_FOUND',
        'Transaction not found or access denied',
        404,
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
 * PATCH /api/transactions/:id
 * Update transaction (category, notes)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const origin = request.headers.get('origin');

  try {
    const userId = await getAuthenticatedUserId(request);
    const transactionId = params.id;

    // Verify transaction ownership
    const { data: existingTransaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('id, user_id')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingTransaction) {
      throw new AppError(
        'TRANSACTION_NOT_FOUND',
        'Transaction not found or access denied',
        404,
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = UpdateTransactionSchema.safeParse(body);

    if (!validation.success) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message:
              validation.error.errors[0]?.message || 'Invalid request data',
            timestamp: new Date().toISOString(),
            details: validation.error.errors,
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Build update object
    const updateData: any = {};
    if (validation.data.category !== undefined) {
      updateData.category = validation.data.category || null;
    }
    if (validation.data.notes !== undefined) {
      updateData.notes = validation.data.notes || null;
    }

    // Update transaction
    const { data: updatedTransaction, error: updateError } = await supabaseAdmin
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw new AppError(
        'UPDATE_FAILED',
        'Failed to update transaction',
        500,
        true,
        { error: updateError.message },
      );
    }

    return createCorsResponse(
      {
        success: true,
        data: { transaction: updatedTransaction },
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

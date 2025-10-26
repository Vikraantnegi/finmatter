/**
 * Transaction Category Update API Endpoint
 * PUT /api/transactions/[id]/category - Update transaction category
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { z } from 'zod';
import { addUserCorrection } from '@finmatter/cc-engine';

const UpdateCategorySchema = z.object({
  category: z.enum([
    'dining',
    'shopping',
    'groceries',
    'fuel',
    'travel',
    'entertainment',
    'bills',
    'healthcare',
    'education',
    'transport',
    'utilities',
    'insurance',
    'investment',
    'others',
  ]),
  subcategory: z.string().optional(),
  learnFromCorrection: z.boolean().default(true),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * Get authenticated user ID from request
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new FinMatterError(
      'Missing or invalid authorization header',
      'AUTHENTICATION_ERROR',
      401,
    );
  }

  const token = authHeader.substring(7);
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new FinMatterError(
      'Invalid or expired token',
      'AUTHENTICATION_ERROR',
      401,
    );
  }

  return user.id;
}

/**
 * PUT /api/transactions/[id]/category - Update transaction category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const transactionId = params.id;
    const body = await request.json();

    // Validate request body
    const validatedData = UpdateCategorySchema.parse(body);

    // Get the current transaction to check ownership and get original category
    const { data: currentTransaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('id, user_id, category, merchant_name')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !currentTransaction) {
      throw new FinMatterError(
        'Transaction not found or does not belong to user',
        'NOT_FOUND',
        404,
      );
    }

    // Update the transaction category
    const { data: updatedTransaction, error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({
        category: validatedData.category,
        subcategory: validatedData.subcategory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select(
        `
        *,
        cards (
          id,
          cardName,
          bankName,
          lastFourDigits
        )
      `,
      )
      .single();

    if (updateError) {
      console.error('Error updating transaction category:', updateError);
      throw new FinMatterError(
        'Failed to update transaction category',
        'INTERNAL_SERVER_ERROR',
        500,
      );
    }

    // Learn from user correction if enabled
    if (
      validatedData.learnFromCorrection &&
      currentTransaction.category !== validatedData.category
    ) {
      try {
        addUserCorrection(
          userId,
          currentTransaction.merchant_name,
          currentTransaction.category,
          validatedData.category,
          1.0,
          'manual',
        );
      } catch (learningError) {
        console.warn('Failed to learn from user correction:', learningError);
        // Don't fail the request if learning fails
      }
    }

    return createCorsResponse(
      JSON.stringify({
        success: true,
        data: updatedTransaction,
        message: 'Transaction category updated successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error in PUT /api/transactions/[id]/category:', error);

    if (error instanceof FinMatterError) {
      return createCorsResponse(
        JSON.stringify({
          success: false,
          error: error.message,
          code: error.code,
        }),
        {
          status: error.statusCode,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    if (error instanceof z.ZodError) {
      return createCorsResponse(
        JSON.stringify({
          success: false,
          error: 'Validation error',
          details: error.errors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    return createCorsResponse(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}

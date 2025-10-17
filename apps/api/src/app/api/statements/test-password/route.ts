/**
 * Test endpoint for password-protected PDF parsing
 * POST /api/statements/test-password - Test PDF parsing with password
 */

import { NextRequest } from 'next/server';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { parseStatement, type BankName } from '@finmatter/cc-engine/server';
import { z } from 'zod';

const TestPasswordSchema = z.object({
  bankName: z.enum(['hdfc', 'icici', 'sbi', 'axis']),
  password: z.string().optional(),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * Test password-protected PDF parsing
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bankName = formData.get('bankName') as string | null;
    const password = formData.get('password') as string | null;

    if (!file || !bankName) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Missing required fields: file and bankName are required',
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Validate request data
    const validation = TestPasswordSchema.safeParse({
      bankName,
      password: password || undefined,
    });
    if (!validation.success) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Parse the PDF with password
    const result = await parseStatement(
      fileBuffer,
      bankName as BankName,
      password || undefined,
    );

    return createCorsResponse(
      {
        success: true,
        data: {
          message: 'PDF parsing test completed',
          result: {
            success: result.success,
            transactionCount: result.transactions.length,
            metadataFields: {
              cardNumber: !!result.metadata.cardLastFourDigits,
              statementDate: !!result.metadata.statementDate,
              totalDue: !!result.metadata.totalDue,
              creditLimit: !!result.metadata.creditLimit,
            },
            errors: result.errors,
            warnings: result.warnings,
            // Include first 1000 chars of raw text for debugging
            rawTextPreview: result.rawText?.substring(0, 1000) || '',
          },
        },
      },
      { origin: origin || undefined },
    );
  } catch (error) {
    console.error('Test password endpoint error:', error);
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

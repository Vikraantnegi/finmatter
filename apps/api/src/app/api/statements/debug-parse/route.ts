/**
 * Debug Statement Parser API Endpoint
 * POST /api/statements/debug-parse - Parse PDF without saving to database
 *
 * This endpoint is for testing and debugging the PDF parser.
 * It returns the raw parse results without persisting to the database.
 */

// Import polyfills first
import '@/lib/polyfills';

import { NextRequest } from 'next/server';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { parseStatement } from '@finmatter/cc-engine/server';
import { z } from 'zod';

// Force Node.js runtime for PDF parsing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['application/pdf'];

const DebugParseSchema = z.object({
  bankName: z.enum([
    'hdfc',
    'icici',
    'sbi',
    'axis',
    'kotak',
    'citi',
    'amex',
    'hsbc',
  ]),
});

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * POST /api/statements/debug-parse
 * Debug endpoint to test PDF parsing without saving to database
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
    const validation = DebugParseSchema.safeParse({ bankName });
    if (!validation.success) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid bank name',
            details: validation.error.errors,
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Only PDF files are allowed',
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Parse the PDF
    const startTime = Date.now();
    const result = await parseStatement(
      fileBuffer,
      validation.data.bankName,
      password || undefined,
    );
    const parseTime = Date.now() - startTime;

    // Return detailed parse results
    return createCorsResponse(
      {
        success: true,
        data: {
          parseResult: {
            ...result,
            rawText: result.rawText || 'No text extracted',
          },
          debugInfo: {
            fileName: file.name,
            fileSize: file.size,
            fileSizeReadable: `${(file.size / 1024).toFixed(2)} KB`,
            bankName: validation.data.bankName,
            passwordUsed: !!password,
            parseTimeMs: parseTime,
            parsingSuccess: result.success,

            // Statistics
            stats: {
              transactionCount: result.transactions.length,
              errorCount: result.errors.length,
              warningCount: result.warnings.length,

              // Metadata completeness
              metadataFields: {
                cardNumber: !!result.metadata.cardLastFourDigits,
                statementDate: !!result.metadata.statementDate,
                statementPeriod: !!(
                  result.metadata.statementPeriodStart &&
                  result.metadata.statementPeriodEnd
                ),
                dueDate: !!result.metadata.dueDate,
                minimumPayment: !!result.metadata.minimumPayment,
                totalDue: !!result.metadata.totalDue,
                creditLimit: !!result.metadata.creditLimit,
                availableCredit: !!result.metadata.availableCredit,
                rewardPoints: !!result.metadata.rewardPoints,
                emiSummary: !!result.metadata.emiSummary,
                spendsOverview: !!result.metadata.spendsOverview,
                cashAdvanceLimit: !!result.metadata.cashAdvanceLimit,
                latePaymentFee: !!result.metadata.latePaymentFee,
                interestCharges: !!result.metadata.interestCharges,
              },

              // Transaction field completeness
              transactionFields: {
                withCategory: result.transactions.filter(t => t.category)
                  .length,
                withLocation: result.transactions.filter(t => t.location)
                  .length,
                withRewardPoints: result.transactions.filter(
                  t => t.rewardPoints,
                ).length,
                withReference: result.transactions.filter(
                  t => t.referenceNumber,
                ).length,
                withEMI: result.transactions.filter(t => t.isEMI).length,
                withGST: result.transactions.filter(t => t.gstAmount).length,
              },

              // Transaction types breakdown
              transactionTypes: {
                debit: result.transactions.filter(t => t.type === 'debit')
                  .length,
                credit: result.transactions.filter(t => t.type === 'credit')
                  .length,
                refund: result.transactions.filter(t => t.type === 'refund')
                  .length,
                fee: result.transactions.filter(t => t.type === 'fee').length,
                interest: result.transactions.filter(t => t.type === 'interest')
                  .length,
              },
            },
          },
        },
      },
      { status: 200, origin: origin || undefined },
    );
  } catch (error: any) {
    console.error('Debug parse error:', error);

    return createCorsResponse(
      {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: error.message || 'Failed to parse PDF',
          stack:
            process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      { status: 500, origin: origin || undefined },
    );
  }
}

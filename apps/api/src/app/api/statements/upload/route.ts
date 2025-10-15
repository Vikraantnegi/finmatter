/**
 * Statement Upload API Endpoint
 * POST /api/statements/upload - Upload and parse PDF statement
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { FinMatterError } from '@finmatter/shared';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { parseStatement, type BankName } from '@finmatter/cc-engine/server';
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['application/pdf'];

const UploadStatementSchema = z.object({
  cardId: z.string().uuid('Invalid card ID'),
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
 * POST /api/statements/upload
 * Upload and parse a PDF statement
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  // Apply rate limiting
  const { checkRateLimit, getClientIdentifier } = await import(
    '@/lib/rateLimit'
  );
  const identifier = await getClientIdentifier(request);
  const STATEMENT_UPLOAD_LIMIT = {
    name: 'STATEMENT_UPLOAD',
    max: 5,
    windowMs: 60 * 60 * 1000, // 5 per hour
    message: 'Too many statement uploads. Please wait before uploading more.',
  };

  const rateLimit = checkRateLimit(identifier, STATEMENT_UPLOAD_LIMIT);

  if (rateLimit.limited) {
    return createCorsResponse(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: STATEMENT_UPLOAD_LIMIT.message,
          details: {
            retryAfter: rateLimit.retryAfter,
          },
        },
      },
      {
        status: 429,
        origin: origin || undefined,
        headers: {
          'Retry-After': rateLimit.retryAfter.toString(),
        },
      },
    );
  }

  try {
    const userId = await getAuthenticatedUserId(request);

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const cardId = formData.get('cardId') as string | null;
    const bankName = formData.get('bankName') as string | null;

    if (!file || !cardId || !bankName) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message:
              'Missing required fields: file, cardId, and bankName are required',
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Validate request data
    const validation = UploadStatementSchema.safeParse({ cardId, bankName });
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

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Only PDF files are allowed',
            details: { fileType: file.type },
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
            message: 'File size must be less than 5MB',
            details: { fileSize: file.size, maxSize: MAX_FILE_SIZE },
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Verify card belongs to user
    const { data: card, error: cardError } = await supabaseAdmin
      .from('cards')
      .select('id, user_id')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single();

    if (cardError || !card) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'CARD_NOT_FOUND',
            message: 'Card not found or does not belong to you',
          },
        },
        { status: 404, origin: origin || undefined },
      );
    }

    // Upload file to Supabase Storage
    const fileName = `${userId}/${cardId}/${Date.now()}-${file.name}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('statements')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      throw new FinMatterError(
        'Failed to upload file',
        'STORAGE_UPLOAD_FAILED',
        500,
        { error: uploadError },
      );
    }

    // Create statement record with pending status
    const { data: statement, error: statementError } = await supabaseAdmin
      .from('statements')
      .insert({
        user_id: userId,
        card_id: cardId,
        file_path: uploadData.path,
        file_name: file.name,
        file_size: file.size,
        parsing_status: 'processing',
      })
      .select()
      .single();

    if (statementError) {
      // Clean up uploaded file if statement creation fails
      await supabaseAdmin.storage.from('statements').remove([fileName]);

      console.error('Failed to create statement record:', statementError);
      throw new FinMatterError(
        'Failed to create statement record',
        'DB_INSERT_FAILED',
        500,
        { error: statementError },
      );
    }

    // Parse PDF in background (async, don't await)
    parseStatementAsync(
      statement.id,
      fileBuffer,
      validation.data.bankName,
      userId,
      cardId,
    ).catch(error => {
      console.error('Statement parsing failed:', error);
    });

    return createCorsResponse(
      {
        success: true,
        data: {
          statement: {
            id: statement.id,
            fileName: file.name,
            fileSize: file.size,
            status: 'processing',
            uploadedAt: statement.uploaded_at,
          },
          message: 'Statement uploaded successfully. Parsing in progress.',
        },
      },
      { status: 202, origin: origin || undefined },
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

    console.error('Statement upload error:', error);
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

/**
 * Parse statement asynchronously and update database
 */
async function parseStatementAsync(
  statementId: string,
  fileBuffer: Buffer,
  bankName: BankName,
  userId: string,
  cardId: string,
) {
  try {
    // Parse the PDF
    const result = await parseStatement(fileBuffer, bankName);

    if (!result.success) {
      // Update statement with error
      await supabaseAdmin
        .from('statements')
        .update({
          parsing_status: 'failed',
          parsing_error: result.errors.join('; '),
          parsed_at: new Date().toISOString(),
        })
        .eq('id', statementId);

      return;
    }

    // Update statement metadata
    await supabaseAdmin
      .from('statements')
      .update({
        parsing_status: 'success',
        transaction_count: result.transactions.length,
        due_date: result.metadata.dueDate,
        minimum_payment: result.metadata.minimumPayment,
        credit_limit: result.metadata.creditLimit,
        available_credit: result.metadata.availableCredit,
        parsed_at: new Date().toISOString(),
      })
      .eq('id', statementId);

    // Insert transactions
    const transactions = result.transactions.map(t => ({
      user_id: userId,
      card_id: cardId,
      statement_id: statementId,
      transaction_date: t.date,
      merchant_name: t.merchantName,
      amount: t.amount,
      transaction_type: t.type,
      raw_text: t.rawText,
      category: t.category || 'others',
      source: 'pdf' as const,
      status: 'completed' as const,
    }));

    if (transactions.length > 0) {
      const { error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert(transactions);

      if (transactionError) {
        console.error('Failed to insert transactions:', transactionError);
        // Mark as failed if transactions couldn't be inserted
        await supabaseAdmin
          .from('statements')
          .update({
            parsing_status: 'failed',
            parsing_error: 'Failed to insert transactions',
          })
          .eq('id', statementId);
      }
    }
  } catch (error) {
    console.error('Parse statement async error:', error);
    await supabaseAdmin
      .from('statements')
      .update({
        parsing_status: 'failed',
        parsing_error: error instanceof Error ? error.message : 'Unknown error',
        parsed_at: new Date().toISOString(),
      })
      .eq('id', statementId);
  }
}

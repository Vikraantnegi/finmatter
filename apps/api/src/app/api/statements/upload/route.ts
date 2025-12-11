/**
 * Statement Upload API Endpoint
 * POST /api/statements/upload
 * Accepts multipart/form-data with PDF file, card_id, bank_name, and optional password
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { createCorsResponse, handleCorsPreflight } from '@/lib/cors';
import { AppError, logError } from '@/lib/errorHandler';
import {
  parseStatement,
  type BankName,
  type ParsedTransaction,
  extractCardMetadataWithLLM,
  extractTextFromPDF,
} from '@finmatter/cc-engine';
import { resolveBankIdByName } from '@/lib/binLookup';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const STATEMENTS_BUCKET = 'statements';

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
 * Validate that the card belongs to the user
 */
async function validateCardOwnership(
  userId: string,
  cardId: string,
): Promise<void> {
  const { data: card, error } = await supabaseAdmin
    .from('cards')
    .select('id, user_id')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single();

  if (error || !card) {
    throw new AppError(
      'CARD_NOT_FOUND',
      'Card not found or access denied',
      404,
    );
  }
}

/**
 * Upload PDF to Supabase Storage
 */
async function uploadToStorage(
  userId: string,
  cardId: string,
  file: File,
): Promise<{ path: string; fileName: string }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${cardId}/${Date.now()}.${fileExt}`;
  const fileBuffer = await file.arrayBuffer();

  const { data, error } = await supabaseAdmin.storage
    .from(STATEMENTS_BUCKET)
    .upload(fileName, fileBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) {
    logError(new Error(error.message), {
      userId,
      additionalData: { cardId, fileName: file.name, error: error.message },
    });
    throw new AppError(
      'STORAGE_UPLOAD_FAILED',
      'Failed to upload file to storage',
      500,
    );
  }

  return { path: data.path, fileName: file.name };
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleCorsPreflight(origin || undefined);
}

/**
 * POST /api/statements/upload
 * Upload and parse a credit card statement PDF
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    // Authenticate user
    const userId = await getAuthenticatedUserId(request);

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const cardId = formData.get('card_id') as string | null;
    const bankName = formData.get('bank_name') as string | null;
    const password = formData.get('password') as string | null;

    // Validate required fields
    if (!file) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'PDF file is required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    if (!cardId) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'MISSING_CARD_ID',
            message: 'card_id is required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    if (!bankName) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'MISSING_BANK_NAME',
            message: 'bank_name is required',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Only PDF files are allowed',
            timestamp: new Date().toISOString(),
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
            message: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Validate bank name
    const validBanks: BankName[] = ['hdfc', 'icici', 'amex'];
    const normalizedBankName = bankName.toLowerCase() as BankName;
    if (!validBanks.includes(normalizedBankName)) {
      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'INVALID_BANK_NAME',
            message: `Unsupported bank. Supported banks: ${validBanks.join(', ')}`,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400, origin: origin || undefined },
      );
    }

    // Validate card ownership
    await validateCardOwnership(userId, cardId);

    // Upload file to Supabase Storage
    const { path: filePath, fileName } = await uploadToStorage(
      userId,
      cardId,
      file,
    );

    // Read file buffer for parsing
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Create statement record with 'processing' status
    const { data: statement, error: statementError } = await supabaseAdmin
      .from('statements')
      .insert({
        user_id: userId,
        card_id: cardId,
        file_path: filePath,
        file_name: fileName,
        file_size: file.size,
        bank_name: normalizedBankName,
        parsing_status: 'processing',
      })
      .select()
      .single();

    if (statementError || !statement) {
      logError(
        statementError
          ? new Error(statementError.message)
          : new Error('Statement creation failed'),
        {
          userId,
          additionalData: { cardId, fileName, error: statementError?.message },
        },
      );

      // Try to clean up uploaded file
      await supabaseAdmin.storage
        .from(STATEMENTS_BUCKET)
        .remove([filePath])
        .catch(() => {
          // Ignore cleanup errors
        });

      return createCorsResponse(
        {
          success: false,
          error: {
            code: 'STATEMENT_CREATE_FAILED',
            message: 'Failed to create statement record',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500, origin: origin || undefined },
      );
    }

    const statementId = statement.id;

    // Return immediately with processing status
    // Parsing will happen in the background
    // Start parsing asynchronously (don't await)
    parseStatementAsync(
      statementId,
      userId,
      cardId,
      fileBuffer,
      normalizedBankName,
      password || undefined,
    ).catch(async error => {
      // Log error and update statement status to failed
      const errorToLog =
        error instanceof Error ? error : new Error(String(error));

      logError(errorToLog, {
        userId,
        additionalData: {
          cardId,
          statementId,
          error: errorToLog.message,
        },
      });

      // Update statement status to failed with error message
      try {
        await supabaseAdmin
          .from('statements')
          .update({
            parsing_status: 'failed',
            parsing_error: errorToLog.message,
          })
          .eq('id', statementId);
      } catch (updateError) {
        // Log update error but don't throw
        console.error('Failed to update statement status:', updateError);
      }
    });

    // Return success immediately with processing status
    return createCorsResponse(
      {
        success: true,
        data: {
          statement: {
            ...statement,
            parsing_status: 'processing',
          },
          message: 'Statement uploaded successfully. Parsing in progress...',
        },
      },
      { origin: origin || undefined },
    );
  } catch (error) {
    // Handle AppError
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

    // Handle unexpected errors
    const errorToLog =
      error instanceof Error ? error : new Error(String(error));
    logError(errorToLog, {
      endpoint: '/api/statements/upload',
      additionalData: {
        error: errorToLog.message,
      },
    });

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
 * Parse statement asynchronously in the background
 */
async function parseStatementAsync(
  statementId: string,
  userId: string,
  cardId: string,
  fileBuffer: Buffer,
  bankName: BankName,
  password?: string,
): Promise<void> {
  try {
    // Get LLM configuration from environment
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const useLLMFallback = process.env.USE_LLM_FALLBACK !== 'false'; // Default to true
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL;
    const useOllama = process.env.USE_OLLAMA === 'true';

    // Determine LLM provider: Prefer Ollama if available, fallback to OpenAI
    let llmProvider: 'openai' | 'ollama' | undefined;
    if (useOllama || ollamaBaseUrl) {
      llmProvider = 'ollama';
    } else if (openaiApiKey) {
      llmProvider = 'openai';
    }

    // Parse the PDF
    const parseResult = await parseStatement(fileBuffer, bankName, password, {
      openaiApiKey,
      useLLMFallback,
      ollamaBaseUrl:
        ollamaBaseUrl ||
        (llmProvider === 'ollama' ? 'http://localhost:11434' : undefined),
      llmProvider,
    });

    // Insert transactions if parsing was successful
    if (parseResult.success && parseResult.transactions.length > 0) {
      const transactionsToInsert = parseResult.transactions.map(
        (txn: ParsedTransaction) => ({
          user_id: userId,
          card_id: cardId,
          statement_id: statementId,
          transaction_date: txn.transactionDate.toISOString().split('T')[0],
          posting_date: txn.postingDate
            ? txn.postingDate.toISOString().split('T')[0]
            : null,
          merchant_name: txn.merchantName,
          merchant_category: txn.merchantCategory || null,
          amount: Math.abs(txn.amount),
          type: txn.type,
          currency: txn.currency || 'INR',
          description: txn.description || null,
          raw_text: txn.rawText,
          category: null, // Will be auto-categorized later
        }),
      );

      const { error: transactionsError } = await supabaseAdmin
        .from('transactions')
        .insert(transactionsToInsert);

      if (transactionsError) {
        logError(new Error(transactionsError.message), {
          userId,
          additionalData: {
            cardId,
            statementId,
            transactionCount: transactionsToInsert.length,
            error: transactionsError.message,
          },
        });

        // Update statement with error
        await supabaseAdmin
          .from('statements')
          .update({
            parsing_status: 'failed',
            parsing_error: `Failed to insert transactions: ${transactionsError.message}`,
            parsed_at: new Date().toISOString(),
          })
          .eq('id', statementId);

        return;
      }
    }

    // Update statement with success and metadata
    const updateData: any = {
      parsing_status: parseResult.success ? 'success' : 'failed',
      parsed_at: new Date().toISOString(),
      transaction_count: parseResult.transactions.length,
    };

    const meta = parseResult.metadata;

    // Statement periods
    if (meta.statementPeriodStart) {
      updateData.statement_period_start = meta.statementPeriodStart
        .toISOString()
        .split('T')[0];
    }
    if (meta.statementPeriodEnd) {
      updateData.statement_period_end = meta.statementPeriodEnd
        .toISOString()
        .split('T')[0];
    }

    // Billing cycles
    if (meta.billingCycleStart) {
      updateData.billing_cycle_start = meta.billingCycleStart
        .toISOString()
        .split('T')[0];
    }
    if (meta.billingCycleEnd) {
      updateData.billing_cycle_end = meta.billingCycleEnd
        .toISOString()
        .split('T')[0];
    }

    // Payment information
    if (meta.paymentDueDate) {
      updateData.payment_due_date = meta.paymentDueDate
        .toISOString()
        .split('T')[0];
    }
    if (meta.totalAmount !== undefined) {
      updateData.total_amount_due = meta.totalAmount;
    }
    if (meta.minimumDue !== undefined) {
      updateData.minimum_due = meta.minimumDue;
    }
    if (meta.statementDate) {
      updateData.statement_date = meta.statementDate
        .toISOString()
        .split('T')[0];
    }

    // Reward Points
    if (meta.rewardPoints !== undefined) {
      updateData.reward_points_total = meta.rewardPoints;
    }
    if (meta.rewardPointsOpeningBalance !== undefined) {
      updateData.reward_points_opening_balance =
        meta.rewardPointsOpeningBalance;
    }
    if (meta.rewardPointsEarned !== undefined) {
      updateData.reward_points_earned = meta.rewardPointsEarned;
    }
    if (meta.rewardPointsDisbursed !== undefined) {
      updateData.reward_points_disbursed = meta.rewardPointsDisbursed;
    }
    if (meta.rewardPointsAdjustedLapsed !== undefined) {
      updateData.reward_points_adjusted_lapsed =
        meta.rewardPointsAdjustedLapsed;
    }
    if (meta.rewardPointsExpiring30Days !== undefined) {
      updateData.reward_points_expiring_30_days =
        meta.rewardPointsExpiring30Days;
    }
    if (meta.rewardPointsExpiring60Days !== undefined) {
      updateData.reward_points_expiring_60_days =
        meta.rewardPointsExpiring60Days;
    }

    // Financial Summary
    if (meta.previousStatementDues !== undefined) {
      updateData.previous_statement_dues = meta.previousStatementDues;
    }
    if (meta.paymentsCreditsReceived !== undefined) {
      updateData.payments_credits_received = meta.paymentsCreditsReceived;
    }
    if (meta.purchasesDebit !== undefined) {
      updateData.purchases_debit = meta.purchasesDebit;
    }
    if (meta.financeCharges !== undefined) {
      updateData.finance_charges = meta.financeCharges;
    }

    // Credit Limits (store as snapshots in statement for historical tracking)
    if (meta.totalCreditLimit !== undefined) {
      updateData.total_credit_limit = meta.totalCreditLimit;
    }
    if (meta.availableCreditLimit !== undefined) {
      updateData.available_credit_limit = meta.availableCreditLimit;
    }
    if (meta.availableCashLimit !== undefined) {
      updateData.available_cash_limit = meta.availableCashLimit;
    }

    // JSON fields
    if (meta.spendingCategories && meta.spendingCategories.length > 0) {
      updateData.spending_categories = meta.spendingCategories;
    }
    if (meta.rewardsProgramSummary && meta.rewardsProgramSummary.length > 0) {
      updateData.rewards_program_summary = meta.rewardsProgramSummary;
    }
    if (meta.emiLoans && meta.emiLoans.length > 0) {
      // Convert Date objects to ISO strings for JSON storage
      updateData.emi_loans = meta.emiLoans.map(loan => ({
        ...loan,
        bookedDate: loan.bookedDate.toISOString(),
      }));
    }
    if (meta.gstSummary) {
      updateData.gst_summary = meta.gstSummary;
    }

    if (!parseResult.success && parseResult.errors) {
      updateData.parsing_error = parseResult.errors.join('; ');
    }

    // Update statement with metadata
    await supabaseAdmin
      .from('statements')
      .update(updateData)
      .eq('id', statementId);

    // Update card-level data in cards table
    // These are persistent attributes that should be updated on the card itself
    const cardUpdateData: any = {};

    // Update bank name if found in statement and not already set
    if (meta.bankName) {
      // Check if card already has a bank name, if not, update it
      const { data: currentCard } = await supabaseAdmin
        .from('cards')
        .select('bank_name')
        .eq('id', cardId)
        .single();

      if (!currentCard?.bank_name) {
        // Normalize bank name to lowercase for consistency
        cardUpdateData.bank_name = meta.bankName
          .toLowerCase()
          .replace(' bank', '');
      }
    }

    // Update card name if found in statement and not already set
    if (meta.cardName) {
      // Check if card already has a name, if not, update it
      const { data: currentCard } = await supabaseAdmin
        .from('cards')
        .select('card_name')
        .eq('id', cardId)
        .single();

      if (!currentCard?.card_name) {
        cardUpdateData.card_name = meta.cardName;
      }
    }

    // Update credit limits (latest values from statement)
    if (meta.totalCreditLimit !== undefined) {
      cardUpdateData.credit_limit = meta.totalCreditLimit;
    }
    if (meta.availableCreditLimit !== undefined) {
      cardUpdateData.available_credit = meta.availableCreditLimit;
    }

    // Only update if there's something to update
    if (Object.keys(cardUpdateData).length > 0) {
      await supabaseAdmin
        .from('cards')
        .update(cardUpdateData)
        .eq('id', cardId)
        .eq('user_id', userId);
    }

    // Extract and store card metadata using LLM
    // Always use LLM if API key is available - LLM can extract card name and bank name even if regex failed
    console.log(`🔍 [Card Metadata] Checking for OpenAI API key...`);
    console.log(`🔍 [Card Metadata] API key present: ${!!openaiApiKey}`);
    console.log(
      `🔍 [Card Metadata] API key length: ${openaiApiKey?.length || 0}`,
    );

    if (openaiApiKey) {
      try {
        console.log(
          '🔄 [Card Metadata] Starting LLM extraction for card metadata',
        );

        // Extract PDF text for LLM (we'll use it to extract everything)
        const pdfText = await extractTextFromPDF(fileBuffer, password);
        console.log(
          `📄 [Card Metadata] Extracted PDF text length: ${pdfText.length} characters`,
        );
        console.log(
          `📄 [Card Metadata] PDF text preview (first 500 chars): ${pdfText.slice(0, 500)}`,
        );

        // Extract card metadata using LLM - give it full PDF text so it can extract card name and bank name
        console.log('🤖 [Card Metadata] Calling extractCardMetadataWithLLM...');
        const extractedMetadata = await extractCardMetadataWithLLM(
          pdfText,
          {
            // Use regex-extracted values as hints, but LLM can override if it finds better ones
            cardName: meta.cardName,
            bankName: meta.bankName,
            spendingCategories: meta.spendingCategories,
            rewardsProgramSummary: meta.rewardsProgramSummary,
            rewardPoints: meta.rewardPoints,
          },
          { apiKey: openaiApiKey },
        );

        console.log(
          `📊 [Card Metadata] LLM extraction result:`,
          extractedMetadata ? 'SUCCESS' : 'NULL',
        );
        if (extractedMetadata) {
          console.log(
            `📊 [Card Metadata] Extracted cardName: ${extractedMetadata.cardName || 'NOT FOUND'}`,
          );
          console.log(
            `📊 [Card Metadata] Extracted bankName: ${extractedMetadata.bankName || 'NOT FOUND'}`,
          );
          console.log(
            `📊 [Card Metadata] Extracted network: ${extractedMetadata.network || 'NOT FOUND'}`,
          );
          console.log(
            `📊 [Card Metadata] Extracted rewardType: ${extractedMetadata.rewardType || 'NOT FOUND'}`,
          );
          console.log(
            `📊 [Card Metadata] Full extracted metadata:`,
            JSON.stringify(extractedMetadata, null, 2),
          );
        } else {
          console.log(
            '⚠️ [Card Metadata] extractCardMetadataWithLLM returned null - check logs above for reason',
          );
        }

        // Merge strategy: LLM has priority, but fall back to regex if LLM didn't extract
        // Log differences when both exist for debugging
        const finalCardName = extractedMetadata?.cardName || meta.cardName;
        const finalBankName = extractedMetadata?.bankName || meta.bankName;

        // Log when values differ (for debugging)
        if (
          extractedMetadata?.cardName &&
          meta.cardName &&
          extractedMetadata.cardName !== meta.cardName
        ) {
          console.log(
            `⚠️ [Card Metadata] Card name mismatch - LLM: "${extractedMetadata.cardName}", Regex: "${meta.cardName}". Using LLM value.`,
          );
        }
        if (
          extractedMetadata?.bankName &&
          meta.bankName &&
          extractedMetadata.bankName !== meta.bankName
        ) {
          console.log(
            `⚠️ [Card Metadata] Bank name mismatch - LLM: "${extractedMetadata.bankName}", Regex: "${meta.bankName}". Using LLM value.`,
          );
        }

        if (!finalCardName || !finalBankName) {
          console.log(
            '⚠️ [Card Metadata] Card name or bank name not found (neither regex nor LLM), skipping metadata extraction',
          );
          return;
        }

        console.log(
          `✅ [Card Metadata] Using card name: ${finalCardName}, bank name: ${finalBankName}`,
        );

        // Get or resolve bank_id using the final bank name
        let bankId = await resolveBankIdByName(finalBankName);
        if (!bankId) {
          // Try to get bank_id from card
          const { data: currentCard } = await supabaseAdmin
            .from('cards')
            .select('bank_id')
            .eq('id', cardId)
            .single();
          bankId = currentCard?.bank_id || null;
        }

        if (!bankId) {
          console.log(
            '⚠️ [Card Metadata] Bank ID not found, skipping metadata extraction',
          );
        } else {
          // Normalize card name for lookup (remove "Credit Card" suffix, trim)
          const normalizedCardName = finalCardName
            .trim()
            .replace(/\s+Credit\s+Card\s*$/i, '')
            .trim();

          // Check if metadata already exists for this card (across all users)
          // Try multiple variations: exact match, with "Credit Card" suffix, case-insensitive
          // First try exact match (case-insensitive)
          let { data: existingMetadata } = await supabaseAdmin
            .from('cards_metadata')
            .select('id')
            .eq('bank_id', bankId)
            .ilike('card_name', normalizedCardName)
            .maybeSingle();

          // If not found, try with "Credit Card" suffix
          if (!existingMetadata) {
            const { data: metadataWithSuffix } = await supabaseAdmin
              .from('cards_metadata')
              .select('id')
              .eq('bank_id', bankId)
              .ilike('card_name', `${normalizedCardName} Credit Card`)
              .maybeSingle();
            existingMetadata = metadataWithSuffix || null;
          }

          // If still not found, try original card name
          if (!existingMetadata) {
            const { data: metadataOriginal } = await supabaseAdmin
              .from('cards_metadata')
              .select('id')
              .eq('bank_id', bankId)
              .ilike('card_name', finalCardName.trim())
              .maybeSingle();
            existingMetadata = metadataOriginal || null;
          }

          if (existingMetadata) {
            console.log(
              '✅ [Card Metadata] Metadata already exists, linking card to existing metadata',
            );

            // Fetch the existing metadata to get network, reward_type, annual_fee
            const { data: fullMetadata } = await supabaseAdmin
              .from('cards_metadata')
              .select('network, reward_type, annual_fee, bank_id')
              .eq('id', existingMetadata.id)
              .single();

            // Update card with metadata information
            const cardUpdateFromExisting: any = {
              card_metadata_id: existingMetadata.id,
            };

            if (fullMetadata) {
              if (fullMetadata.network) {
                cardUpdateFromExisting.network = fullMetadata.network;
              }
              if (fullMetadata.reward_type) {
                cardUpdateFromExisting.reward_type = fullMetadata.reward_type;
              }
              if (fullMetadata.annual_fee !== undefined) {
                cardUpdateFromExisting.annual_fee = fullMetadata.annual_fee;
              }
              if (fullMetadata.bank_id) {
                cardUpdateFromExisting.bank_id = fullMetadata.bank_id;
              }
            }

            // Also update card name and bank name from merged values (LLM has priority)
            // This ensures the card table has the most accurate values even when linking to existing metadata
            if (finalCardName) {
              cardUpdateFromExisting.card_name = finalCardName;
            }
            if (finalBankName) {
              // Normalize bank name for consistency
              cardUpdateFromExisting.bank_name = finalBankName
                .toLowerCase()
                .replace(' bank', '');
            }

            // Link card to existing metadata and update other fields
            await supabaseAdmin
              .from('cards')
              .update(cardUpdateFromExisting)
              .eq('id', cardId)
              .eq('user_id', userId);

            console.log(
              '✅ [Card Metadata] Card linked to existing metadata and updated with LLM-extracted values',
            );
          } else {
            // Use the already-extracted metadata from LLM (we extracted it earlier)
            if (extractedMetadata && extractedMetadata.cardName) {
              console.log(
                '✅ [Card Metadata] LLM extracted metadata, storing to database',
              );

              // Merge strategy: Use LLM values, fall back to defaults if missing
              // For fields that regex might have extracted, we prefer LLM but log differences
              const mergedMetadata = {
                // Card name: LLM has priority (already handled above)
                cardName: extractedMetadata.cardName,

                // Display name: LLM or derived from card name
                displayName:
                  extractedMetadata.displayName ||
                  extractedMetadata.cardName.replace(
                    /\s+Credit\s+Card\s*$/i,
                    '',
                  ),

                // Card type: LLM or default
                cardType: extractedMetadata.cardType || 'credit',

                // Network: LLM or infer from card name
                network:
                  extractedMetadata.network ||
                  (() => {
                    const cardNameLower = (
                      extractedMetadata.cardName || ''
                    ).toLowerCase();
                    if (
                      cardNameLower.includes('amex') ||
                      cardNameLower.includes('american express')
                    )
                      return 'amex';
                    if (cardNameLower.includes('diners')) return 'diners';
                    if (cardNameLower.includes('rupay')) return 'rupay';
                    return 'visa'; // Default
                  })(),

                // Reward type: LLM only (regex doesn't extract this)
                rewardType: extractedMetadata.rewardType || null,

                // Fees: LLM or defaults
                annualFee:
                  extractedMetadata.annualFee !== undefined
                    ? extractedMetadata.annualFee
                    : 0,
                joiningFee:
                  extractedMetadata.joiningFee !== undefined
                    ? extractedMetadata.joiningFee
                    : 0,

                // Colors: LLM only
                primaryColor: extractedMetadata.primaryColor || null,
                secondaryColor: extractedMetadata.secondaryColor || null,

                // Complex objects: LLM only (regex doesn't extract these)
                benefits: extractedMetadata.benefits || [],
                offers: extractedMetadata.offers || [],
                rewards: extractedMetadata.rewards || {},
                milestones: extractedMetadata.milestones || [],
                rewardsProgress: extractedMetadata.rewardsProgress || null,
              };

              // Prepare metadata for database insertion
              const metadataToInsert: any = {
                bank_id: bankId,
                card_name: mergedMetadata.cardName,
                display_name: mergedMetadata.displayName,
                card_type: mergedMetadata.cardType,
                network: mergedMetadata.network,
                reward_type: mergedMetadata.rewardType,
                annual_fee: mergedMetadata.annualFee,
                joining_fee: mergedMetadata.joiningFee,
                primary_color: mergedMetadata.primaryColor,
                secondary_color: mergedMetadata.secondaryColor,
                card_logo_url: null, // Can be added later
                benefits: mergedMetadata.benefits,
                offers: mergedMetadata.offers,
                rewards: mergedMetadata.rewards,
                milestones: mergedMetadata.milestones,
                rewards_progress: mergedMetadata.rewardsProgress,
                metadata: {
                  ...(extractedMetadata.metadata || {}),
                  extractedFromStatement: true,
                  extractionDate: new Date().toISOString(),
                  confidence: extractedMetadata.confidence || 'medium',
                  // Store source information for debugging
                  extractionSource: 'llm',
                  regexFallback: {
                    cardName: meta.cardName || null,
                    bankName: meta.bankName || null,
                  },
                },
                is_active: true,
              };

              // Insert card metadata
              const { data: newMetadata, error: metadataError } =
                await supabaseAdmin
                  .from('cards_metadata')
                  .insert(metadataToInsert)
                  .select()
                  .single();

              if (metadataError || !newMetadata) {
                console.error(
                  '❌ [Card Metadata] Failed to insert metadata:',
                  metadataError,
                );
                logError(
                  metadataError
                    ? new Error(metadataError.message)
                    : new Error('Metadata insertion failed'),
                  {
                    userId,
                    additionalData: {
                      cardId,
                      statementId,
                      error: metadataError?.message,
                    },
                  },
                );
              } else {
                console.log(
                  '✅ [Card Metadata] Metadata stored successfully, linking to card',
                );

                // Update card with metadata information
                const cardUpdateFromMetadata: any = {
                  card_metadata_id: newMetadata.id,
                };

                // Update network: Use merged value (LLM or inferred)
                cardUpdateFromMetadata.network = mergedMetadata.network;

                // Update reward_type: Use merged value (LLM or null)
                if (mergedMetadata.rewardType) {
                  cardUpdateFromMetadata.reward_type =
                    mergedMetadata.rewardType;
                }

                // Update annual_fee: Use merged value (LLM or 0)
                if (mergedMetadata.annualFee !== undefined) {
                  cardUpdateFromMetadata.annual_fee = mergedMetadata.annualFee;
                }

                // Update bank_id if we have it (should already be set, but ensure it's correct)
                if (bankId) {
                  cardUpdateFromMetadata.bank_id = bankId;
                }

                // Also update card name and bank name from merged values (LLM has priority)
                // This ensures the card table has the most accurate values
                if (finalCardName) {
                  cardUpdateFromMetadata.card_name = finalCardName;
                }
                if (finalBankName) {
                  // Normalize bank name for consistency
                  cardUpdateFromMetadata.bank_name = finalBankName
                    .toLowerCase()
                    .replace(' bank', '');
                }

                // Link card to the new metadata and update other fields
                await supabaseAdmin
                  .from('cards')
                  .update(cardUpdateFromMetadata)
                  .eq('id', cardId)
                  .eq('user_id', userId);
              }
            } else {
              console.log('⚠️ [Card Metadata] LLM extraction returned no data');
            }
          }
        }
      } catch (error) {
        // Don't fail the whole process if metadata extraction fails
        console.error(
          '❌ [Card Metadata] Error during metadata extraction:',
          error,
        );
        logError(
          error instanceof Error
            ? error
            : new Error('Metadata extraction error'),
          {
            userId,
            additionalData: {
              cardId,
              statementId,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          },
        );
      }
    } else {
      if (!openaiApiKey) {
        console.log(
          'ℹ️ [Card Metadata] No OpenAI API key, skipping metadata extraction',
        );
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown parsing error';

    // Update statement with error
    await supabaseAdmin
      .from('statements')
      .update({
        parsing_status: 'failed',
        parsing_error: errorMessage,
        parsed_at: new Date().toISOString(),
      })
      .eq('id', statementId);

    // Log the error
    const errorToLog = error instanceof Error ? error : new Error(errorMessage);
    logError(errorToLog, {
      userId,
      additionalData: { cardId, statementId, error: errorMessage },
    });
  }
}

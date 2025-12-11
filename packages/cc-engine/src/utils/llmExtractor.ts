/**
 * LLM-based PDF Metadata Extractor
 * Uses OpenAI or Ollama to extract structured data from PDF text when regex fails
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Better error handling and validation
 * - Improved prompts for better extraction
 * - Timeout handling
 * - JSON parsing with fallbacks
 */

import { cleanCardName } from './formatters';

export interface LLMExtractionOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  provider?: 'openai' | 'ollama';
  ollamaBaseUrl?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface LLMExtractedMetadata {
  cardName?: string;
  cardLastFour?: string;
  bankName?: string;
  statementDate?: string;
  statementPeriodStart?: string;
  statementPeriodEnd?: string;
  billingCycleStart?: string;
  billingCycleEnd?: string;
  paymentDueDate?: string;
  totalAmount?: number;
  minimumDue?: number;
  rewardPoints?: number;
  creditLimit?: number;
  availableCredit?: number;
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Extract metadata from PDF text using LLM (OpenAI or Ollama)
 * Falls back gracefully if API key is not provided or call fails
 * Includes retry logic and better error handling
 */
export async function extractMetadataWithLLM(
  pdfText: string,
  options: LLMExtractionOptions = {},
): Promise<LLMExtractedMetadata | null> {
  const {
    apiKey,
    model,
    temperature = 0.1,
    provider = 'openai',
    ollamaBaseUrl = 'http://localhost:11434',
    maxRetries = 3,
    timeout = 30000, // 30 seconds
  } = options;

  // Auto-detect provider if not specified
  // Default to Ollama if available, fallback to OpenAI
  const detectedProvider =
    provider === 'openai'
      ? process.env.USE_OLLAMA === 'true' || !apiKey
        ? 'ollama'
        : 'openai'
      : provider;

  // For OpenAI, API key is required
  if (detectedProvider === 'openai' && !apiKey) {
    console.log(
      '⚠️ [LLM Extractor] No API key provided, skipping LLM extraction',
    );
    return null;
  }

  // Determine model based on provider
  const finalModel =
    model || (detectedProvider === 'ollama' ? 'llama3.1:8b' : 'gpt-4o-mini');

  // Truncate text intelligently - keep important parts (beginning and key sections)
  const truncatedText = truncateTextIntelligently(pdfText, 10000);

  // Improved prompt with better instructions
  const prompt = buildExtractionPrompt(truncatedText);

  // Retry logic with exponential backoff
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(
          `🔄 [LLM Extractor] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`,
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const result = await extractWithTimeout(
        detectedProvider,
        finalModel,
        prompt,
        temperature,
        apiKey,
        ollamaBaseUrl,
        timeout,
      );

      if (result) {
        // Validate and clean the extracted data
        const validated = validateAndCleanExtraction(result);

        console.log(
          `✅ [LLM Extractor] Successfully extracted metadata using ${detectedProvider} (attempt ${attempt + 1}):`,
        );
        console.log(`   Card: ${validated.cardName || 'N/A'}`);
        console.log(`   Bank: ${validated.bankName || 'N/A'}`);
        console.log(`   Confidence: ${validated.confidence || 'N/A'}`);

        return validated;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `⚠️ [LLM Extractor] Attempt ${attempt + 1} failed:`,
        lastError.message,
      );

      // Don't retry on certain errors
      if (
        lastError.message.includes('API key') ||
        lastError.message.includes('authentication')
      ) {
        break;
      }
    }
  }

  console.error(
    `❌ [LLM Extractor] Failed after ${maxRetries} attempts:`,
    lastError?.message || 'Unknown error',
  );
  return null;
}

/**
 * Extract with timeout wrapper
 */
async function extractWithTimeout(
  provider: 'openai' | 'ollama',
  model: string,
  prompt: string,
  temperature: number,
  apiKey?: string,
  ollamaBaseUrl?: string,
  timeout?: number,
): Promise<LLMExtractedMetadata | null> {
  return Promise.race([
    performExtraction(
      provider,
      model,
      prompt,
      temperature,
      apiKey,
      ollamaBaseUrl,
    ),
    new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout),
    ),
  ]);
}

/**
 * Perform the actual extraction
 */
async function performExtraction(
  provider: 'openai' | 'ollama',
  model: string,
  prompt: string,
  temperature: number,
  apiKey?: string,
  ollamaBaseUrl?: string,
): Promise<LLMExtractedMetadata | null> {
  let content: string;

  if (provider === 'ollama') {
    // Use Ollama directly (consistent with categorization approach)
    try {
      const { Ollama } = await import('ollama');
      const ollama = new Ollama({
        host: ollamaBaseUrl || 'http://localhost:11434',
      });

      const systemPrompt =
        'You are a financial document parser. Extract structured data and return ONLY valid JSON. Do not include markdown, explanations, or any text outside the JSON object.';
      const fullPrompt = `${systemPrompt}\n\n${prompt}`;

      const response = await ollama.generate({
        model: model || 'llama3.1:8b',
        prompt: fullPrompt,
        format: 'json',
        stream: false,
        options: {
          temperature,
          num_predict: 1000,
        },
      });

      content = response.response;

      if (!content) {
        throw new Error('Empty response from Ollama');
      }

      // Ollama might return markdown or wrapped JSON, extract it
      content = extractJSONFromResponse(content);
    } catch (error) {
      // Fallback to direct fetch if Ollama import fails
      console.warn(
        '⚠️ [LLM Extractor] Ollama client failed, falling back to direct fetch:',
        error,
      );
      const url = `${ollamaBaseUrl || 'http://localhost:11434'}/api/chat`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'llama3.1:8b',
          messages: [
            {
              role: 'system',
              content:
                'You are a financial document parser. Extract structured data and return ONLY valid JSON. Do not include markdown, explanations, or any text outside the JSON object.',
            },
            { role: 'user', content: prompt },
          ],
          stream: false,
          options: {
            temperature,
            num_predict: 1000,
          },
          format: 'json',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Ollama API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      content = data.message?.content;

      if (!content) {
        throw new Error('Empty response from Ollama');
      }

      content = extractJSONFromResponse(content);
    }
  } else {
    // Use OpenAI API
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a financial document parser. Extract structured data and return only valid JSON. Do not include markdown, explanations, or any text outside the JSON object.',
        },
        { role: 'user', content: prompt },
      ],
      temperature,
      response_format: { type: 'json_object' },
      max_tokens: 800,
    });

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error('Empty response from OpenAI');
    }
    content = messageContent;
  }

  // Parse JSON with better error handling
  try {
    const extracted = JSON.parse(content) as LLMExtractedMetadata;
    return extracted;
  } catch (parseError) {
    // Try to extract JSON from malformed response
    const extracted = extractJSONFromResponse(content);
    if (extracted) {
      try {
        return JSON.parse(extracted) as LLMExtractedMetadata;
      } catch {
        throw new Error(`Failed to parse JSON: ${parseError}`);
      }
    }
    throw new Error(`Invalid JSON response: ${parseError}`);
  }
}

/**
 * Build improved extraction prompt
 */
function buildExtractionPrompt(pdfText: string): string {
  return `You are an expert financial document parser specializing in Indian credit card statements.

Extract the following metadata from this credit card statement PDF text. Return ONLY a valid JSON object with these exact field names:

{
  "cardName": "Exact card name only (e.g., 'Millennia Credit Card', 'Tata Neu Plus Credit Card'). Remove prefixes like 'Benefits on your card', 'Calculation on your', etc. If not found, use null.",
  "cardLastFour": "Last 4 digits of card number (string, e.g., '6921') or null",
  "bankName": "Bank name (e.g., 'HDFC Bank', 'ICICI Bank') or null",
  "statementDate": "Statement date in YYYY-MM-DD format or null",
  "statementPeriodStart": "Period start date in YYYY-MM-DD format or null",
  "statementPeriodEnd": "Period end date in YYYY-MM-DD format or null",
  "billingCycleStart": "Billing cycle start in YYYY-MM-DD format or null",
  "billingCycleEnd": "Billing cycle end in YYYY-MM-DD format or null",
  "paymentDueDate": "Due date in YYYY-MM-DD format or null",
  "totalAmount": "Total amount due as number (no currency symbols) or null",
  "minimumDue": "Minimum due as number (no currency symbols) or null",
  "rewardPoints": "Reward points balance as number or null",
  "creditLimit": "Credit limit as number (no currency symbols) or null",
  "availableCredit": "Available credit as number (no currency symbols) or null",
  "confidence": "high, medium, or low"
}

IMPORTANT RULES:
1. Return ONLY valid JSON, no markdown code blocks, no explanations
2. Use null for missing values, not empty strings
3. Dates must be in YYYY-MM-DD format
4. Numbers must be actual numbers, not strings
5. cardName must be clean (no prefixes like "Benefits on your card")
6. Extract creditLimit and availableCredit from sections like "Credit Limit", "Available Credit", "Total Credit Limit", etc.

PDF Text:
${pdfText}

JSON:`;
}

/**
 * Intelligently truncate text - keep beginning and important sections
 */
function truncateTextIntelligently(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Keep first 60% and last 40% to preserve both header and footer info
  const firstPart = text.slice(0, Math.floor(maxLength * 0.6));
  const lastPart = text.slice(-Math.floor(maxLength * 0.4));

  return `${firstPart}\n\n[... truncated ...]\n\n${lastPart}`;
}

/**
 * Extract JSON from response that might contain markdown or extra text
 */
function extractJSONFromResponse(content: string): string {
  // Remove markdown code blocks
  content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');

  // Find JSON object
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return content.trim();
}

/**
 * Validate and clean extracted metadata
 */
function validateAndCleanExtraction(
  extracted: LLMExtractedMetadata,
): LLMExtractedMetadata {
  const cleaned: LLMExtractedMetadata = { ...extracted };

  // Clean card name
  if (cleaned.cardName) {
    cleaned.cardName = cleanCardName(cleaned.cardName);
  }

  // Validate and convert dates
  const dateFields: Array<keyof LLMExtractedMetadata> = [
    'statementDate',
    'statementPeriodStart',
    'statementPeriodEnd',
    'billingCycleStart',
    'billingCycleEnd',
    'paymentDueDate',
  ];

  for (const field of dateFields) {
    const value = cleaned[field];
    if (value && typeof value === 'string') {
      // Validate date format
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        delete cleaned[field];
      }
    }
  }

  // Ensure numbers are actually numbers
  const numberFields: Array<keyof LLMExtractedMetadata> = [
    'totalAmount',
    'minimumDue',
    'rewardPoints',
    'creditLimit',
    'availableCredit',
  ];

  for (const field of numberFields) {
    const value = cleaned[field];
    if (value !== null && value !== undefined) {
      const num =
        typeof value === 'string'
          ? parseFloat(value.replace(/[₹,\s]/g, ''))
          : value;
      if (isNaN(num)) {
        delete cleaned[field];
      } else {
        (cleaned as any)[field] = num;
      }
    }
  }

  // Set confidence if not provided
  if (!cleaned.confidence) {
    const extractedFields = Object.values(cleaned).filter(
      v => v !== null && v !== undefined,
    ).length;
    cleaned.confidence =
      extractedFields > 8 ? 'high' : extractedFields > 5 ? 'medium' : 'low';
  }

  return cleaned;
}

// Note: cleanCardName has been moved to formatters.ts
// Import it from there instead: import { cleanCardName } from './formatters';

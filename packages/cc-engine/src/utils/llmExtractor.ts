/**
 * LLM-based PDF Metadata Extractor
 * Uses OpenAI to extract structured data from PDF text when regex fails
 */

export interface LLMExtractionOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
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
 * Extract metadata from PDF text using LLM
 * Falls back gracefully if API key is not provided or call fails
 */
export async function extractMetadataWithLLM(
  pdfText: string,
  options: LLMExtractionOptions = {},
): Promise<LLMExtractedMetadata | null> {
  const { apiKey, model = 'gpt-4o-mini', temperature = 0.1 } = options;

  // If no API key, return null (graceful fallback)
  if (!apiKey) {
    console.log(
      '⚠️ [LLM Extractor] No API key provided, skipping LLM extraction',
    );
    return null;
  }

  try {
    // Dynamic import to avoid requiring OpenAI in all environments
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });

    // Truncate text if too long (keep first 8000 chars for context)
    const truncatedText = pdfText.slice(0, 8000);

    const prompt = `You are a financial document parser. Extract structured metadata from this credit card statement PDF text.

Extract the following information in JSON format:
- cardName: The specific credit card name (e.g., "Millennia Credit Card", "Regalia Credit Card"). If you see generic text like "CALCULATION ON YOUR HDFC BANK CREDIT CARD", return null.
- cardLastFour: Last 4 digits of the card number
- bankName: Bank name (e.g., "HDFC Bank", "ICICI Bank")
- statementDate: Statement generation date
- statementPeriodStart: Start date of statement period
- statementPeriodEnd: End date of statement period
- billingCycleStart: Billing cycle start date
- billingCycleEnd: Billing cycle end date
- paymentDueDate: Payment due date
- totalAmount: Total amount due (number only)
- minimumDue: Minimum amount due (number only)
- rewardPoints: Current reward points balance (number only)
- creditLimit: Credit limit (number only)
- availableCredit: Available credit (number only)
- confidence: "high", "medium", or "low" based on how certain you are

Return ONLY valid JSON, no markdown, no explanations. Use null for missing values.

PDF Text:
${truncatedText}

JSON:`;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a financial document parser. Extract structured data and return only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature,
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('⚠️ [LLM Extractor] Empty response from OpenAI');
      return null;
    }

    const extracted = JSON.parse(content) as LLMExtractedMetadata;
    console.log(
      '✅ [LLM Extractor] Successfully extracted metadata:',
      extracted,
    );
    return extracted;
  } catch (error) {
    console.error('❌ [LLM Extractor] Error extracting with LLM:', error);
    // Graceful fallback - return null so regex can still work
    return null;
  }
}

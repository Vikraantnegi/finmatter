import { Ollama } from 'ollama';

export interface CategorizationResult {
  category: string;
  confidence: number;
  reasoning: string;
  model: string;
  latency: number;
  cached: boolean;
}

export interface MerchantNormalizationResult {
  normalized: string;
  original: string;
  model: string;
  latency: number;
}

export interface StatementMetadataResult {
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

export interface CardMetadataResult {
  cardName?: string;
  bankName?: string;
  displayName?: string;
  cardType?: 'credit' | 'debit' | 'prepaid';
  network?: 'visa' | 'mastercard' | 'rupay' | 'amex' | 'discover' | 'diners';
  rewardType?: 'cashback' | 'points' | 'miles' | 'none';
  annualFee?: number;
  joiningFee?: number;
  primaryColor?: string;
  secondaryColor?: string;
  benefits?: Array<{
    category: string;
    description: string;
    rewardRate?: number;
    rewardType?: 'cashback' | 'points' | 'miles';
    rewardCap?: number;
    rewardCapPeriod?: 'monthly' | 'quarterly' | 'annual';
    conditions?: string[];
    isActive: boolean;
  }>;
  offers?: Array<{
    title: string;
    description: string;
    category: string;
    validity?: string;
    terms?: string[];
    isActive: boolean;
  }>;
  rewards?: {
    baseRate?: number;
    baseRewardType?: 'cashback' | 'points' | 'miles';
    acceleratedRates?: Array<{
      category: string;
      rate: number;
      rewardType: 'cashback' | 'points' | 'miles';
      cap?: number;
    }>;
    redemption?: {
      cashback?: boolean;
      points?: boolean;
      miles?: boolean;
    };
  };
  milestones?: Array<{
    spendingThreshold: number;
    reward: string;
    description: string;
    type: 'monthly' | 'quarterly' | 'annual';
    isActive: boolean;
  }>;
  rewardsProgress?: {
    type:
      | 'cashback'
      | 'points'
      | 'coins'
      | 'miles'
      | 'membership_points'
      | 'edge_miles'
      | 'other';
    unit: string;
    displayName: string;
    redemptionRate?: number;
    redemptionCurrency?: string;
    milestones?: Array<{
      threshold: number;
      reward: string;
      description: string;
    }>;
  };
  metadata?: Record<string, any>;
  confidence?: 'high' | 'medium' | 'low';
}

export interface LLMServiceOptions {
  provider?: 'openai' | 'ollama';
  openaiApiKey?: string;
  ollamaBaseUrl?: string;
  model?: string;
  temperature?: number;
}

// Alias for backward compatibility
export type CardMetadataExtractionOptions = {
  apiKey?: string;
  model?: string;
  temperature?: number;
  provider?: 'openai' | 'ollama';
  ollamaBaseUrl?: string;
};

/**
 * Unified LLM service for FinMatter
 * Handles all LLM operations (OpenAI and Ollama)
 */
export class LLMService {
  private ollama: Ollama | null = null;
  private openai: any = null;
  private cache: Map<string, { result: any; expiry: number }> = new Map();
  private modelLoaded: boolean = false;
  private options: LLMServiceOptions;

  constructor(options: LLMServiceOptions = {}) {
    const provider =
      options.provider ||
      (process.env.USE_OLLAMA === 'true' ? 'ollama' : 'openai');
    const openaiApiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;
    const ollamaBaseUrl =
      options.ollamaBaseUrl ||
      process.env.OLLAMA_BASE_URL ||
      'http://localhost:11434';

    this.options = {
      provider,
      ...(openaiApiKey ? { openaiApiKey } : {}),
      ollamaBaseUrl,
      ...(options.model ? { model: options.model } : {}),
      temperature: options.temperature ?? 0.1,
    };

    // Initialize Ollama if needed
    if (this.options.provider === 'ollama' || !openaiApiKey) {
      this.ollama = new Ollama({ host: ollamaBaseUrl });
    }

    // OpenAI will be initialized lazily when needed
  }

  /**
   * Initialize OpenAI client lazily
   */
  private async getOpenAI(): Promise<any> {
    if (!this.openai && this.options.openaiApiKey) {
      try {
        // Dynamic import to avoid issues if openai is not installed
        const openaiModule = await import('openai');
        const OpenAI = openaiModule.default || openaiModule.OpenAI;
        this.openai = new OpenAI({ apiKey: this.options.openaiApiKey });
      } catch (error) {
        console.warn('⚠️ [LLM Router] Failed to import OpenAI:', error);
        return null;
      }
    }
    return this.openai;
  }

  /**
   * Generic LLM call method that works with both OpenAI and Ollama
   */
  private async callLLM(
    systemPrompt: string,
    userPrompt: string,
    options: {
      model?: string;
      temperature?: number;
      format?: 'json' | 'text';
      maxTokens?: number;
    } = {},
  ): Promise<string> {
    const provider =
      this.options.provider ||
      (this.options.openaiApiKey ? 'openai' : 'ollama');
    const model =
      options.model ||
      this.options.model ||
      (provider === 'ollama' ? 'gpt-oss:20b' : 'gpt-4o-mini');
    const temperature = options.temperature ?? this.options.temperature ?? 0.1;
    const format = options.format || 'json';
    const maxTokens =
      options.maxTokens || (provider === 'ollama' ? 3000 : 2000);

    if (provider === 'ollama') {
      const ollamaHost = this.options.ollamaBaseUrl || 'http://localhost:11434';
      if (!this.ollama) {
        this.ollama = new Ollama({ host: ollamaHost });
      }

      try {
        // Try chat API first (better structure)
        const chatRequest: any = {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
          },
        };
        if (format === 'json') {
          chatRequest.format = 'json';
        }
        const response = (await this.ollama.chat(chatRequest)) as any;
        // When stream is false, response is ChatResponse
        return response?.message?.content || '';
      } catch (chatError: any) {
        // Fallback to generate API
        console.warn(
          '⚠️ [LLM Router] Chat API failed, using generate:',
          chatError.message,
        );
        const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
        const generateRequest: any = {
          model,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
          },
        };
        if (format === 'json') {
          generateRequest.format = 'json';
        }
        const response = (await this.ollama.generate(generateRequest)) as any;
        // When stream is false, response is GenerateResponse
        return response?.response || '';
      }
    } else {
      // OpenAI
      const openai = await this.getOpenAI();
      if (!openai) {
        throw new Error('OpenAI API key not provided');
      }

      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        response_format:
          format === 'json' ? { type: 'json_object' } : undefined,
        max_tokens: maxTokens,
      });

      return response.choices[0]?.message?.content || '';
    }
  }

  /**
   * Extract JSON from response (handles markdown wrapping)
   */
  private extractJSON(content: string): string {
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return content;
  }

  /**
   * Warm up the model (prevents 26-second delay on first request)
   */
  async warmUp(): Promise<void> {
    if (this.modelLoaded || this.options.provider === 'openai') return;

    console.log('🔥 Warming up Llama 3.1 model...');
    try {
      if (!this.ollama) {
        const ollamaHost =
          this.options.ollamaBaseUrl || 'http://localhost:11434';
        this.ollama = new Ollama({ host: ollamaHost });
      }
      await this.ollama.generate({
        model: 'llama3.1:8b',
        prompt: 'test',
        stream: false,
        options: { num_predict: 10 },
      });
      this.modelLoaded = true;
      console.log('✅ Model loaded and ready!');
    } catch (error) {
      console.warn('⚠️  Model warm-up failed:', error);
    }
  }

  /**
   * Categorize a transaction
   */
  async categorizeTransaction(
    merchant: string,
    amount: number,
    description?: string,
  ): Promise<CategorizationResult> {
    const cacheKey = `cat:${merchant}:${amount}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }

    const prompt = `Categorize this Indian transaction into ONE category:

Categories (choose exactly one):
- Dining
- Shopping
- Groceries
- Fuel
- Travel
- Entertainment
- Bills
- Healthcare
- Education
- Others

Transaction:
Merchant: ${merchant}
Amount: ₹${amount}
${description ? `Description: ${description}` : ''}

Rules:
- Swiggy, Zomato, restaurants → Dining
- Amazon, Flipkart, retail → Shopping
- BigBasket, supermarkets → Groceries
- Petrol pumps → Fuel
- Flights, hotels, trains, Ola, Uber → Travel
- Movies, OTT subscriptions → Entertainment
- Electricity, phone, internet → Bills
- Hospitals, pharmacies → Healthcare

Respond ONLY with this exact JSON format (no extra text):
{
  "category": "exact category name from list",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`;

    const startTime = Date.now();

    try {
      const systemPrompt =
        'You are a transaction categorization expert. Return ONLY valid JSON.';
      const content = await this.callLLM(systemPrompt, prompt, {
        format: 'json',
        maxTokens: 150,
        temperature: 0.1,
      });

      const latency = Date.now() - startTime;
      const jsonContent = this.extractJSON(content);
      const result = JSON.parse(jsonContent);

      // Ensure confidence is a number between 0 and 1
      if (result.confidence > 1) {
        result.confidence = result.confidence / 100;
      }

      const model =
        this.options.model ||
        (this.options.provider === 'ollama' ? 'llama3.1:8b' : 'gpt-4o-mini');
      const output: CategorizationResult = {
        category: result.category,
        confidence: result.confidence,
        reasoning: result.reasoning,
        model,
        latency,
        cached: false,
      };

      // Cache for 1 hour
      this.cache.set(cacheKey, {
        result: output,
        expiry: Date.now() + 60 * 60 * 1000,
      });

      return output;
    } catch (error) {
      console.error('Categorization error:', error);
      throw new Error('Failed to categorize transaction');
    }
  }

  /**
   * Normalize merchant name
   * Fixed to avoid extra text in response
   */
  async normalizeMerchant(
    rawMerchant: string,
  ): Promise<MerchantNormalizationResult> {
    const cacheKey = `norm:${rawMerchant}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = `Task: Extract the clean merchant name.

Input: "${rawMerchant}"

Rules:
- Remove transaction IDs, codes, locations
- Keep only the brand/merchant name
- No extra words, just the name

Examples:
"SWIGGY*BANGALORE KA" → Swiggy
"AMAZON PAY*1AB2CD3E" → Amazon
"INDIAN OIL PETROL PUMP #123" → Indian Oil
"IRCTC*TRAIN BOOKING" → IRCTC
"APL*APPLE.COM/BILL" → Apple

Output (one word or phrase only):`;

    const startTime = Date.now();

    try {
      const systemPrompt =
        'You are a merchant name normalization expert. Return only the merchant name, no explanations.';
      const content = await this.callLLM(systemPrompt, prompt, {
        format: 'text',
        maxTokens: 20,
        temperature: 0.0,
      });

      const latency = Date.now() - startTime;

      // Clean up response - remove common prefixes
      let normalized = content.trim();

      // Remove common LLM artifacts
      normalized = normalized
        .replace(
          /^(Here is the normalized merchant name:|Output:|The merchant name is:|Answer:)/i,
          '',
        )
        .replace(/^[:\-\n\s]+/, '')
        .replace(/['"]/g, '')
        .trim();

      const model =
        this.options.model ||
        (this.options.provider === 'ollama' ? 'llama3.1:8b' : 'gpt-4o-mini');
      const output: MerchantNormalizationResult = {
        normalized,
        original: rawMerchant,
        model,
        latency,
      };

      // Cache for 24 hours (merchant names don't change)
      this.cache.set(cacheKey, {
        result: output,
        expiry: Date.now() + 24 * 60 * 60 * 1000,
      });

      return output;
    } catch (error) {
      console.error('Normalization error:', error);
      // Fallback: return original
      return {
        normalized: rawMerchant,
        original: rawMerchant,
        model: 'fallback',
        latency: 0,
      };
    }
  }

  /**
   * Extract statement metadata from PDF text
   */
  async extractStatementMetadata(
    pdfText: string,
  ): Promise<StatementMetadataResult | null> {
    const cacheKey = `stmt:${pdfText.slice(0, 100).replace(/\s/g, '')}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const systemPrompt =
      'You are a financial document parser. Extract structured data and return ONLY valid JSON. Do not include markdown, explanations, or any text outside the JSON object.';

    const prompt = `You are an expert financial document parser specializing in Indian credit card statements.

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
${pdfText.slice(0, 10000)}

JSON:`;

    try {
      const content = await this.callLLM(systemPrompt, prompt, {
        format: 'json',
        maxTokens: 1000,
      });

      const jsonContent = this.extractJSON(content);
      const parsed = JSON.parse(jsonContent);

      // Clean card name (remove prefixes like "Benefits on your card")
      const cleanCardName = (
        name: string | null | undefined,
      ): string | undefined => {
        if (!name) return undefined;
        let cleaned = name.trim();
        const prefixes = [
          'Benefits on your card',
          'Calculation on your',
          'Statement for your',
          'Your',
          'On your',
        ];
        for (const prefix of prefixes) {
          if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
            cleaned = cleaned
              .substring(prefix.length)
              .trim()
              .replace(/^[:\s-]+|[:\s-]+$/g, '');
          }
        }
        cleaned = cleaned.replace(/\s+Credit\s+Card\s+Statement\s*$/i, '');
        return cleaned.trim() || undefined;
      };

      const result: StatementMetadataResult = {
        ...parsed,
        cardName: cleanCardName(parsed.cardName),
      };

      // Cache for 1 hour
      this.cache.set(cacheKey, {
        result,
        expiry: Date.now() + 60 * 60 * 1000,
      });

      return result;
    } catch (error) {
      console.error(
        '❌ [LLM Router] Statement metadata extraction error:',
        error,
      );
      return null;
    }
  }

  /**
   * Extract comprehensive card metadata from PDF text
   */
  async extractCardMetadata(
    pdfText: string,
    contextInfo?: {
      cardName?: string;
      bankName?: string;
      spendingCategories?: Array<{ category: string; percentage: number }>;
      rewardsProgramSummary?: Array<{ program: string; points: number }>;
      rewardPoints?: number;
    },
  ): Promise<CardMetadataResult | null> {
    const cacheKey = `card:${pdfText.slice(0, 100).replace(/\s/g, '')}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const systemPrompt =
      'You are a financial product analyst extracting CARD METADATA ONLY. Return ONLY the JSON structure specified. DO NOT include: transactions, credit_limit, available_credit, minimum_amount_due, due_date, payment_due_date, billing_period, statement_date, bonus_neucoins_summary, base_neucoins, date_time, transaction_description, program_name. These are STATEMENT DATA, not card metadata. Card metadata fields: cardName, bankName, displayName, network, rewardType, annualFee, joiningFee, benefits, offers, rewards, milestones, rewardsProgress, colors. Use camelCase ONLY (cardName NOT card_name, bankName NOT bank_name). Fill ALL fields based on your knowledge of Indian credit cards.';

    const prompt = `Extract CARD METADATA from this statement. IGNORE all transaction data, dates, amounts, NeuCoins summaries, and statement-specific fields.

${contextInfo?.cardName && contextInfo?.bankName ? `**USE THESE VALUES:** cardName="${contextInfo.cardName}", bankName="${contextInfo.bankName}"\n\n` : ''}Focus on PERMANENT card features only:
1. Card name and bank name${contextInfo?.cardName && contextInfo?.bankName ? ` (use provided values above)` : ''}
2. Network (visa/mastercard/rupay/amex)
3. Reward type (cashback/points/coins/miles)
4. Benefits (dining, travel, shopping rewards)
5. Offers (lounge access, discounts)
6. Fees (annual, joining)
7. Rewards structure

Return ONLY a valid JSON object with these exact camelCase field names (do NOT use snake_case like card_name, bank_name):

{
  "cardName": "${contextInfo?.cardName || "Exact card name (e.g., 'Tata Neu Plus Credit Card', 'HDFC Millennia Credit Card') or null"}",
  "bankName": "${contextInfo?.bankName || "Bank name (e.g., 'HDFC Bank', 'ICICI Bank') or null"}",
  "displayName": "User-friendly name (e.g., 'Tata Neu Plus', 'HDFC Millennia') or null",
  "cardType": "credit, debit, or prepaid (default: credit)",
  "network": "visa, mastercard, rupay, amex, discover, or diners (IMPORTANT: Tata Neu Plus is 'rupay', not 'visa')",
  "rewardType": "cashback, points, coins, miles, or none (for Tata Neu Plus, use 'coins')",
  "annualFee": "Annual fee in INR as number (0 if LTF/free) or null",
  "joiningFee": "Joining fee in INR as number (0 if waived) or null",
  "primaryColor": "Hex color code (use bank brand colors) or null",
  "secondaryColor": "Hex color code (use bank brand colors) or null",
  "benefits": [
    {
      "category": "dining (or shopping, travel, fuel, grocery, upi, lounge, insurance, etc.)",
      "description": "Detailed benefit description (e.g., 'Earn 1% NeuCoins on all dining transactions')",
      "rewardRate": "Number (e.g., 1 for 1%) or null",
      "rewardType": "cashback, points, coins, or miles",
      "rewardCap": "Number or null (e.g., 500 for monthly cap)",
      "rewardCapPeriod": "monthly, quarterly, annual, or null",
      "conditions": ["Array of condition strings (e.g., 'Applicable on all restaurant spends')"],
      "isActive": true
    }
  ],
  "offers": [
    {
      "title": "Offer title (e.g., 'Lounge Access', 'Tata Neu Exclusive Offer')",
      "description": "Detailed offer description",
      "category": "Offer category (travel, shopping, dining, etc.)",
      "validity": "Validity period (e.g., '31 Dec 2025') or null",
      "terms": ["Array of terms (e.g., 'Spend threshold must be met')"],
      "isActive": true
    }
  ],
  "rewards": {
    "baseRate": "Number (e.g., 1 for 1% base reward rate) or null",
    "baseRewardType": "cashback, points, coins, or miles",
    "acceleratedRates": [
      {
        "category": "Category name (e.g., 'grocery', 'insurance', 'dining')",
        "rate": "Number (e.g., 2 for 2% accelerated rate)",
        "rewardType": "cashback, points, coins, or miles",
        "cap": "Number or null (e.g., 200 for monthly cap)"
      }
    ],
    "redemption": {
      "cashback": true or false,
      "points": true or false,
      "miles": true or false
    }
  },
  "milestones": [
    {
      "spendingThreshold": "Number in INR (e.g., 50000 for ₹50,000)",
      "reward": "Reward description (e.g., 'Complimentary lounge access')",
      "description": "Detailed description (e.g., 'Spend ₹50,000 or more in a calendar quarter to avail domestic airport lounge benefit')",
      "type": "monthly, quarterly, or annual",
      "isActive": true
    }
  ],
  "rewardsProgress": {
    "type": "cashback, points, coins, miles, membership_points, edge_miles, or other",
    "unit": "Unit abbreviation (e.g., 'pts', 'coins', '₹')",
    "displayName": "Display name (e.g., 'Reward Points', 'NeuCoins')",
    "redemptionRate": "Number (e.g., 0.01 for 1 coin = ₹0.01, or 0.25 for 1 point = ₹0.25)",
    "redemptionCurrency": "Currency code (e.g., 'INR')",
    "milestones": [
      {
        "threshold": "Number (e.g., 1000)",
        "reward": "Reward description (e.g., '₹100 cashback')",
        "description": "Detailed description (e.g., 'Redeem 1000 NeuCoins for ₹100 cashback')"
      }
    ]
  },
  "metadata": {},
  "confidence": "high, medium, or low"
}

CRITICAL - FOLLOW EXACTLY:
1. Return ONLY JSON (no markdown, no explanations)
2. Use camelCase: cardName (NOT card_name), bankName (NOT bank_name)
3. IGNORE these statement fields completely: transactions, account_number, available_credit_limit, minimum_amount_due, due_date, bonus_neucoins_summary, base_neucoins, date_time, transaction_description
4. For Tata Neu Plus: network="rupay", rewardType="coins", displayName="Tata Neu Plus"
5. Extract benefits from statement (look for "1% NeuCoins", "dining", "travel", "lounge access", "₹50,000")
6. Populate benefits array with at least 2-3 items based on statement mentions
7. Set confidence to "high" if you extract network, rewardType, and at least 2 benefits

**SUPPORTED BANKS:** HDFC Bank, ICICI Bank, SBI Bank, Axis Bank, American Express, HSBC Bank, YES Bank, IndusInd Bank, IDFC First Bank, Kotak Mahindra Bank, RBL Bank, AU Small Finance Bank, Federal Bank, Bank of Baroda, Union Bank of India, Punjab National Bank, Standard Chartered Bank, CSB Bank, Kiwi, and others.

${contextInfo ? `**Context from Statement (ALREADY EXTRACTED - USE THESE VALUES):**\n${JSON.stringify(contextInfo, null, 2)}\n\nIMPORTANT: The cardName "${contextInfo.cardName || 'N/A'}" and bankName "${contextInfo.bankName || 'N/A'}" are already extracted from the statement. Use these values in your response and fill in the remaining metadata based on your knowledge of this specific card.\n\n` : ''}**Card Examples (use your knowledge - these show the EXPECTED OUTPUT FORMAT):**

Example 1 - Tata Neu Plus (Rupay, NeuCoins):
{
  "cardName": "Tata Neu Plus Credit Card",
  "bankName": "HDFC Bank",
  "displayName": "Tata Neu Plus",
  "network": "rupay",
  "rewardType": "coins",
  "annualFee": 0,
  "benefits": [
    {"category": "dining", "description": "Earn 1% NeuCoins on all dining transactions", "rewardRate": 1, "rewardType": "coins", "isActive": true},
    {"category": "hotels", "description": "Earn 1% NeuCoins on hotel bookings", "rewardRate": 1, "rewardType": "coins", "isActive": true},
    {"category": "travel", "description": "Earn 1% NeuCoins on travel bookings", "rewardRate": 1, "rewardType": "coins", "isActive": true}
  ],
  "offers": [
    {"title": "Lounge Access", "description": "Spend ₹50,000 or more in a calendar quarter to avail domestic airport lounge benefit via voucher", "category": "travel", "isActive": true}
  ],
  "rewards": {"baseRate": 1, "baseRewardType": "coins"},
  "milestones": [
    {"spendingThreshold": 50000, "reward": "Complimentary lounge access", "description": "Spend ₹50,000 or more in a calendar quarter", "type": "quarterly", "isActive": true}
  ],
  "rewardsProgress": {"type": "coins", "unit": "coins", "displayName": "NeuCoins", "redemptionRate": 0.01, "redemptionCurrency": "INR"}
}

Example 2 - HDFC Millennia (Visa, Cashback):
{
  "cardName": "HDFC Millennia Credit Card",
  "bankName": "HDFC Bank",
  "displayName": "HDFC Millennia",
  "network": "visa",
  "rewardType": "cashback",
  "annualFee": 0,
  "benefits": [
    {"category": "shopping", "description": "5% cashback on select merchants", "rewardRate": 5, "rewardType": "cashback", "isActive": true}
  ],
  "rewards": {"baseRate": 1, "baseRewardType": "cashback"}
}

PDF Text:
${pdfText.slice(0, 12000)}

JSON:`;

    try {
      // Use higher maxTokens for Ollama to ensure complete responses
      const maxTokens = this.options.provider === 'ollama' ? 3000 : 2000;
      const content = await this.callLLM(systemPrompt, prompt, {
        format: 'json',
        maxTokens,
        temperature: this.options.provider === 'ollama' ? 0.2 : 0.1, // Slightly higher temp for Ollama
      });

      console.log('🔍 [LLM Router] Raw response length:', content?.length || 0);
      console.log(
        '🔍 [LLM Router] Raw response preview (first 1000 chars):',
        content?.slice(0, 1000) || 'EMPTY',
      );

      const jsonContent = this.extractJSON(content);
      console.log(
        '🔍 [LLM Router] Extracted JSON length:',
        jsonContent?.length || 0,
      );

      const parsed = JSON.parse(jsonContent);
      const parsedKeys = Object.keys(parsed || {});
      console.log('🔍 [LLM Router] Parsed JSON keys:', parsedKeys);
      console.log(
        '🔍 [LLM Router] Parsed JSON (full):',
        JSON.stringify(parsed, null, 2),
      );

      // Filter out statement-specific fields that Ollama might return
      const statementFields = [
        'transactions',
        'credit_limit',
        'available_credit',
        'minimum_amount_due',
        'due_date',
        'payment_due_date',
        'billing_period',
        'statement_date',
        'total_amount_due',
        'available_credit_limit',
        'available_cash_limit',
        'important_info',
        'card_control',
        'purchase_indicator',
        'bonus_neucoins_summary',
        'base_neucoins',
        'neucoins',
        'neu_coins',
        'date_time',
        'transaction_description',
        'program_name',
        'total_bonus_neucoins',
      ];
      for (const field of statementFields) {
        if (parsed[field] !== undefined) {
          console.warn(`⚠️ [LLM Router] Removing statement field: ${field}`);
          delete parsed[field];
        }
      }

      // Check if critical fields are missing
      const missingFields = [];
      if (!parsed.cardName && !parsed.card_name) missingFields.push('cardName');
      if (!parsed.bankName && !parsed.bank_name && !parsed.issuer)
        missingFields.push('bankName');
      if (!parsed.network) missingFields.push('network');
      if (!parsed.rewardType && !parsed.reward_type)
        missingFields.push('rewardType');
      if (!parsed.benefits || parsed.benefits.length === 0)
        missingFields.push('benefits (empty)');
      if (!parsed.rewards || Object.keys(parsed.rewards).length === 0)
        missingFields.push('rewards (empty)');
      if (missingFields.length > 0) {
        console.warn('⚠️ [LLM Router] Missing or empty fields:', missingFields);
      }

      // Normalize field names (handle snake_case from Ollama)
      const normalizeField = (
        obj: any,
        camelKey: string,
        ...altKeys: string[]
      ) => {
        if (obj[camelKey] !== undefined) return obj[camelKey];
        const snakeKey = camelKey.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (obj[snakeKey] !== undefined) return obj[snakeKey];
        for (const altKey of altKeys) {
          if (obj[altKey] !== undefined) return obj[altKey];
        }
        return undefined;
      };

      // Infer network from card name if missing (Tata Neu = Rupay)
      const cardNameForInference = (
        normalizeField(parsed, 'cardName', 'card_name') ||
        contextInfo?.cardName ||
        ''
      ).toLowerCase();
      let inferredNetwork = normalizeField(parsed, 'network');
      if (!inferredNetwork) {
        if (
          cardNameForInference.includes('tata neu') ||
          cardNameForInference.includes('neu')
        ) {
          inferredNetwork = 'rupay';
          console.log('✅ [LLM Router] Inferred network from card name: rupay');
        }
      }

      // Infer rewardType for Tata Neu cards
      const inferredRewardType =
        normalizeField(parsed, 'rewardType', 'reward_type') ||
        (inferredNetwork === 'rupay' && cardNameForInference.includes('neu')
          ? 'coins'
          : undefined);

      const benefits = (parsed.benefits || []).map((b: any) => ({
        category: b.category || b.name || 'general',
        description: b.description || b.name || '',
        rewardRate: b.rewardRate || b.reward_rate,
        rewardType: b.rewardType || b.reward_type,
        rewardCap: b.rewardCap || b.reward_cap,
        rewardCapPeriod: b.rewardCapPeriod || b.reward_cap_period,
        conditions:
          b.conditions ||
          (b.terms_and_conditions ? [b.terms_and_conditions] : []),
        isActive: b.isActive !== false && b.is_active !== false,
      }));

      const rewards = parsed.rewards || {};

      // Set confidence based on extracted data quality
      const hasNetwork = inferredNetwork && inferredNetwork !== 'NOT FOUND';
      const hasRewardType =
        inferredRewardType && inferredRewardType !== 'NOT FOUND';
      const hasBenefits = benefits && benefits.length >= 2;
      const hasRewards = rewards && Object.keys(rewards).length > 0;

      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (hasNetwork && hasRewardType && hasBenefits && hasRewards) {
        confidence = 'high';
      } else if (hasNetwork && hasRewardType && (hasBenefits || hasRewards)) {
        confidence = 'medium';
      }

      const result: CardMetadataResult = {
        // Use contextInfo as fallback if Ollama didn't extract these
        cardName:
          normalizeField(parsed, 'cardName', 'card_name') ||
          contextInfo?.cardName ||
          undefined,
        bankName:
          normalizeField(parsed, 'bankName', 'bank_name', 'issuer') ||
          contextInfo?.bankName ||
          undefined,
        displayName: normalizeField(parsed, 'displayName', 'display_name'),
        cardType: normalizeField(parsed, 'cardType', 'card_type') || 'credit',
        network: inferredNetwork,
        rewardType: inferredRewardType,
        annualFee: normalizeField(parsed, 'annualFee', 'annual_fee') ?? 0,
        joiningFee: normalizeField(parsed, 'joiningFee', 'joining_fee') ?? 0,
        primaryColor: normalizeField(parsed, 'primaryColor', 'primary_color'),
        secondaryColor: normalizeField(
          parsed,
          'secondaryColor',
          'secondary_color',
        ),
        benefits,
        offers: (() => {
          const rawOffers = parsed.offers || [];
          // Filter out statement-specific "offers" that are actually bonus NeuCoins programs
          return rawOffers.filter((offer: any) => {
            const name = (offer.name || offer.title || '').toLowerCase();
            const description = (offer.description || '').toLowerCase();
            // These are statement-specific bonus programs, not card offers
            const isStatementProgram =
              name.includes('neucoins_on_') ||
              name.includes('bonus_neucoins') ||
              description.includes('bonus neucoins') ||
              name.includes('neucoins_on_upi');
            return !isStatementProgram;
          });
        })(),
        rewards,
        milestones: parsed.milestones || [],
        rewardsProgress: parsed.rewardsProgress || null,
        metadata: parsed.metadata || {},
        confidence,
      };

      console.log('✅ [LLM Router] Normalized result:', {
        cardName: result.cardName || 'NOT FOUND',
        bankName: result.bankName || 'NOT FOUND',
        network: result.network || 'NOT FOUND',
        rewardType: result.rewardType || 'NOT FOUND',
        benefitsCount: result.benefits?.length || 0,
      });

      // Cache for 24 hours (card metadata doesn't change often)
      this.cache.set(cacheKey, {
        result,
        expiry: Date.now() + 24 * 60 * 60 * 1000,
      });

      return result;
    } catch (error) {
      console.error('❌ [LLM Router] Card metadata extraction error:', error);
      if (error instanceof Error) {
        console.error('❌ [LLM Router] Error message:', error.message);
        console.error('❌ [LLM Router] Error stack:', error.stack);
      }
      return null;
    }
  }

  /**
   * Batch categorize multiple transactions in parallel
   */
  async batchCategorize(
    transactions: Array<{
      merchant: string;
      amount: number;
      description?: string;
    }>,
  ): Promise<CategorizationResult[]> {
    console.log(`📦 Batch categorizing ${transactions.length} transactions...`);

    // Process in batches of 10 for optimal performance
    const batchSize = 10;
    const results: CategorizationResult[] = [];

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(txn =>
          this.categorizeTransaction(txn.merchant, txn.amount, txn.description),
        ),
      );

      results.push(...batchResults);

      // Log progress
      if (transactions.length > 20) {
        const progress = Math.min(
          100,
          ((i + batchSize) / transactions.length) * 100,
        );
        console.log(`   Progress: ${progress.toFixed(0)}%`);
      }
    }

    // Calculate stats
    const avgLatency =
      results.reduce((sum, r) => sum + r.latency, 0) / results.length;
    const cacheHits = results.filter(r => r.cached).length;
    const cacheHitRate = (cacheHits / results.length) * 100;

    console.log(`✅ Batch complete: ${results.length} transactions`);
    console.log(`   Avg latency: ${avgLatency.toFixed(0)}ms`);
    console.log(`   Cache hit rate: ${cacheHitRate.toFixed(0)}%`);

    return results;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.cache.size,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Helper: Get from cache
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.result;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired
    }
    return null;
  }
}

// Singleton instance (for default usage)
let defaultLLMService: LLMService | null = null;

export function getLLMService(options?: LLMServiceOptions): LLMService {
  // If no options provided, use singleton
  if (!options || Object.keys(options).length === 0) {
    if (!defaultLLMService) {
      defaultLLMService = new LLMService();
      // Warm up in background (non-blocking)
      defaultLLMService.warmUp().catch(console.error);
    }
    return defaultLLMService;
  }

  // If options provided, create new instance with those options
  const service = new LLMService(options);
  service.warmUp().catch(console.error);
  return service;
}

// Export convenience functions that match cc-engine's API
export async function extractMetadataWithLLM(
  pdfText: string,
  options: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    provider?: 'openai' | 'ollama';
    ollamaBaseUrl?: string;
  } = {},
): Promise<StatementMetadataResult | null> {
  const serviceOptions: LLMServiceOptions = {};
  if (options.provider) serviceOptions.provider = options.provider;
  if (options.apiKey) serviceOptions.openaiApiKey = options.apiKey;
  if (options.ollamaBaseUrl)
    serviceOptions.ollamaBaseUrl = options.ollamaBaseUrl;
  if (options.model) serviceOptions.model = options.model;
  if (options.temperature !== undefined)
    serviceOptions.temperature = options.temperature;

  const service = getLLMService(serviceOptions);
  return service.extractStatementMetadata(pdfText);
}

export async function extractCardMetadataWithLLM(
  pdfText: string,
  contextInfo?: {
    cardName?: string;
    bankName?: string;
    spendingCategories?: Array<{ category: string; percentage: number }>;
    rewardsProgramSummary?: Array<{ program: string; points: number }>;
    rewardPoints?: number;
  },
  options: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    provider?: 'openai' | 'ollama';
    ollamaBaseUrl?: string;
  } = {},
): Promise<CardMetadataResult | null> {
  const serviceOptions: LLMServiceOptions = {};
  if (options.provider) serviceOptions.provider = options.provider;
  if (options.apiKey) serviceOptions.openaiApiKey = options.apiKey;
  if (options.ollamaBaseUrl)
    serviceOptions.ollamaBaseUrl = options.ollamaBaseUrl;
  if (options.model) serviceOptions.model = options.model;
  if (options.temperature !== undefined)
    serviceOptions.temperature = options.temperature;

  const service = getLLMService(serviceOptions);
  return service.extractCardMetadata(pdfText, contextInfo);
}

/**
 * LLM-based Card Metadata Extractor
 * Extracts comprehensive card metadata from PDF text and parsed statement data
 */

export interface CardMetadataExtractionOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export interface ExtractedCardMetadata {
  cardName?: string;
  bankName?: string; // Also extract bank name from PDF
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
    unit: string; // e.g., "pts", "coins", "miles", "₹"
    displayName: string; // e.g., "Reward Points", "NeuCoins", "Edge Miles"
    redemptionRate?: number; // e.g., 0.25 for 1 point = ₹0.25
    redemptionCurrency?: string; // e.g., "INR"
    milestones?: Array<{
      threshold: number;
      reward: string;
      description: string;
    }>;
  };
  metadata?: Record<string, any>;
  confidence?: 'high' | 'medium' | 'low';
}

/**
 * Extract comprehensive card metadata from PDF text and parsed statement data
 */
export async function extractCardMetadataWithLLM(
  pdfText: string,
  extractedMetadata: {
    cardName?: string;
    bankName?: string;
    spendingCategories?: Array<{ category: string; percentage: number }>;
    rewardsProgramSummary?: Array<{ program: string; points: number }>;
    rewardPoints?: number;
    [key: string]: any;
  } = {},
  options: CardMetadataExtractionOptions = {},
): Promise<ExtractedCardMetadata | null> {
  const { apiKey, model = 'gpt-4o-mini', temperature = 0.1 } = options;

  // If no API key, return null (graceful fallback)
  if (!apiKey) {
    console.log(
      '⚠️ [Card Metadata Extractor] No API key provided, skipping extraction',
    );
    return null;
  }

  console.log(
    `🔑 [Card Metadata Extractor] API key provided, length: ${apiKey.length}`,
  );
  console.log(
    `📄 [Card Metadata Extractor] PDF text length: ${pdfText.length} characters`,
  );

  try {
    // Dynamic import to avoid requiring OpenAI in all environments
    console.log('📦 [Card Metadata Extractor] Importing OpenAI...');
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });
    console.log('✅ [Card Metadata Extractor] OpenAI initialized');

    // Truncate text if too long (keep first 12000 chars for context)
    const truncatedText = pdfText.slice(0, 12000);
    console.log(
      `✂️ [Card Metadata Extractor] Using truncated text (${truncatedText.length} chars) for LLM call`,
    );

    // Build context from extracted metadata
    const contextInfo = {
      cardName: extractedMetadata.cardName,
      bankName: extractedMetadata.bankName,
      spendingCategories: extractedMetadata.spendingCategories,
      rewardsProgramSummary: extractedMetadata.rewardsProgramSummary,
      rewardPoints: extractedMetadata.rewardPoints,
    };

    const prompt = `You are a financial product analyst with comprehensive knowledge of ALL Indian credit cards from ALL major banks. Extract comprehensive card metadata using BOTH:
1. Information from the statement PDF text (card name, bank name, reward points, spending patterns)
2. YOUR GLOBAL KNOWLEDGE about the card (benefits, offers, fees, milestones, network, design colors that are standard for this card type)

**SUPPORTED BANKS:** You have knowledge about cards from: HDFC Bank, ICICI Bank, SBI Bank, Axis Bank, American Express, HSBC Bank, YES Bank, IndusInd Bank, IDFC First Bank, Kotak Mahindra Bank, RBL Bank, AU Small Finance Bank, Federal Bank, Bank of Baroda, Union Bank of India, Punjab National Bank, Standard Chartered Bank, CSB Bank, Kiwi, and all other major Indian banks.

**BANK BRAND COLORS (use these for primaryColor/secondaryColor):**
- HDFC Bank: primaryColor="#004C8F", secondaryColor="#ED232A"
- ICICI Bank: primaryColor="#F37021", secondaryColor="#532D8E"
- SBI Bank: primaryColor="#22409A", secondaryColor="#6DA3E8"
- Axis Bank: primaryColor="#97144D", secondaryColor="#800020"
- American Express: primaryColor="#006FCF", secondaryColor="#00175A"
- HSBC Bank: primaryColor="#DB0011", secondaryColor="#000000"
- YES Bank: primaryColor="#00428F", secondaryColor="#FFD200"
- IndusInd Bank: primaryColor="#ED1C24", secondaryColor="#00A651"
- IDFC First Bank: primaryColor="#7F0A31", secondaryColor="#D4AF37"
- Kotak Mahindra Bank: primaryColor="#ED232A", secondaryColor="#000000"
- RBL Bank: primaryColor="#003A70", secondaryColor="#00A0DF"
- AU Small Finance Bank: primaryColor="#FFB300", secondaryColor="#1A1A1A"
- Federal Bank: primaryColor="#FDB813", secondaryColor="#004E8C"
- Bank of Baroda: primaryColor="#F26522", secondaryColor="#231F20"
- Union Bank of India: primaryColor="#FF6B00", secondaryColor="#003D7A"
- Punjab National Bank: primaryColor="#0D4584", secondaryColor="#E5252A"
- Standard Chartered Bank: primaryColor="#007A33", secondaryColor="#0066B2"
- CSB Bank: primaryColor="#0066CC", secondaryColor="#000000"
- Kiwi: primaryColor="#00A8E8", secondaryColor="#000000"

**CRITICAL INSTRUCTION:** Once you identify the card name and bank name from the statement, use your comprehensive knowledge about that specific card from that bank to fill in ALL metadata fields, even if they're not mentioned in the statement. Examples:
- HDFC Millennia: Visa, 5% cashback on select merchants, 1% on others, ₹0 annual fee (LTF)
- HDFC Regalia: Visa/Mastercard, reward points, ₹2500 annual fee, lounge access
- ICICI Amazon Pay: Visa, cashback on Amazon, ₹0 annual fee
- Axis Magnus: Visa, reward points, high annual fee, premium benefits
- SBI SimplyClick: Visa, cashback on online spends, ₹499 annual fee
- Amex Platinum: Amex network, Membership Rewards points, premium card
- Tata Neu Plus: Uses NeuCoins, co-branded with Tata, specific benefits
- And ALL other cards from ALL banks - use your knowledge!

**IMPORTANT:** Extract card name and bank name FIRST from the statement. Use context clues, logos, headers, and any identifying information in the PDF.

**CRITICAL:** Return a FLAT JSON object with all fields at the top level. Do NOT nest fields under "basicInformation", "fees", "design", etc. All fields should be at the root level of the JSON object.

Extract the following information in JSON format (all fields at the root level):

**Basic Information (REQUIRED - extract these even if not explicitly stated):**
- cardName: The exact credit card name (e.g., "Tata Neu Plus Credit Card", "Millennia Credit Card", "HDFC Regalia Credit Card")
  * Look for card names in headers, footers, or anywhere in the document
  * If you see partial names like "Millennia" or "Regalia", infer the full name based on the bank
  * Use the context provided below as hints, but verify from the PDF text
- bankName: The bank name (e.g., "HDFC", "ICICI", "Axis", "SBI", "American Express")
  * Extract from logos, headers, or any bank identification in the document
  * Use the context provided below as hints, but verify from the PDF text
- displayName: A user-friendly display name (e.g., "Tata Neu Plus", "HDFC Millennia")
- cardType: "credit", "debit", or "prepaid" (default: "credit")
- network: "visa", "mastercard", "rupay", "amex", "discover", or "diners" (REQUIRED - use your knowledge about the card. Most Indian cards are Visa or Mastercard. Amex cards have "amex" or "american express" in name. Rupay cards have "rupay" in name. Diners Club cards have "diners" in name.)
- rewardType: "cashback", "points", "miles", or "none" (infer from rewards structure)

**Fees (use your knowledge about the card):**
- annualFee: Annual fee in INR (number only, 0 if waived or LTF - Lifetime Free). Use your comprehensive knowledge about the specific card's fee structure.
- joiningFee: Joining fee in INR (number only, 0 if waived). Use your knowledge about the card.

**Design (use bank brand colors from the list above):**
- primaryColor: Primary brand color (hex code). Use the bank's primary color from the list above.
- secondaryColor: Secondary brand color (hex code). Use the bank's secondary color from the list above.

**Benefits (array of objects - use your knowledge about the card's standard benefits):**
Extract card benefits from statement AND use your knowledge about the card's standard benefits. Each benefit should have:
- category: Benefit category (e.g., "dining", "shopping", "travel", "fuel", "grocery", "upi", "lounge", "insurance")
- description: Detailed description of the benefit
- rewardRate: Reward rate as percentage or multiplier (e.g., 5 for 5%, 1.5 for 1.5x)
- rewardType: "cashback", "points", or "miles"
- rewardCap: Maximum reward cap amount/points (if mentioned)
- rewardCapPeriod: "monthly", "quarterly", or "annual" (if cap is mentioned)
- conditions: Array of conditions/terms (if any)
- isActive: true

**Offers (array of objects - extract from statement if mentioned, otherwise use your knowledge about current/popular offers for this card):**
Extract current offers mentioned in the statement or use your knowledge:
- title: Offer title
- description: Offer description
- category: Offer category
- validity: Validity period (if mentioned)
- terms: Array of terms and conditions
- isActive: true

**Rewards Structure (object - use your knowledge about the card's reward structure):**
- baseRate: Base reward rate (e.g., 1 for 1%, 0.5 for 0.5%)
- baseRewardType: "cashback", "points", or "miles"
- acceleratedRates: Array of accelerated rates by category:
  - category: Category name (e.g., "grocery", "dining", "travel", "fuel", "shopping")
  - rate: Reward rate (e.g., 5 for 5%)
  - rewardType: "cashback", "points", or "miles"
  - cap: Cap amount/points per month/period (if any)
- redemption: Object indicating redemption options:
  - cashback: true if cashback can be redeemed as cash
  - points: true if points can be redeemed
  - miles: true if miles can be redeemed

**Milestones (array of objects - use your knowledge about the card's milestone benefits):**
Extract milestone benefits from statement if mentioned, otherwise use your knowledge about spending thresholds and rewards:
- spendingThreshold: Spending amount in INR
- reward: Reward description
- description: Detailed description
- type: "monthly", "quarterly", or "annual"
- isActive: true

**Rewards Progress (object):**
Extract information about the rewards tracking system used in the Rewards Progress widget:
- type: "cashback", "points", "coins", "miles", "membership_points", "edge_miles", or "other"
- unit: Unit abbreviation (e.g., "pts", "coins", "miles", "₹", "CB")
- displayName: Display name for the rewards (e.g., "Reward Points", "NeuCoins", "Edge Miles", "Cashback")
- redemptionRate: Redemption rate (e.g., 0.25 means 1 point = ₹0.25, or 1 for cashback)
- redemptionCurrency: Currency for redemption (e.g., "INR")
- milestones: Array of milestone thresholds with rewards:
  - threshold: Points/coins/miles threshold
  - reward: Reward description at this threshold
  - description: Detailed description

**Rewards Progress Examples (use your knowledge):**
- HDFC Millennia: type="cashback", unit="₹", displayName="Cashback", redemptionRate=1, redemptionCurrency="INR"
- HDFC Regalia: type="points", unit="pts", displayName="Reward Points", redemptionRate=0.25 (1 point = ₹0.25), redemptionCurrency="INR"
- ICICI Amazon Pay: type="cashback", unit="₹", displayName="Cashback", redemptionRate=1, redemptionCurrency="INR"
- Tata Neu Plus: type="coins", unit="coins", displayName="NeuCoins", redemptionRate=0.1 (1 coin = ₹0.10), redemptionCurrency="INR"
- Amex Platinum: type="points", unit="pts", displayName="Membership Rewards Points", redemptionRate=0.25, redemptionCurrency="INR"
- Axis Magnus: type="points", unit="pts", displayName="EDGE Rewards Points", redemptionRate=0.2, redemptionCurrency="INR"
- Axis Edge Miles: type="edge_miles", unit="miles", displayName="Edge Miles", redemptionRate=1, redemptionCurrency="INR"
- SBI SimplyClick: type="cashback", unit="₹", displayName="Cashback", redemptionRate=1, redemptionCurrency="INR"

**Additional Metadata:**
- metadata: Any other relevant information as key-value pairs

**Context from Statement:**
${JSON.stringify(contextInfo, null, 2)}

**CRITICAL INSTRUCTIONS:**
1. Extract card name and bank name from the statement PDF text (from ANY bank - HDFC, ICICI, Axis, SBI, Amex, etc.)
2. Once identified, use YOUR COMPREHENSIVE GLOBAL KNOWLEDGE about that specific card from that bank to fill ALL metadata fields
3. For network: Most Indian cards are Visa or Mastercard. Amex cards have "amex"/"american express" in name. Rupay cards have "rupay" in name. Diners Club cards have "diners" in name. Use your knowledge about the specific card.
4. For fees: Use your knowledge about the card's fee structure (annual fee, joining fee, LTF status, fee waiver conditions)
5. For benefits: Use your knowledge about the card's standard benefits, reward rates, categories, caps, and conditions
6. For offers: Extract from statement if mentioned, otherwise use your knowledge about current/popular offers for that card
7. For milestones: Use your knowledge about spending thresholds, quarterly/annual milestones, and associated rewards
8. For rewardsProgress: Extract from statement (current balance, type, unit) AND use your knowledge about redemption rates and currency
9. For design colors: Use the bank's brand colors from the list above (primaryColor and secondaryColor)
10. Use the spending categories and rewards program summary from the context to infer reward rates
11. If reward rates are mentioned as percentages, convert to numbers (e.g., "5%" → 5)
12. Set confidence: "high" if you can fill most fields using knowledge, "medium" if some fields are missing, "low" if very little is known

**CRITICAL JSON FORMAT REQUIREMENT:**
Return a FLAT JSON object with ALL fields at the root level. Do NOT nest fields under "basicInformation", "fees", "design", "rewardsStructure", etc.

**EXAMPLE OF CORRECT JSON STRUCTURE (this is just a structure example - use YOUR knowledge for actual data):**
{
  "cardName": "[Exact card name from statement]",
  "bankName": "[Bank name from statement]",
  "displayName": "[User-friendly display name]",
  "cardType": "credit",
  "network": "[visa|mastercard|rupay|amex|diners|discover]",
  "rewardType": "[cashback|points|miles|none]",
  "annualFee": [number - use your knowledge about the card],
  "joiningFee": [number - use your knowledge about the card],
  "primaryColor": "[hex code - use bank's brand color]",
  "secondaryColor": "[hex code - use bank's brand color]",
  "benefits": [
    {
      "category": "[category name]",
      "description": "[detailed description using your knowledge]",
      "rewardRate": [number],
      "rewardType": "[cashback|points|miles]",
      "rewardCap": [number or null],
      "rewardCapPeriod": "[monthly|quarterly|annual or null]",
      "conditions": ["[array of conditions]"],
      "isActive": true
    }
  ],
  "offers": [
    {
      "title": "[offer title]",
      "description": "[offer description]",
      "category": "[category]",
      "validity": "[validity period]",
      "terms": ["[array of terms]"],
      "isActive": true
    }
  ],
  "rewards": {
    "baseRate": [number],
    "baseRewardType": "[cashback|points|miles]",
    "acceleratedRates": [
      {
        "category": "[category name]",
        "rate": [number],
        "rewardType": "[cashback|points|miles]",
        "cap": [number or null]
      }
    ],
    "redemption": {
      "cashback": [true|false],
      "points": [true|false],
      "miles": [true|false]
    }
  },
  "milestones": [
    {
      "spendingThreshold": [number in INR],
      "reward": "[reward description]",
      "description": "[detailed description]",
      "type": "[monthly|quarterly|annual]",
      "isActive": true
    }
  ],
  "rewardsProgress": {
    "type": "[cashback|points|coins|miles|membership_points|edge_miles|other]",
    "unit": "[unit abbreviation]",
    "displayName": "[display name]",
    "redemptionRate": [number],
    "redemptionCurrency": "[currency code]",
    "milestones": [
      {
        "threshold": [number],
        "reward": "[reward description]",
        "description": "[detailed description]"
      }
    ]
  },
  "metadata": {},
  "confidence": "[high|medium|low]"
}

**IMPORTANT:** The above is just a STRUCTURE EXAMPLE. Do NOT copy values from examples. Use YOUR comprehensive knowledge about the specific card you identify from the statement to fill in ALL the actual values. Each card has unique fees, benefits, rewards, and features - extract them using your knowledge base.

Return ONLY valid JSON, no markdown, no explanations. All fields must be at the root level.

PDF Text:
${truncatedText}

JSON:`;

    console.log(
      `🚀 [Card Metadata Extractor] Calling OpenAI API with model: ${model}`,
    );
    console.log(
      `📝 [Card Metadata Extractor] Prompt length: ${prompt.length} characters`,
    );

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a financial product analyst with comprehensive knowledge of ALL Indian credit cards from ALL major banks (HDFC, ICICI, Axis, SBI, Amex, HSBC, YES, IndusInd, IDFC, Kotak, RBL, AU, Federal, BOB, Union, PNB, SCB, CSB, Kiwi, and others). Extract card metadata using BOTH information from the statement AND your global knowledge about the specific card. Once you identify the card name and bank name, use your comprehensive knowledge to fill in ALL metadata fields (benefits, offers, fees, milestones, network, design colors) even if not mentioned in the statement. Return only valid JSON in a flat structure with all fields at the root level.',
        },
        { role: 'user', content: prompt },
      ],
      temperature,
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    console.log(`📥 [Card Metadata Extractor] Received response from OpenAI`);
    console.log(
      `📥 [Card Metadata Extractor] Response choices count: ${response.choices?.length || 0}`,
    );
    console.log(
      `📥 [Card Metadata Extractor] Usage: ${JSON.stringify(response.usage || {})}`,
    );

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('⚠️ [Card Metadata Extractor] Empty response from OpenAI');
      console.warn(
        '⚠️ [Card Metadata Extractor] Full response:',
        JSON.stringify(response, null, 2),
      );
      return null;
    }

    console.log(
      `📄 [Card Metadata Extractor] Response content length: ${content.length} characters`,
    );
    console.log(
      `📄 [Card Metadata Extractor] Response content preview: ${content.slice(0, 500)}`,
    );

    let extracted: ExtractedCardMetadata;
    try {
      const parsed = JSON.parse(content);

      // Handle nested structure (if LLM returns nested format, flatten it)
      if (parsed.basicInformation || parsed.fees || parsed.design) {
        console.log(
          '⚠️ [Card Metadata Extractor] Detected nested structure, flattening...',
        );
        extracted = {
          cardName: parsed.basicInformation?.cardName || parsed.cardName,
          bankName: parsed.basicInformation?.bankName || parsed.bankName,
          displayName:
            parsed.basicInformation?.displayName || parsed.displayName,
          cardType: parsed.basicInformation?.cardType || parsed.cardType,
          network: parsed.basicInformation?.network || parsed.network,
          rewardType: parsed.basicInformation?.rewardType || parsed.rewardType,
          annualFee: parsed.fees?.annualFee ?? parsed.annualFee,
          joiningFee: parsed.fees?.joiningFee ?? parsed.joiningFee,
          primaryColor: parsed.design?.primaryColor || parsed.primaryColor,
          secondaryColor:
            parsed.design?.secondaryColor || parsed.secondaryColor,
          benefits: parsed.benefits || [],
          offers: parsed.offers || [],
          rewards: parsed.rewardsStructure
            ? {
                ...parsed.rewardsStructure,
                redemption:
                  parsed.rewardsStructure.redemption || parsed.redemption || {},
              }
            : parsed.rewards || {},
          milestones: parsed.milestones || [],
          rewardsProgress: parsed.rewardsProgress || null,
          metadata: parsed.additionalMetadata || parsed.metadata || {},
          confidence: parsed.confidence || 'medium',
        };
        console.log('✅ [Card Metadata Extractor] Flattened nested structure');
      } else {
        extracted = parsed as ExtractedCardMetadata;
      }

      console.log(
        '✅ [Card Metadata Extractor] Successfully parsed JSON response',
      );
    } catch (parseError) {
      console.error(
        '❌ [Card Metadata Extractor] Failed to parse JSON response:',
        parseError,
      );
      console.error('❌ [Card Metadata Extractor] Raw content:', content);
      return null;
    }

    console.log(
      '✅ [Card Metadata Extractor] Successfully extracted metadata:',
      {
        cardName: extracted.cardName,
        bankName: extracted.bankName,
        displayName: extracted.displayName,
        rewardType: extracted.rewardType,
        network: extracted.network,
        benefitsCount: extracted.benefits?.length || 0,
        offersCount: extracted.offers?.length || 0,
        rewardsProgress: extracted.rewardsProgress ? 'Yes' : 'No',
        confidence: extracted.confidence,
      },
    );
    console.log(
      '📊 [Card Metadata Extractor] Full extracted metadata:',
      JSON.stringify(extracted, null, 2),
    );
    return extracted;
  } catch (error) {
    console.error(
      '❌ [Card Metadata Extractor] Error extracting with LLM:',
      error,
    );
    if (error instanceof Error) {
      console.error(
        '❌ [Card Metadata Extractor] Error message:',
        error.message,
      );
      console.error('❌ [Card Metadata Extractor] Error stack:', error.stack);
    }
    // Graceful fallback - return null so system can continue
    return null;
  }
}

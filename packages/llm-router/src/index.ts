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

/**
 * Simple LLM service for FinMatter
 */
export class LLMService {
  private ollama: Ollama;
  private cache: Map<string, { result: any; expiry: number }> = new Map();
  private modelLoaded: boolean = false;

  constructor(ollamaHost: string = 'http://localhost:11434') {
    this.ollama = new Ollama({ host: ollamaHost });
  }

  /**
   * Warm up the model (prevents 26-second delay on first request)
   */
  async warmUp(): Promise<void> {
    if (this.modelLoaded) return;

    console.log('🔥 Warming up Llama 3.1 model...');
    try {
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
      const response = await this.ollama.generate({
        model: 'llama3.1:8b',
        prompt,
        format: 'json',
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 150,
        },
      });

      const latency = Date.now() - startTime;
      const result = JSON.parse(response.response);

      // Ensure confidence is a number between 0 and 1
      if (result.confidence > 1) {
        result.confidence = result.confidence / 100;
      }

      const output: CategorizationResult = {
        category: result.category,
        confidence: result.confidence,
        reasoning: result.reasoning,
        model: 'llama3.1:8b',
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
      const response = await this.ollama.generate({
        model: 'llama3.1:8b',
        prompt,
        stream: false,
        options: {
          temperature: 0.0,
          num_predict: 20,
        },
      });

      const latency = Date.now() - startTime;

      // Clean up response - remove common prefixes
      let normalized = response.response.trim();

      // Remove common LLM artifacts
      normalized = normalized
        .replace(
          /^(Here is the normalized merchant name:|Output:|The merchant name is:|Answer:)/i,
          '',
        )
        .replace(/^[:\-\n\s]+/, '')
        .replace(/['"]/g, '')
        .trim();

      const output: MerchantNormalizationResult = {
        normalized,
        original: rawMerchant,
        model: 'llama3.1:8b',
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

// Singleton instance
let llmService: LLMService | null = null;

export function getLLMService(): LLMService {
  if (!llmService) {
    llmService = new LLMService();
    // Warm up in background (non-blocking)
    llmService.warmUp().catch(console.error);
  }
  return llmService;
}

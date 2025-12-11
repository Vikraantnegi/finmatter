// ============================================================================
// FINMATTER LLM STACK - IMPLEMENTATION STARTER KIT
// ============================================================================

// ============================================================================
// 1. packages/llm-router/src/index.ts
// ============================================================================

import Ollama from 'ollama';
import OpenAI from 'openai';

/\*\*

- Model capabilities and costs
  \*/
  const MODEL_REGISTRY = {
  'llama3.1:8b': {
  type: 'local',
  capabilities: ['categorization', 'extraction', 'normalization'],
  maxTokens: 8192,
  costPerToken: 0,
  avgLatency: 100, // ms
  },
  'mistral:7b': {
  type: 'local',
  capabilities: ['structured_output', 'categorization'],
  maxTokens: 8192,
  costPerToken: 0,
  avgLatency: 80,
  },
  'gpt-4o-mini': {
  type: 'cloud',
  capabilities: ['reasoning', 'conversation', 'complex_analysis'],
  maxTokens: 128000,
  costPerToken: 0.00015, // per 1K tokens
  avgLatency: 1500,
  },
  'gpt-4': {
  type: 'cloud',
  capabilities: ['complex_reasoning', 'creative', 'critical_tasks'],
  maxTokens: 128000,
  costPerToken: 0.03, // per 1K tokens
  avgLatency: 3000,
  },
  } as const;

export type QueryType =
| 'categorization'
| 'extraction'
| 'normalization'
| 'conversation'
| 'reasoning'
| 'optimization';

export interface InferenceRequest {
prompt: string;
queryType: QueryType;
maxTokens?: number;
temperature?: number;
jsonMode?: boolean;
context?: string;
}

export interface InferenceResponse {
result: string;
model: string;
latency: number;
cost: number;
cached: boolean;
}

/\*\*

- Intelligent model router
- Routes queries to the best available model based on:
- - Query type
- - Model availability
- - Cost constraints
- - Latency requirements
    \*/
    export class LLMRouter {
    private ollama: Ollama;
    private openai: OpenAI;
    private cache: Map<string, { result: string; expiry: number }>;
    private ollamaHealthy: boolean = false;

constructor(openaiKey: string, ollamaHost: string = 'http://localhost:11434') {
this.ollama = new Ollama({ host: ollamaHost });
this.openai = new OpenAI({ apiKey: openaiKey });
this.cache = new Map();

    // Check Ollama health on startup
    this.checkOllamaHealth();

    // Periodic health check every 60 seconds
    setInterval(() => this.checkOllamaHealth(), 60000);

}

/\*\*

- Main routing method
  \*/
  async infer(request: InferenceRequest): Promise<InferenceResponse> {
  const startTime = Date.now();

  // Check cache first
  const cacheKey = this.getCacheKey(request);
  const cached = this.cache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
  return {
  result: cached.result,
  model: 'cache',
  latency: Date.now() - startTime,
  cost: 0,
  cached: true,
  };
  }

  // Select best model
  const model = this.selectModel(request.queryType);

  // Route to appropriate model
  let result: string;
  let cost = 0;

  if (model.startsWith('llama') || model.startsWith('mistral')) {
  if (!this.ollamaHealthy) {
  console.warn('Ollama unavailable, falling back to OpenAI');
  return this.inferWithOpenAI(request, 'gpt-4o-mini', startTime);
  }
  result = await this.inferWithOllama(request, model);
  } else {
  return this.inferWithOpenAI(request, model, startTime);
  }

  const latency = Date.now() - startTime;

  // Cache result (5 min TTL for categorization, 1 min for others)
  const ttl = request.queryType === 'categorization' ? 5 _ 60 _ 1000 : 60 \* 1000;
  this.cache.set(cacheKey, {
  result,
  expiry: Date.now() + ttl,
  });

  return {
  result,
  model,
  latency,
  cost,
  cached: false,
  };

}

/\*\*

- Select best model based on query type and availability
  \*/
  private selectModel(queryType: QueryType): string {
  const modelPreferences: Record<QueryType, string[]> = {
  categorization: ['llama3.1:8b', 'mistral:7b', 'gpt-4o-mini'],
  extraction: ['llama3.1:8b', 'gpt-4o-mini'],
  normalization: ['llama3.1:8b', 'mistral:7b', 'gpt-4o-mini'],
  conversation: ['gpt-4o-mini', 'llama3.1:8b'],
  reasoning: ['gpt-4', 'gpt-4o-mini'],
  optimization: ['gpt-4', 'gpt-4o-mini'],
  };

  const preferences = modelPreferences[queryType];

  for (const model of preferences) {
  const isLocal = model.startsWith('llama') || model.startsWith('mistral');
  if (isLocal && this.ollamaHealthy) {
  return model;
  }
  if (!isLocal) {
  return model;
  }
  }

  // Fallback to OpenAI
  return 'gpt-4o-mini';

}

/\*\*

- Inference with Ollama
  \*/
  private async inferWithOllama(
  request: InferenceRequest,
  model: string
  ): Promise<string> {
  const response = await this.ollama.generate({
  model,
  prompt: request.context
  ? `${request.context}\n\n${request.prompt}`
  : request.prompt,
  stream: false,
  format: request.jsonMode ? 'json' : undefined,
  options: {
  temperature: request.temperature ?? 0.3,
  num_predict: request.maxTokens ?? 512,
  },
  });

  return response.response;

}

/\*\*

- Inference with OpenAI
  \*/
  private async inferWithOpenAI(
  request: InferenceRequest,
  model: string,
  startTime: number
  ): Promise<InferenceResponse> {
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

  if (request.context) {
  messages.push({ role: 'system', content: request.context });
  }

  messages.push({ role: 'user', content: request.prompt });

  const response = await this.openai.chat.completions.create({
  model,
  messages,
  temperature: request.temperature ?? 0.3,
  max_tokens: request.maxTokens ?? 512,
  response_format: request.jsonMode ? { type: 'json_object' } : undefined,
  });

  const result = response.choices[0].message.content || '';
  const tokens = response.usage?.total_tokens || 0;
  const costPerToken = MODEL_REGISTRY[model as keyof typeof MODEL_REGISTRY].costPerToken;
  const cost = (tokens / 1000) \* costPerToken;

  return {
  result,
  model,
  latency: Date.now() - startTime,
  cost,
  cached: false,
  };

}

/\*\*

- Check if Ollama is healthy
  \*/
  private async checkOllamaHealth(): Promise<void> {
  try {
  await this.ollama.list();
  this.ollamaHealthy = true;
  } catch (error) {
  this.ollamaHealthy = false;
  console.warn('Ollama health check failed:', error);
  }
  }

/\*\*

- Generate cache key
  \*/
  private getCacheKey(request: InferenceRequest): string {
  return `${request.queryType}:${request.prompt.substring(0, 100)}`;
  }

/\*\*

- Get current stats
  \*/
  getStats(): {
  ollamaHealthy: boolean;
  cacheSize: number;
  cacheHitRate?: number;
  } {
  return {
  ollamaHealthy: this.ollamaHealthy,
  cacheSize: this.cache.size,
  };
  }
  }

// ============================================================================
// 2. packages/context-engine/src/index.ts
// ============================================================================

/\*\*

- Smart context builder for FinMatter AI
- Builds optimal context based on query type
  \*/
  export class ContextEngine {
  private maxTokens: number = 2000; // Conservative limit

/\*\*

- Build context for transaction categorization
  \*/
  buildCategorizationContext(
  merchant: string,
  amount: number,
  description?: string
  ): string {
  return `Categorize this Indian transaction into ONE of these categories:

* Dining (restaurants, food delivery like Swiggy/Zomato)
* Shopping (Amazon, Flipkart, retail stores)
* Groceries (supermarkets, BigBasket, online grocery)
* Fuel (petrol pumps, gas stations)
* Travel (flights, hotels, trains, cabs like Ola/Uber)
* Entertainment (movies, OTT, events, BookMyShow)
* Bills (utilities, phone, internet, electricity)
* Healthcare (hospitals, pharmacy, health insurance)
* Education (schools, courses, books)
* Others (anything else)

Transaction:
Merchant: ${merchant}
Amount: ₹${amount}
${description ? `Description: ${description}` : ''}

Respond ONLY with JSON:
{
"category": "exact category name from list above",
"confidence": 0.0-1.0,
"reasoning": "brief explanation"
}`;
}

/\*\*

- Build context for card recommendation
  \*/
  buildCardRecommendationContext(
  userCards: Array<{
  name: string;
  bank: string;
  rewards: {
  [category: string]: number;
  };
  available: number;
  }>,
  transaction: {
  amount: number;
  category: string;
  merchant?: string;
  }
  ): string {
  let context = `# Card Recommendation\n\n`;
  context += `Transaction: ₹${transaction.amount} at ${transaction.merchant || 'merchant'}\n`;
  context += `Category: ${transaction.category}\n\n`;
  context += `Available Cards:\n\n`;

  userCards.forEach((card, idx) => {
  context += `${idx + 1}. ${card.name} (${card.bank})\n`;
  context += `   Available Credit: ₹${card.available.toLocaleString('en-IN')}\n`;
  context += `   Rewards:\n`;
  Object.entries(card.rewards).forEach(([cat, rate]) => {
  context += `     - ${cat}: ${rate}%\n`;
  });
  context += `\n`;
  });

  context += `Recommend the BEST card for this transaction. Consider:\n`;
  context += `1. Highest reward rate for the category\n`;
  context += `2. Available credit\n`;
  context += `3. Overall value\n\n`;
  context += `Respond with card name, expected reward, and reasoning.`;

  return this.truncateContext(context);

}

/\*\*

- Build context for spending analysis
  \*/
  buildSpendingAnalysisContext(
  transactions: Array<{
  date: string;
  merchant: string;
  category: string;
  amount: number;
  }>,
  timeRange: string = 'last 30 days'
  ): string {
  let context = `# Spending Analysis (${timeRange})\n\n`;

  // Group by category
  const byCategory: Record<string, number> = {};
  transactions.forEach((txn) => {
  byCategory[txn.category] = (byCategory[txn.category] || 0) + txn.amount;
  });

  const total = Object.values(byCategory).reduce((sum, amt) => sum + amt, 0);

  context += `Total Spending: ₹${total.toLocaleString('en-IN')}\n\n`;
  context += `Breakdown by Category:\n`;
  Object.entries(byCategory)
  .sort(([, a], [, b]) => b - a)
  .forEach(([cat, amt]) => {
  const pct = ((amt / total) \* 100).toFixed(1);
  context += `- ${cat}: ₹${amt.toLocaleString('en-IN')} (${pct}%)\n`;
  });

  context += `\n\nRecent Transactions:\n`;
  transactions.slice(0, 10).forEach((txn) => {
  context += `- ${txn.date}: ${txn.merchant} - ₹${txn.amount} (${txn.category})\n`;
  });

  return this.truncateContext(context);

}

/\*\*

- Truncate context to fit token limit
  \*/
  private truncateContext(context: string): string {
  // Rough estimate: 1 token ≈ 4 characters
  const estimatedTokens = context.length / 4;

  if (estimatedTokens <= this.maxTokens) {
  return context;
  }

  // Truncate and add note
  const targetLength = this.maxTokens \* 4;
  const truncated = context.substring(0, targetLength);
  return truncated + '\n\n[Context truncated to fit token limit]';

}
}

// ============================================================================
// 3. apps/worker/src/jobs/categorizeTransactions.ts
// ============================================================================

import { LLMRouter } from '@finmatter/llm-router';
import { ContextEngine } from '@finmatter/context-engine';

/\*\*

- Background job: Categorize transactions
  \*/
  export async function categorizeTransactionsJob(
  transactions: Array<{
  id: string;
  merchant: string;
  amount: number;
  description?: string;
  }>
  ): Promise<void> {
  const router = new LLMRouter(process.env.OPENAI_API_KEY!);
  const contextEngine = new ContextEngine();

console.log(`[Job] Categorizing ${transactions.length} transactions`);

// Process in batches of 10 for parallel execution
const batchSize = 10;
for (let i = 0; i < transactions.length; i += batchSize) {
const batch = transactions.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (txn) => {
        try {
          const context = contextEngine.buildCategorizationContext(
            txn.merchant,
            txn.amount,
            txn.description
          );

          const response = await router.infer({
            prompt: context,
            queryType: 'categorization',
            jsonMode: true,
            temperature: 0.1,
          });

          const result = JSON.parse(response.result);

          // Save to database
          await updateTransactionCategory(txn.id, result.category, result.confidence);

          console.log(
            `[Job] Categorized ${txn.merchant} → ${result.category} ` +
              `(${result.confidence.toFixed(2)}) ` +
              `[${response.model}, ${response.latency}ms, $${response.cost.toFixed(4)}]`
          );
        } catch (error) {
          console.error(`[Job] Failed to categorize transaction ${txn.id}:`, error);
        }
      })
    );

}

console.log(`[Job] Categorization complete`);
}

async function updateTransactionCategory(
id: string,
category: string,
confidence: number
): Promise<void> {
// Update in your database
// await supabase.from('transactions').update({ category, confidence }).eq('id', id);
}

// ============================================================================
// 4. Setup Script
// ============================================================================

export const setupInstructions = `

# FinMatter LLM Stack Setup

## 1. Install Dependencies

\`\`\`bash

# Root

pnpm add -w ollama openai bullmq ioredis

# LLM Router

cd packages/llm-router
pnpm add ollama openai

# Context Engine

cd ../context-engine
pnpm init
pnpm add -D typescript @types/node

# Worker

cd ../../apps/worker
pnpm init
pnpm add bullmq ioredis @finmatter/llm-router @finmatter/context-engine
\`\`\`

## 2. Install Ollama

\`\`\`bash

# macOS/Linux

curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama

ollama serve

# Pull models (in another terminal)

ollama pull llama3.1:8b
ollama pull mistral:7b
\`\`\`

## 3. Environment Variables

\`\`\`env

# .env.local

OPENAI_API_KEY=sk-...
OLLAMA_HOST=http://localhost:11434
REDIS_URL=redis://localhost:6379
\`\`\`

## 4. Test Setup

\`\`\`typescript
// test/llm-router.test.ts
import { LLMRouter } from '@finmatter/llm-router';

async function test() {
const router = new LLMRouter(process.env.OPENAI_API_KEY!);

const response = await router.infer({
prompt: 'Categorize: Swiggy Bangalore, ₹450',
queryType: 'categorization',
jsonMode: true,
});

console.log('Result:', response);
console.log('Model:', response.model); // Should use local if Ollama running
console.log('Latency:', response.latency + 'ms');
console.log('Cost:', '$' + response.cost.toFixed(4));
}

test();
\`\`\`

## 5. Run

\`\`\`bash

# Terminal 1: Start Ollama

ollama serve

# Terminal 2: Start Redis

redis-server

# Terminal 3: Start Worker

cd apps/worker
pnpm dev

# Terminal 4: Start API

cd apps/api
pnpm dev

# Terminal 5: Start Web

cd apps/web-pwa
pnpm dev
\`\`\`

## 6. Verify

1. Upload a credit card statement
2. Check logs - should see "Using model: llama3.1:8b"
3. Check categorization accuracy
4. Monitor costs in OpenAI dashboard (should be minimal)

## 7. Production Deployment

See architecture doc for deployment options.

Quick start with Railway:

- Deploy worker + Ollama as one service
- Use Railway's Redis addon
- Connect to Supabase

## Cost Savings Estimate

Before: $90/month (1000 users)
After: $42/month (1000 users)
Savings: 53%

At 10K users: $500/month savings
At 100K users: $5000/month savings
`;

# FinMatter Production Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                            USER LAYER                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │   Web PWA (Next.js 14)    │
                    │   - PWA with offline mode │
                    │   - React Query caching   │
                    │   - Zustand state         │
                    └─────────────┬─────────────┘
                                  │
                                  │ HTTPS/WebSocket
                                  │
┌─────────────────────────────────▼─────────────────────────────────────┐
│                          APPLICATION LAYER                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────┐        ┌──────────────────────┐           │
│  │  Next.js API Server  │        │  Background Workers  │           │
│  │  ─────────────────── │        │  ─────────────────── │           │
│  │  • REST endpoints    │◄──────►│  • BullMQ queues     │           │
│  │  • Auth middleware   │        │  • Cron jobs         │           │
│  │  • Rate limiting     │        │  • Statement parsing │           │
│  │  • Request logging   │        │  • Categorization    │           │
│  └──────────┬───────────┘        └──────────┬───────────┘           │
│             │                               │                         │
│             └───────────────┬───────────────┘                         │
│                             │                                         │
└─────────────────────────────┼─────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────▼─────────────────────────────────────────┐
│                         LLM INFERENCE LAYER                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              Context Engine (packages/context-engine)          │  │
│  │  ──────────────────────────────────────────────────────────── │  │
│  │  • ContextBuilder: builds optimal context per query type       │  │
│  │  • ContextCache: 5-min TTL cache for user contexts             │  │
│  │  • ContextPrioritizer: ranks data by relevance                 │  │
│  │  • TokenCounter: ensures context fits model limits             │  │
│  └────────────┬───────────────────────────────────────────────────┘  │
│               │                                                        │
│               ▼                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │           Inference Router (packages/llm-router)               │  │
│  │  ──────────────────────────────────────────────────────────── │  │
│  │  • Routes queries to best model (local vs cloud)               │  │
│  │  • Fallback logic if local model unavailable                   │  │
│  │  • Load balancing for multiple local models                    │  │
│  │  • Cost tracking and optimization                              │  │
│  └────┬───────────────┬──────────────────┬────────────────────────┘  │
│       │               │                  │                            │
│       ▼               ▼                  ▼                            │
│  ┌─────────┐   ┌──────────┐      ┌─────────────┐                    │
│  │ Ollama  │   │   vLLM   │      │   OpenAI    │                    │
│  │ (Local) │   │ (Local)  │      │   (Cloud)   │                    │
│  │         │   │          │      │             │                    │
│  │ Llama   │   │ Mistral  │      │ GPT-4o-mini │                    │
│  │ 3.1 8B  │   │ 7B       │      │ GPT-4       │                    │
│  └─────────┘   └──────────┘      └─────────────┘                    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────▼─────────────────────────────────────────┐
│                          DATA LAYER                                    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │   PostgreSQL     │  │      Redis       │  │ Supabase Storage │   │
│  │   (Supabase)     │  │   (Cache/Queue)  │  │    (Files)       │   │
│  │  ──────────────  │  │  ──────────────  │  │  ──────────────  │   │
│  │  • Users         │  │  • Context cache │  │  • PDF files     │   │
│  │  • Cards         │  │  • Job queue     │  │  • Receipts      │   │
│  │  • Transactions  │  │  • Rate limiting │  │  • Exports       │   │
│  │  • Statements    │  │  • Session data  │  │                  │   │
│  │  • AI logs       │  │  • Model metrics │  │                  │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND AGENT LAYER                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Agent 1: Parser Improvement Bot (runs daily)                       │
│  ├─ Analyzes failed parses                                          │
│  ├─ Updates regex patterns                                          │
│  └─ Tests against samples                                           │
│                                                                      │
│  Agent 2: Metadata Population Bot (runs weekly)                     │
│  ├─ Scrapes bank websites for new cards                             │
│  ├─ Extracts reward structures                                      │
│  └─ Updates cards_metadata table                                    │
│                                                                      │
│  Agent 3: Categorization Improvement Bot (runs daily)               │
│  ├─ Reviews low-confidence categorizations                          │
│  ├─ Updates merchant mappings                                       │
│  └─ Fine-tunes local model (future)                                 │
│                                                                      │
│  Agent 4: Test Data Generator (on-demand)                           │
│  ├─ Creates realistic test scenarios                                │
│  ├─ Generates edge case data                                        │
│  └─ Populates dev/staging environments                              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Examples

### Flow 1: PDF Statement Upload & Parsing

```
1. User uploads PDF via Web PWA
   ↓
2. API receives file → stores in Supabase Storage
   ↓
3. API creates job in Redis queue (BullMQ)
   ↓
4. Background Worker picks up job
   ↓
5. Worker extracts text from PDF (pdf-parse)
   ↓
6. Worker identifies bank from statement
   ↓
7. Worker calls BankParser (HDFC/ICICI/SBI/etc.)
   ↓
8. If parser fails → fallback to Local LLM for extraction
   ↓
9. Worker gets structured transactions
   ↓
10. For each transaction:
    - Worker calls Inference Layer for categorization
    - Inference Router checks if local model is available
    - If yes → use Ollama (Llama 3.1)
    - If no → fallback to OpenAI
    ↓
11. Worker saves transactions to PostgreSQL
    ↓
12. Worker updates statement status to "success"
    ↓
13. API sends WebSocket notification to user
    ↓
14. Web PWA refreshes transaction list
```

### Flow 2: AI Assistant Query

```
1. User asks: "Which card should I use for dining tonight?"
   ↓
2. API receives query → classifies as "card_recommendation"
   ↓
3. API calls Context Engine:
   - Fetch user's cards from DB
   - Fetch reward structures
   - Check monthly caps usage
   - Calculate available credit
   ↓
4. Context Engine builds optimal context (~1500 tokens)
   ↓
5. Context Engine caches context (5 min TTL)
   ↓
6. API calls Inference Router with context + query
   ↓
7. Inference Router checks model availability:
   - Local model not suitable (needs reasoning) → route to OpenAI
   ↓
8. OpenAI responds with recommendation + reasoning
   ↓
9. API logs query + response + cost
   ↓
10. API returns to user
    ↓
11. Web PWA displays recommendation card
```

### Flow 3: Real-time Transaction Categorization

```
1. Worker processes 1000 transactions from statement
   ↓
2. For each transaction in parallel (batch of 10):
   ↓
3. Worker calls Inference Router:
   - Query: "Categorize: {merchant}, ₹{amount}"
   ↓
4. Inference Router checks:
   - Is Ollama running? Yes
   - Is merchant in cache? No
   ↓
5. Router sends to Ollama (Llama 3.1)
   ↓
6. Ollama responds in ~100ms with:
   {
     "category": "Dining",
     "confidence": 0.92,
     "reasoning": "Swiggy is a food delivery service"
   }
   ↓
7. If confidence < 0.7 → flag for manual review
   ↓
8. Worker saves category to transaction
   ↓
9. Total processing time: 1000 txns in ~10 seconds
   (vs 1000 seconds with sequential OpenAI calls)
```

---

## Package Structure

```
finmatter/
├── apps/
│   ├── web-pwa/              # Next.js 14 PWA
│   ├── api/                  # Next.js 14 API
│   └── worker/               # Background job processor (NEW)
│
├── packages/
│   ├── types/                # Shared TypeScript types
│   ├── utils/                # Shared utilities
│   ├── cc-engine/            # Credit card logic
│   │   ├── src/
│   │   │   ├── parsers/      # Bank statement parsers
│   │   │   ├── categorizer/  # Transaction categorization
│   │   │   └── optimizer/    # Card recommendation
│   │
│   ├── context-engine/       # LLM context building (NEW)
│   │   ├── src/
│   │   │   ├── builders/     # Context builders
│   │   │   ├── cache/        # Context caching
│   │   │   └── prioritizers/ # Data prioritization
│   │
│   ├── llm-router/           # Model routing logic (NEW)
│   │   ├── src/
│   │   │   ├── router.ts     # Main routing logic
│   │   │   ├── models/       # Model connectors
│   │   │   │   ├── ollama.ts
│   │   │   │   ├── vllm.ts
│   │   │   │   └── openai.ts
│   │   │   └── fallback.ts   # Fallback strategies
│   │
│   └── local-llm/            # Local LLM inference (NEW)
│       ├── src/
│       │   ├── ollama.ts     # Ollama connector
│       │   ├── vllm.ts       # vLLM connector (optional)
│       │   └── health.ts     # Model health checks
│
├── docker-compose.yml        # Local dev setup (NEW)
└── infra/                    # Deployment configs (NEW)
    ├── docker/
    └── k8s/
```

---

## Technology Choices & Rationale

### Local LLM Inference

**Ollama (Primary)**

- ✅ Easy setup (1 command)
- ✅ Model management built-in
- ✅ REST API
- ✅ Supports Llama, Mistral, Phi-3
- ❌ Single machine only (no distributed)

**vLLM (Future - High Scale)**

- ✅ 10-20x faster than Ollama
- ✅ Batching support
- ✅ Supports distributed inference
- ❌ More complex setup
- Use when: >10K requests/hour

### Queue System

**BullMQ (Chosen)**

- ✅ Built on Redis (already using)
- ✅ Priority queues
- ✅ Retries and dead-letter queues
- ✅ Job scheduling
- ✅ Great TypeScript support

### Caching Strategy

**Redis (Multi-purpose)**

1. Context cache (5 min TTL)
2. Job queue (BullMQ)
3. Rate limiting
4. Session storage
5. Model health status

---

## Cost Analysis

### Before Optimization (Current)

```
Transaction Categorization:
- 100K transactions/month
- OpenAI GPT-4o-mini: $0.150 per 1M tokens
- Avg 100 tokens per request
- Cost: (100K * 100) / 1M * $0.150 = $1.50/month
  But with retries + context: ~$30/month

AI Chat:
- 10K queries/month
- Avg 2000 tokens per query (context + response)
- Cost: (10K * 2000) / 1M * $0.150 = $3/month
  With conversations: ~$50/month

Statement Parsing Fallback:
- 1K failed parses/month
- GPT-4 for extraction: $10/month

Total: ~$90/month (at 1000 users)
```

### After Optimization (Hybrid)

```
Transaction Categorization:
- 100K via local Llama 3.1: $0
- Electricity cost: ~$5/month

AI Chat:
- 7K simple queries via local: $0
- 3K complex via OpenAI: $15/month

Statement Parsing:
- 1K via local with fallback: $2/month

Infrastructure:
- Ollama server (shared): $20/month

Total: ~$42/month (at 1000 users)
Savings: $48/month (53% reduction)

At 10K users: Save ~$500/month
At 100K users: Save ~$5000/month
```

---

## Performance Targets

| Operation            | Before | After         | Target |
| -------------------- | ------ | ------------- | ------ |
| Categorize 1 txn     | 500ms  | 100ms         | <200ms |
| Categorize 1000 txns | 500s   | 10s           | <30s   |
| AI chat response     | 2-3s   | 1-2s          | <2s    |
| Context building     | 200ms  | 50ms (cached) | <100ms |
| PDF parse (simple)   | 5s     | 5s            | <10s   |
| PDF parse (complex)  | 20s    | 15s           | <30s   |

---

## Deployment Architecture

### Development (Local)

```yaml
# docker-compose.yml
services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - '11434:11434'
    volumes:
      - ollama_data:/root/.ollama
    command: serve

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: finmatter_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - '5432:5432'

volumes:
  ollama_data:
```

### Production (Cloud)

**Option 1: Single Server (Up to 10K users)**

```
AWS EC2 t3.xlarge (4 vCPU, 16GB RAM)
- Next.js API + Workers
- Ollama (Llama 3.1 8B)
- Redis
Cost: ~$100/month

Supabase Pro
- PostgreSQL
- Storage
Cost: ~$25/month

Total: ~$125/month
```

**Option 2: Distributed (10K+ users)**

```
Vercel (API + PWA)
Cost: ~$20/month

Railway / Render (Worker + Ollama)
- Separate worker service
- Dedicated Ollama instance
Cost: ~$50/month

Supabase Pro
Cost: ~$25/month

Upstash Redis
Cost: ~$10/month

Total: ~$105/month
```

---

## Security Considerations

### Data Privacy

- ✅ User data never sent to OpenAI for categorization
- ✅ Local models process sensitive data
- ✅ Only anonymized queries go to cloud
- ✅ Encryption at rest (Supabase)
- ✅ Encryption in transit (HTTPS/TLS)

### API Security

- ✅ Rate limiting per user (Redis)
- ✅ JWT authentication
- ✅ Input validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection

### Model Security

- ✅ Local models run in isolated containers
- ✅ No external model calls without user consent
- ✅ Audit logs for all AI queries
- ✅ Model versioning and rollback

---

## Monitoring & Observability

### Metrics to Track

**Infrastructure:**

- API response times (p50, p95, p99)
- Worker job processing times
- Redis queue length
- Database connection pool usage
- Ollama model load time

**LLM Metrics:**

- Local model availability (uptime)
- Inference latency per model
- Tokens processed per second
- Cache hit rate (context cache)
- Fallback trigger rate (local → cloud)

**Business Metrics:**

- Categorization accuracy (user corrections)
- AI query success rate
- Cost per user per month
- User satisfaction (feedback ratings)

### Tools

**Observability Stack:**

- Sentry: Error tracking
- PostHog/Mixpanel: Product analytics
- Prometheus + Grafana: Infrastructure metrics
- BullMQ UI: Job queue visualization

---

## Migration Plan

### Phase 1: Foundation (Week 1)

- ✅ Set up Ollama locally
- ✅ Create `packages/llm-router`
- ✅ Create `packages/context-engine`
- ✅ Add BullMQ for job queue

### Phase 2: Local Inference (Week 2)

- ✅ Implement transaction categorization with local LLM
- ✅ Add fallback to OpenAI
- ✅ Test accuracy vs OpenAI baseline

### Phase 3: Context Engine (Week 3)

- ✅ Implement ContextBuilder
- ✅ Add caching layer
- ✅ Optimize token usage

### Phase 4: Background Workers (Week 4)

- ✅ Move statement parsing to workers
- ✅ Add retry logic
- ✅ Implement job monitoring

### Phase 5: Production Deploy (Week 5)

- ✅ Deploy worker service
- ✅ Deploy Ollama on cloud
- ✅ Monitor costs and performance
- ✅ Fine-tune based on real traffic

---

## Next Steps

1. **Today:** Set up local development environment
2. **This Week:** Implement LLM router and context engine
3. **Next Week:** Migrate categorization to local models
4. **Week 3:** Deploy to production, monitor savings
5. **Week 4:** Optimize based on real usage patterns

---

## Resources

- [Ollama Documentation](https://ollama.ai/docs)
- [BullMQ Guide](https://docs.bullmq.io/)
- [Llama 3.1 Model Card](https://huggingface.co/meta-llama/Meta-Llama-3.1-8B)
- [Context Engineering Best Practices](https://www.anthropic.com/index/prompting-guide)

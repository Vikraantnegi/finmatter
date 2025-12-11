# Environment Variables Setup for API

## LLM Configuration

The API uses the `@finmatter/cc-engine` package which supports both OpenAI and Ollama for LLM-based metadata extraction.

### Required Environment Variables

Add these to your `.env.local` file in the `apps/api` directory:

```bash
# Option 1: Use OpenAI (Cloud-based)
OPENAI_API_KEY=sk-your-openai-api-key-here
USE_LLM_FALLBACK=true

# Option 2: Use Ollama (Local LLM)
USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434  # Optional, defaults to localhost:11434
USE_LLM_FALLBACK=true

# Option 3: Use both (Ollama preferred, OpenAI fallback)
USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434
OPENAI_API_KEY=sk-your-openai-api-key-here  # Fallback if Ollama fails
USE_LLM_FALLBACK=true
```

### Priority Order

The system will use LLM providers in this order:

1. **Ollama** (if `USE_OLLAMA=true` or `OLLAMA_BASE_URL` is set)
2. **OpenAI** (if `OPENAI_API_KEY` is set)
3. **Regex only** (if no LLM is configured)

### Setup Instructions

#### For Development (Local)

1. Create `.env.local` in `apps/api/`:

   ```bash
   cd apps/api
   touch .env.local
   ```

2. Add your configuration:

   ```bash
   # For Ollama (recommended for local dev)
   USE_OLLAMA=true
   OLLAMA_BASE_URL=http://localhost:11434
   USE_LLM_FALLBACK=true

   # OR for OpenAI
   OPENAI_API_KEY=sk-your-key-here
   USE_LLM_FALLBACK=true
   ```

3. Restart your Next.js dev server:
   ```bash
   pnpm dev
   ```

#### For Production

Set these as environment variables in your hosting platform:

**Vercel:**

- Go to Project Settings → Environment Variables
- Add: `USE_OLLAMA`, `OLLAMA_BASE_URL`, `OPENAI_API_KEY`, `USE_LLM_FALLBACK`

**Docker:**

```dockerfile
ENV USE_OLLAMA=true
ENV OLLAMA_BASE_URL=http://ollama:11434
ENV USE_LLM_FALLBACK=true
```

**Kubernetes:**

```yaml
env:
  - name: USE_OLLAMA
    value: 'true'
  - name: OLLAMA_BASE_URL
    value: 'http://ollama-service:11434'
  - name: USE_LLM_FALLBACK
    value: 'true'
```

### Testing Your Setup

1. **Check if variables are loaded:**

   ```bash
   # In your API code, you can log:
   console.log('Ollama:', process.env.USE_OLLAMA);
   console.log('OpenAI Key:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
   ```

2. **Test Ollama connection** (if using Ollama):

   ```bash
   curl http://localhost:11434/api/tags
   ```

3. **Upload a statement** and check logs for:
   - `🔄 [HDFC Parser] Using LLM fallback...` = LLM is working ✅
   - `⚠️ [LLM Extractor] No API key provided...` = LLM not configured ❌

### Current API Usage

The API route (`apps/api/src/app/api/statements/upload/route.ts`) automatically:

- Detects which LLM provider to use based on environment variables
- Passes the configuration to `parseStatement()` from `@finmatter/cc-engine`
- Falls back gracefully if LLM is not available

### Notes

- **`.env.local`** is gitignored (safe for secrets)
- **`.env.example`** should be created to document required variables (without values)
- Environment variables are loaded at server startup
- Changes require server restart to take effect

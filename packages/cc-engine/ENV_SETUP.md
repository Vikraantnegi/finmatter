# Environment Variables Setup for Parser Testing

## 🚨 Quick Fix: Use .env File (Easiest Method)

**The easiest way is to create a `.env` file!**

1. **Create `.env` file** in `packages/cc-engine/`:

   ```bash
   cd packages/cc-engine
   # Create the file
   ```

2. **Add your configuration**:

   ```bash
   # For Ollama (recommended)
   USE_OLLAMA=true
   OLLAMA_BASE_URL=http://localhost:11434

   # OR for OpenAI
   OPENAI_API_KEY=sk-your-key-here
   ```

3. **Run your script** - it will automatically load from `.env`:
   ```bash
   pnpm parsers:improve
   ```

**That's it!** The scripts now automatically load from `.env` file.

---

## Alternative Methods (If .env doesn't work)

### Method 1: PowerShell (Current Session Only)

**Important:** Set variables **BEFORE** running the command, in the **same terminal**:

```powershell
# Set variables
$env:USE_OLLAMA = "true"
$env:OLLAMA_BASE_URL = "http://localhost:11434"

# Verify they're set
Write-Host "Ollama: $env:USE_OLLAMA"
Write-Host "URL: $env:OLLAMA_BASE_URL"

# THEN run the script (in the same terminal!)
cd packages/cc-engine
pnpm parsers:improve
```

**Common mistake:** Setting variables in one terminal and running script in another - they won't be available!

### Method 2: Bash (Current Session Only)

```bash
# Set variables
export USE_OLLAMA=true
export OLLAMA_BASE_URL=http://localhost:11434

# Verify
echo "Ollama: $USE_OLLAMA"
echo "URL: $OLLAMA_BASE_URL"

# THEN run (in same terminal!)
cd packages/cc-engine
pnpm parsers:improve
```

### Method 3: Inline with Command (PowerShell)

```powershell
# Set and run in one command
$env:USE_OLLAMA="true"; $env:OLLAMA_BASE_URL="http://localhost:11434"; cd packages/cc-engine; pnpm parsers:improve
```

### Method 4: Inline with Command (Bash)

```bash
# Set and run in one command
USE_OLLAMA=true OLLAMA_BASE_URL=http://localhost:11434 pnpm parsers:improve
```

### Method 5: Debug Mode (See what's loaded)

Add `DEBUG_ENV=true` to see what environment variables are being read:

```bash
# In .env file or shell:
DEBUG_ENV=true

# Then run:
pnpm parsers:improve

# You'll see:
# 🔍 Environment Variables Debug:
#    USE_OLLAMA: true
#    OLLAMA_BASE_URL: http://localhost:11434
#    OPENAI_API_KEY: Not set
```

---

## Troubleshooting

### Variables not working?

1. **Check if they're actually set:**

   ```powershell
   # PowerShell
   Write-Host "USE_OLLAMA: $env:USE_OLLAMA"
   ```

2. **Use debug mode:**

   ```bash
   DEBUG_ENV=true pnpm parsers:improve
   ```

3. **Check .env file location:**
   - Must be in `packages/cc-engine/.env` (not root!)
   - File name is exactly `.env` (not `.env.local` or `.env.example`)

4. **Restart terminal** after setting system-wide variables

5. **Check if dotenv is installed:**
   ```bash
   cd packages/cc-engine
   pnpm list dotenv
   ```

### Still not working?

**Use the .env file method** - it's the most reliable! The scripts now automatically load from `.env` file in `packages/cc-engine/` directory.

---

## For API (Different Location!)

**API uses different location:** `apps/api/.env.local`

See `apps/api/ENV_SETUP.md` for API-specific instructions.

---

## Summary

✅ **Best method:** Create `packages/cc-engine/.env` file  
✅ **Alternative:** Set in same terminal session before running  
✅ **Debug:** Use `DEBUG_ENV=true` to see what's loaded  
❌ **Don't:** Set in one terminal, run in another

## Git Workflow

### Branch Strategy
```
main (production-ready)
├── develop (active development)
│   ├── feature/card-portfolio
│   ├── feature/pdf-parser
│   ├── feature/optimizer
│   └── feature/ai-assistant
```

### Commit Messages
```
feat: Add card portfolio CRUD API
fix: PDF parser failing on ICICI statements
refactor: Extract reward calculation to separate service
docs: Add setup instructions for local development
test: Add unit tests for card optimizer
```

---

### Environment Variables

`.env.local` in apps/api:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
REDIS_URL=
```

`.env` in apps/mobile:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
API_URL=http://localhost:3000
```

---

## Cursor AI Tips for Maximum Productivity

### 1. Request Complete Code
```
Add to every prompt:
"Generate complete, production-ready code with no TODOs or placeholders.
Include all imports, error handling, and TypeScript types."
```

### 2. Iterate in Small Steps
```
Instead of "Build the entire card optimizer":
1. "Create the reward calculation function"
2. "Add tests for reward calculation"
3. "Create the optimizer function using the calculator"
4. "Create the API endpoint"
5. "Create the mobile UI"
```

---

## Always run all the systems, and check if everything's working fine, nothings broken, all the connections are working fine! Look for all TS issues too, before committing to git.

## Always before starting to code, let me know what you are planning, a small doc should be fine, and then after you are done, share another small doc stating what you did.

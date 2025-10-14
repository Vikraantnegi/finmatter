## 🎯 Your Database Commands

Now you have these handy commands:

```bash
# Staging database
pnpm db:push:staging    # Push new migrations to staging
pnpm db:reset:staging   # Reset staging database (safe)
pnpm db:link:staging    # Link to staging project

# Production database
pnpm db:push:prod       # Push new migrations to production
pnpm db:reset:prod      # ⚠️ DANGER: Resets production!
pnpm db:link:prod       # Link to production project

# Local Supabase
pnpm supabase:start     # Start local Supabase
pnpm supabase:stop      # Stop local Supabase
pnpm supabase:status    # Check status
```

## 🔄 Your Workflow Going Forward

```bash
# 1. Develop feature locally
git checkout -b feature/new-feature
pnpm dev:api
pnpm dev:pwa

# 2. Create migration if needed
pnpm db:migration:new add_new_feature

# 3. Merge to staging and deploy
git checkout staging
git merge feature/new-feature
pnpm db:push:staging
git push origin staging  # Auto-deploys to staging

# 4. Test on staging thoroughly

# 5. When ready, deploy to production
git checkout main
git merge staging
pnpm db:push:prod  # Push migrations to prod first!
git push origin main  # Auto-deploys to production
```

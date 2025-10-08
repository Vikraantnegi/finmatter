# FinMatter Deployment Guide

## 🚀 Quick Start

### Local Development

1. **Start the API server:**
   ```bash
   cd /Users/vikrantnegi/finmatter
   pnpm dev:api
   ```
   API will be available at `http://localhost:3000`

2. **Start the PWA:**
   ```bash
   cd /Users/vikrantnegi/finmatter
   pnpm dev:pwa
   ```
   PWA will be available at `http://localhost:3001`

3. **Access the app:**
   - Open `http://localhost:3001` in your browser
   - Login with phone number
   - OTP will be sent via Supabase/Twilio

## 📦 Production Deployment

### Prerequisites

- Vercel account
- Supabase project
- Domain name (optional)

### Deploy API Server

1. **Navigate to API directory:**
   ```bash
   cd apps/api
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

3. **Set environment variables in Vercel:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY` (optional)

4. **Note the deployment URL** (e.g., `https://api.finmatter.com`)

### Deploy Web PWA

1. **Navigate to PWA directory:**
   ```bash
   cd apps/web-pwa
   ```

2. **Update environment variables:**
   Create `.env.production`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_API_BASE_URL=https://api.finmatter.com
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

4. **Set environment variables in Vercel:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_BASE_URL`

5. **Note the deployment URL** (e.g., `https://app.finmatter.com`)

## 🔐 Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Run Migrations

```bash
cd /Users/vikrantnegi/finmatter
npx supabase db push
```

### 3. Configure Authentication

1. Go to Authentication > Providers
2. Enable Phone authentication
3. Configure Twilio:
   - Add Twilio Account SID
   - Add Twilio Auth Token
   - Add Twilio Phone Number

### 4. Set up RLS Policies

All policies are already defined in migrations. Verify:
- `users` table has RLS enabled
- `cards` table has RLS enabled
- Policies allow users to access only their own data

## 🌐 Domain Configuration

### Custom Domain for API

1. In Vercel, go to API project settings
2. Add domain: `api.finmatter.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com
   ```

### Custom Domain for PWA

1. In Vercel, go to PWA project settings
2. Add domain: `app.finmatter.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

## 📱 PWA Installation

### Mobile (iOS/Android)

1. Open `https://app.finmatter.com` in browser
2. Tap "Share" (iOS) or menu (Android)
3. Select "Add to Home Screen"
4. App icon will appear on home screen

### Desktop (Chrome/Edge)

1. Open `https://app.finmatter.com`
2. Click install icon in address bar
3. App will open in standalone window

## 🧪 Testing Deployment

### API Health Check

```bash
curl https://api.finmatter.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-08T..."
}
```

### PWA Access

1. Open `https://app.finmatter.com`
2. Should redirect to login page
3. Enter phone number
4. Verify OTP is sent
5. Complete login
6. Should see dashboard

## 🔧 Environment Variables

### API Server

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | No |

### Web PWA

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `NEXT_PUBLIC_API_BASE_URL` | API server URL | Yes |

## 🐛 Troubleshooting

### OTP Not Sending

1. Check Twilio configuration in Supabase
2. Verify phone number format (+91XXXXXXXXXX)
3. Check Twilio account balance
4. Review Supabase logs

### API Connection Error

1. Verify `NEXT_PUBLIC_API_BASE_URL` is correct
2. Check CORS settings in API
3. Verify API is deployed and running
4. Check browser console for errors

### Authentication Issues

1. Clear browser cache and cookies
2. Check Supabase auth settings
3. Verify RLS policies
4. Check session storage

### Build Errors

1. Run `pnpm clean` in root
2. Delete `node_modules` and `.next`
3. Run `pnpm install`
4. Try build again

## 📊 Monitoring

### Vercel Analytics

- Enable in Vercel dashboard
- Track page views, performance
- Monitor errors

### Supabase Logs

- Check Auth logs for OTP issues
- Review Database logs for queries
- Monitor API usage

### Error Tracking (Optional)

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- PostHog for analytics

## 🔄 Continuous Deployment

### GitHub Integration

1. Connect Vercel to GitHub
2. Push to `main` branch
3. Auto-deploy to production
4. Push to `dev` branch for preview

### Deployment Workflow

```
Local Development → Git Push → Vercel Build → Deploy
```

## 📝 Post-Deployment Checklist

- [ ] API is accessible and responding
- [ ] PWA loads correctly
- [ ] Authentication works (OTP send/verify)
- [ ] Card management works (add/edit/delete)
- [ ] Portfolio stats display correctly
- [ ] Responsive design works on mobile
- [ ] PWA can be installed
- [ ] Custom domains configured
- [ ] SSL certificates active
- [ ] Environment variables set
- [ ] Monitoring enabled
- [ ] Error tracking configured

## 🎉 Success!

Your FinMatter PWA is now deployed and ready for users!

### Next Steps

1. Test all features thoroughly
2. Invite beta users
3. Gather feedback
4. Iterate and improve
5. Add more features

---

**Need help?** Check the [README](./README.md) or [Migration Summary](./MIGRATION_SUMMARY.md)

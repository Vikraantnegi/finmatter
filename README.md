# FinMatter

A personal finance super app designed to help users optimize credit card usage, track spending, and receive AI-powered financial insights through an intuitive web experience.

## 🎉 **NEW: Migrated to Next.js PWA!**

We've successfully migrated from React Native to a Next.js Progressive Web App for better stability, performance, and developer experience. See [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) for details.

## 🏗️ Architecture

This is a monorepo built with pnpm workspaces containing:

- **Web PWA** (`apps/web-pwa`): Next.js 14 Progressive Web App with TypeScript
- **API Server** (`apps/api`): Next.js 14 with App Router
- **Admin Panel** (`apps/web`): Next.js 14 web application
- **Shared Packages** (`packages/`):
  - `@finmatter/types`: Shared TypeScript types
  - `@finmatter/shared`: Shared utilities and constants
  - `@finmatter/ui`: Shared UI components
  - `@finmatter/cc-engine`: Credit card optimization logic

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd finmatter
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Setup environment variables**

   ```bash
   # API Server
   cp apps/api/.env.example apps/api/.env.local

   # Web PWA
   cp apps/web-pwa/.env.example apps/web-pwa/.env.local

   # Fill in your actual values
   ```

4. **Start development servers**

   ```bash
   # Start all apps
   pnpm dev

   # Or start individually
   pnpm --filter api dev        # API server on http://localhost:3000
   pnpm --filter web-pwa dev    # PWA on http://localhost:3001
   ```

## 📱 Web PWA

The main user-facing application is a Progressive Web App built with Next.js 14.

### Features

- ✅ **Phone-based OTP Authentication**
- ✅ **Credit Card Management** with visual cards
- ✅ **Portfolio Dashboard** with statistics
- ✅ **Two-step Card Addition** (Bank → Card → Form)
- ✅ **Card Metadata** for TOP 21 Indian credit cards
- ✅ **Responsive Design** (Mobile, Tablet, Desktop)
- ✅ **PWA Support** (Installable, Offline-capable)
- ✅ **Real-time Updates**
- 🚧 **Transaction Tracking** (Coming soon)
- 🚧 **AI-powered Insights** (Coming soon)
- 🚧 **Reward Optimization** (Coming soon)

### Development

```bash
cd apps/web-pwa
pnpm dev      # Development server
pnpm build    # Production build
pnpm start    # Production server
pnpm lint     # Lint code
```

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Auth**: Supabase
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 🛠️ API Server

Backend API built with Next.js 14 API routes.

### Endpoints

- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/cards` - Get user's cards
- `POST /api/cards` - Create new card
- `GET /api/cards/:id` - Get card details
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card

### Development

```bash
cd apps/api
pnpm dev      # Development server
pnpm build    # Production build
```

## 🏛️ Project Structure

```
finmatter/
├── apps/
│   ├── web-pwa/         # Next.js PWA (main app)
│   ├── api/             # Next.js API server
│   ├── web/             # Next.js admin panel
│   └── mobile/          # [DEPRECATED] React Native app
├── packages/
│   ├── types/           # Shared TypeScript types
│   ├── shared/          # Shared utilities
│   ├── ui/              # Shared UI components
│   └── cc-engine/       # Credit card optimization
├── supabase/            # Database migrations
│   └── migrations/      # SQL migration files
├── MIGRATION_SUMMARY.md # Migration documentation
└── package.json         # Root workspace config
```

## 🔧 Configuration

### Environment Variables

#### API Server (`apps/api/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key
```

#### Web PWA (`apps/web-pwa/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

## 📦 Building for Production

```bash
# Build all applications
pnpm build

# Build specific application
pnpm --filter web-pwa build
pnpm --filter api build
```

## 🚀 Deployment

### Web PWA (Vercel)

```bash
cd apps/web-pwa
vercel --prod
```

### API Server (Vercel)

```bash
cd apps/api
vercel --prod
```

### PWA Features

- **Installable**: Add to home screen on mobile/desktop
- **Offline**: Service worker for offline support
- **Fast**: Optimized with Next.js
- **Responsive**: Works on all screen sizes
- **Secure**: HTTPS required for PWA features

## 🗄️ Database

Using Supabase (PostgreSQL) with migrations in `supabase/migrations/`.

### Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
npx supabase start

# Apply migrations
npx supabase db push
```

### Tables

- `users` - User profiles
- `cards` - Credit cards
- `transactions` - Transaction history
- `goals` - Financial goals
- `statements` - Uploaded statements

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter web-pwa test
```

## 📝 Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all applications
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm clean` - Clean all build artifacts

## 🔗 Links

- [Migration Summary](./MIGRATION_SUMMARY.md)
- [Product Requirements Document](./PRD.md)
- [Development Plan](./dev_plan.md)
- [API Documentation](./docs/api.md) (coming soon)

## 🎯 Roadmap

### Phase 1: Core Features (Current)

- ✅ Authentication (Phone OTP)
- ✅ Card Management
- ✅ Portfolio Dashboard
- ✅ Card Metadata Integration

### Phase 2: Transactions

- [ ] Transaction tracking
- [ ] Statement upload
- [ ] Auto-categorization
- [ ] Spending analytics

### Phase 3: Optimization

- [ ] Card optimizer
- [ ] Reward calculator
- [ ] Best card recommendations
- [ ] Spending insights

### Phase 4: AI Features

- [ ] AI chat assistant
- [ ] Smart notifications
- [ ] Predictive analytics
- [ ] Personalized tips

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📄 License

[Your License Here]

---

**Built with ❤️ for better personal finance management**

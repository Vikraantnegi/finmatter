# FinMatter

A personal finance super app designed to help users optimize credit card usage, track spending, and receive AI-powered financial insights through an intuitive mobile experience.

## 🏗️ Architecture

This is a monorepo built with Turborepo containing:

- **Mobile App** (`apps/mobile`): React Native CLI with TypeScript
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
- React Native development environment
- Supabase account
- OpenAI API key

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
   # Copy environment files
   cp apps/api/.env.example apps/api/.env.local
   cp apps/mobile/.env.example apps/mobile/.env
   cp apps/web/.env.example apps/web/.env.local
   
   # Fill in your actual values
   ```

4. **Start development servers**
   ```bash
   # Start all apps
   pnpm dev:all
   
   # Or start individually
   pnpm dev:api    # API server on http://localhost:3000
   pnpm dev:web    # Web app on http://localhost:3001
   pnpm dev:mobile # React Native app
   ```

## 📱 Development

### Mobile App

```bash
cd apps/mobile
pnpm android  # Run on Android
pnpm ios      # Run on iOS
```

### API Server

```bash
cd apps/api
pnpm dev      # Development server
pnpm build    # Production build
```

### Web Admin Panel

```bash
cd apps/web
pnpm dev      # Development server
pnpm build    # Production build
```

## 🛠️ Available Scripts

- `pnpm dev` - Start all development servers
- `pnpm build` - Build all applications
- `pnpm lint` - Lint all packages
- `pnpm type-check` - Type check all packages
- `pnpm clean` - Clean all build artifacts

## 🏛️ Project Structure

```
finmatter/
├── apps/
│   ├── mobile/          # React Native mobile app
│   ├── api/             # Next.js API server
│   └── web/             # Next.js admin panel
├── packages/
│   ├── types/           # Shared TypeScript types
│   ├── shared/          # Shared utilities
│   ├── ui/              # Shared UI components
│   └── cc-engine/       # Credit card optimization
├── supabase/            # Database migrations (future)
└── package.json         # Root workspace config
```

## 🔧 Configuration

### Environment Variables

#### API Server (`apps/api/.env.local`)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_api_key
```

#### Mobile App (`apps/mobile/.env`)
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
API_URL=http://localhost:3000
```

#### Web App (`apps/web/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 📦 Building for Production

```bash
# Build all applications
pnpm build

# Build specific application
cd apps/mobile && pnpm build:android
cd apps/mobile && pnpm build:ios
cd apps/api && pnpm build
cd apps/web && pnpm build
```

## 🚀 Deployment

### API Server (Vercel)
```bash
cd apps/api
vercel --prod
```

### Web App (Vercel)
```bash
cd apps/web
vercel --prod
```

### Mobile App
- **iOS**: Build and upload to App Store Connect
- **Android**: Build and upload to Google Play Console

## 🔗 Links

- [Product Requirements Document](./PRD.md)
- [Development Plan](./dev_plan.md)
- [API Documentation](./docs/api.md) (coming soon)
- [Mobile App Guide](./docs/mobile.md) (coming soon)

---

**Built with ❤️ for better personal finance management**
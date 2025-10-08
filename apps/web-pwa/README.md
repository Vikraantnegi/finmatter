# FinMatter Web PWA

A Progressive Web App for managing credit cards, tracking expenses, and optimizing rewards.

## 🚀 Features

- ✅ **Phone-based OTP Authentication**
- ✅ **Credit Card Management** with visual cards
- ✅ **Portfolio Dashboard** with real-time statistics
- ✅ **Two-step Card Addition** (Bank → Card → Form)
- ✅ **Card Metadata Integration** for TOP 21 Indian credit cards
- ✅ **Responsive Design** (Mobile, Tablet, Desktop)
- ✅ **PWA Support** (Installable, Offline-capable)
- ✅ **Real-time Updates** with Zustand
- 🚧 **Transaction Tracking** (Coming soon)
- 🚧 **AI-powered Insights** (Coming soon)

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Authentication**: Supabase
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **OTP Input**: React OTP Input

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Phone input
│   │   └── verify-otp/    # OTP verification
│   ├── dashboard/         # Main dashboard
│   ├── cards/             # Card management
│   │   ├── add/           # Add card flow
│   │   └── [id]/          # Card details (TODO)
│   ├── transactions/      # Transactions (TODO)
│   ├── settings/          # Settings (TODO)
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (redirects)
│   └── globals.css        # Global styles
├── components/
│   ├── auth/              # Auth components
│   ├── cards/             # Card components
│   │   ├── CardGrid.tsx
│   │   ├── CardStats.tsx
│   │   ├── CreditCardVisual.tsx
│   │   └── PortfolioStats.tsx
│   ├── forms/             # Form inputs
│   │   └── PhoneInput.tsx
│   ├── layout/            # Layout components
│   │   └── DashboardLayout.tsx
│   ├── providers/         # Context providers
│   │   └── Providers.tsx
│   └── ui/                # UI primitives
│       ├── Button.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── cc-engine/         # Card engine (copied from packages)
│   ├── shared/            # Shared utils (copied from packages)
│   ├── apiClient.ts       # API client with interceptors
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # Utility functions
├── services/
│   ├── authService.ts     # Auth API calls
│   └── cardService.ts     # Card API calls
├── stores/
│   ├── authStore.ts       # Auth state (Zustand)
│   └── cardStore.ts       # Card state (Zustand)
└── types/                 # Type definitions (copied from packages)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account

### Installation

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Setup environment variables**

   Create `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   ```

3. **Start development server**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3001](http://localhost:3001)

## 📦 Available Scripts

- `pnpm dev` - Start development server (with Turbopack)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Lint code
- `pnpm lint:fix` - Fix linting issues
- `pnpm type-check` - Type check

## 🎨 Design System

### Colors

- **Primary**: Blue (`#3b82f6`)
- **Secondary**: Gray (`#64748b`)
- **Success**: Green (`#22c55e`)
- **Warning**: Yellow (`#f59e0b`)
- **Error**: Red (`#ef4444`)

### Typography

- **Font**: Inter (Google Fonts)
- **Sizes**: Responsive scale (text-sm to text-3xl)

### Components

All components follow a consistent design pattern:
- Cards with shadow and hover effects
- Gradient backgrounds for visual cards
- Smooth transitions (200-300ms)
- Loading states for async operations
- Error states with clear messaging

## 🔐 Authentication Flow

1. User enters phone number
2. OTP sent via Supabase (Twilio integration)
3. User enters 6-digit OTP
4. Session created and stored
5. Redirect to dashboard

## 💳 Card Management Flow

### Adding a Card

1. **Bank Selection**: Choose from TOP 21 Indian banks
2. **Card Selection**: Pick specific card or manual entry
3. **Form Filling**: Enter card details (auto-filled if selected)
4. **Submission**: Card saved with metadata

### Card Display

- Visual card with gradient colors
- Card stats (limit, used, available, utilization)
- Progress bar for usage
- Quick actions (edit, transactions)

## 📱 PWA Features

### Manifest

- Installable on mobile and desktop
- Custom app icon
- Standalone display mode
- Theme color: `#3b82f6`

### Service Worker (TODO)

- Offline support
- Cache strategies
- Background sync
- Push notifications

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

### Environment Variables

Set these in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_BASE_URL`

### Build Output

```bash
pnpm build
```

Output: `.next/` directory

## 🔧 Configuration

### Next.js Config

```js
// next.config.js
module.exports = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
};
```

### Tailwind Config

Custom colors, animations, and utilities defined in `tailwind.config.js`.

### TypeScript Config

Strict mode enabled with path aliases:
- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/lib/*` → `./src/lib/*`

## 📝 API Integration

### API Client

Axios-based client with:
- Request/response interceptors
- Auto token injection
- Error handling
- Logging

### Services

- **authService**: OTP send/verify, signout
- **cardService**: CRUD operations for cards

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Authentication
- ✅ Card management
- ✅ Portfolio dashboard

### Phase 2
- [ ] Transaction tracking
- [ ] Statement upload
- [ ] Spending analytics

### Phase 3
- [ ] Card optimizer
- [ ] Reward calculator
- [ ] Best card recommendations

### Phase 4
- [ ] AI chat assistant
- [ ] Smart notifications
- [ ] Predictive analytics

## 🐛 Known Issues

- [ ] OTP input autofocus on mobile
- [ ] Card gradient colors on Safari
- [ ] Service worker implementation

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and type checking
4. Submit a pull request

## 📄 License

[Your License Here]

---

**Built with ❤️ using Next.js 14 and Tailwind CSS**
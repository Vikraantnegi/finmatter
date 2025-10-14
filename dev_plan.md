## Week 0: Monorepo Setup (Day 1-2)

### Cursor Prompt 1: Initialize Monorepo

```
Create a monorepo structure using Turborepo with the following:

apps/
  - web-pwa: Web PWA project with TypeScript
  - api: Next.js 14 with App Router for API routes

packages/
  - shared: Shared utilities and constants
  - types: Shared TypeScript types
  - cc-engine: Credit card optimization logic

Setup:
- Use pnpm workspaces
- Configure path aliases (@finmatter/shared, @finmatter/types, etc.)
- Add ESLint and Prettier configs
- Setup TypeScript with strict mode
- Add turbo.json for build pipeline
- Create .env.example files for each app

Include scripts in root package.json:
- dev:pwa, dev:api, dev:all
- build, lint, type-check
```

### Cursor Prompt 2: Supabase + Auth Setup

```
Setup Supabase for the project with PHONE AUTHENTICATION:

1. Initialize Supabase project structure in /supabase
2. Create initial migration for users table with:
   - id (uuid, primary key)
   - phone_number (text, unique, not null)
   - created_at (timestamp)
   - last_login (timestamp)
   - biometric_enabled (boolean, default false)

3. Enable Phone Auth in Supabase:
   - Go to Authentication > Providers
   - Enable Phone provider
   - Configure SMS provider (Twilio or MessageBird)
   - Set OTP expiry to 5 minutes

4. In apps/api, setup Supabase client:
   - Create lib/supabase/client.ts with server client
   - Create endpoints:
     - POST /api/auth/send-otp (accepts phone_number)
     - POST /api/auth/verify-otp (accepts phone_number, otp)
   - Add rate limiting (3 OTP per 10 mins per phone)

5. In apps/web-pwa, setup Supabase:
   - Install @supabase/supabase-js
   - Create src/lib/supabase.ts with web client
   - Setup secure storage for auth token using browser storage

6. Add types for auth in packages/types/auth.ts
```

---

## Week 1-2: Feature 1 - Auth + Card Portfolio

### Cursor Prompt 3: Web PWA Auth Flow

```
Build authentication flow in Next.js PWA using PHONE + OTP:

1. Create screens:
   - src/screens/auth/PhoneInputScreen.tsx
     - Phone number input with country code (+91 default)
     - Format: +91 XXXXX XXXXX
     - Validate 10-digit Indian number
     - "Send OTP" button

   - src/screens/auth/OTPVerificationScreen.tsx
     - 6-digit OTP input (auto-focus each digit)
     - Resend OTP option (disabled for 30 seconds)
     - Auto-verify when 6 digits entered

   - src/screens/auth/BiometricSetupScreen.tsx
     - After OTP verified, offer biometric setup
     - Skip option available

2. Backend implementation:
   - Use Supabase Auth with Phone provider
   - OR use third-party: MSG91, Twilio, AWS SNS
   - Store: phone_number in users table (primary identifier)
   - Rate limiting: Max 3 OTP requests per 10 minutes per number

3. Flow:
   - User enters phone → API sends OTP via SMS
   - User enters OTP → API verifies → Create/login user
   - Store auth token securely (browser storage / cookies)
   - Setup biometric for future logins (if supported)

4. Biometric re-authentication:
   - After first login, always use biometric
   - Fallback to OTP if biometric fails
   - Re-verify with OTP every 30 days (security)

5. Design:
   - Large, clear phone input
   - OTP boxes with animation
   - Loading states during verification
   - Error states (invalid OTP, expired, etc.)

Use react-native-otp-input for OTP UI.
Implement proper error handling and retry logic.
```

### Cursor Prompt 4: Card Portfolio Management (Database)

```
Create database schema for credit card portfolio:

1. Supabase migration for tables:

cards table:
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- bank_name (text)
- card_name (text)
- last_four_digits (text, encrypted)
- card_type (enum: credit, debit)
- network (enum: visa, mastercard, rupay, amex)
- reward_type (enum: cashback, points, miles)
- annual_fee (numeric)
- created_at (timestamp)
- is_active (boolean)

card_benefits table:
- id (uuid, primary key)
- card_id (uuid, foreign key)
- category (text) // dining, shopping, fuel, etc.
- reward_rate (numeric) // e.g., 5% or 5 points per 100
- reward_cap (numeric, nullable)
- conditions (jsonb, nullable)

2. Create API endpoints in apps/api:
   - POST /api/cards - Add new card
   - GET /api/cards - Get user's cards
   - PUT /api/cards/:id - Update card
   - DELETE /api/cards/:id - Soft delete card
   - POST /api/cards/:id/benefits - Add card benefits

3. Add RLS (Row Level Security) policies in Supabase
4. Create TypeScript types in packages/types/cards.ts
```

### Cursor Prompt 5: Card Portfolio UI (Web PWA)

```
Build card portfolio screens in React Native:

1. Create screens:
   - src/screens/cards/CardListScreen.tsx
     - Display all user's cards as cards (visual card UI)
     - Show last 4 digits (with toggle to hide/show)
     - Show active benefits summary
     - FAB button to add new card

   - src/screens/cards/AddCardScreen.tsx
     - Bank selection dropdown (HDFC, ICICI, SBI, Axis, etc.)
     - Card name input
     - Last 4 digits input
     - Card type and network selection
     - Reward type selection

   - src/screens/cards/CardDetailScreen.tsx
     - Full card details
     - Benefits breakdown by category
     - Edit/delete options
     - Usage stats (to be populated later)

2. Create components:
   - src/components/cards/CreditCardVisual.tsx
     - Animated card component with gradient based on bank
     - Flip animation to show/hide number

   - src/components/cards/BenefitItem.tsx
     - Display category + reward rate
     - Visual indicator (icon for category)

3. State management:
   - Create Zustand store for cards: src/stores/cardStore.ts
   - Implement CRUD operations calling API endpoints
   - Optimistic updates for better UX

4. Use react SWR for data fetching and caching

Design with NativeWind, smooth animations, haptic feedback on interactions.
```

---

## Week 2-3: Feature 2 - PDF Statement Parser

### Cursor Prompt 6: PDF Parser Service

```
Create a PDF parsing service in packages/cc-engine:

1. Create packages/cc-engine/src/parsers/index.ts
   - Base parser class with common logic
   - Individual parsers for banks:
     - HDFCParser.ts
     - ICICIParser.ts
     - SBIParser.ts
     - AxisParser.ts

2. Parsing logic:
   - Extract transaction data:
     - Date
     - Merchant name
     - Amount
     - Category (if mentioned)
   - Extract card details (last 4 digits, billing cycle)
   - Handle different PDF formats (text-based, OCR fallback)

3. Use libraries:
   - pdf-parse for text extraction
   - regex patterns for each bank's statement format
   - date-fns for date parsing

4. Return standardized transaction array:
   interface Transaction {
     date: Date;
     merchant: string;
     amount: number;
     category?: string;
     raw_text: string;
   }

5. Add tests for each parser with sample PDFs
6. Export main function: parseStatement(pdfBuffer, bankName)
```

### Cursor Prompt 7: PDF Upload API + Storage

```
Implement PDF upload and parsing in backend:

1. API endpoint in apps/api:
   - POST /api/statements/upload
   - Accept multipart/form-data
   - Parameters: PDF file, bank_name, card_id

2. Flow:
   - Validate file type (PDF only, max 5MB)
   - Upload to Supabase Storage (encrypted bucket)
   - Call parser from @finmatter/cc-engine
   - Store parsed transactions in database
   - Return transaction count and success status

3. Database migration for transactions table:
   - id (uuid, primary key)
   - user_id (uuid, foreign key)
   - card_id (uuid, foreign key)
   - date (date)
   - merchant_name (text)
   - amount (numeric)
   - category (text, nullable)
   - raw_text (text)
   - statement_id (uuid, foreign key)
   - created_at (timestamp)

4. Add statements table to track uploads:
   - id (uuid, primary key)
   - user_id (uuid, foreign key)
   - card_id (uuid, foreign key)
   - file_path (text)
   - upload_date (timestamp)
   - transaction_count (integer)
   - parsing_status (enum: pending, success, failed)

5. Implement background job for parsing (use Supabase Edge Functions or simple queue)
```

### Cursor Prompt 8: PDF Upload UI (Web PWA)

```
Build PDF upload flow in web app:

1. Create screens:
   - src/screens/statements/UploadStatementScreen.tsx
     - Card selection dropdown
     - File picker button (react-native-document-picker)
     - Upload progress indicator
     - Success/error state

   - src/screens/statements/StatementListScreen.tsx
     - List of uploaded statements
     - Show parse status, transaction count
     - Tap to view transactions

2. Implement file upload:
   - Use react-native-document-picker to select PDF
   - Show file size and name before upload
   - Upload with progress tracking (axios with onUploadProgress)
   - Handle errors (file too large, wrong format, parsing failed)

3. Add to navigation:
   - Add "Upload Statement" option in Card Detail screen
   - Add "Statements" tab in main navigation

4. State management:
   - Update cardStore with statement upload functions
   - Cache uploaded statements list

Use optimistic UI updates, show skeleton loaders during parsing.
```

---

## Week 3-4: Feature 3 - Transaction View & Categorization

### Cursor Prompt 9: Transaction Categorization Engine

```
Build transaction categorization in packages/cc-engine:

1. Create src/categorizer/index.ts with:
   - Merchant-to-category mapping (use common Indian merchants)
   - Keyword-based categorization
   - Default categories: Dining, Shopping, Groceries, Fuel, Travel, Entertainment, Bills, Healthcare, Others

2. Implement categorization logic:
   - Match merchant name against known merchants database
   - Use keywords if no exact match (e.g., "swiggy" → Dining)
   - Apply ML categorization using simple TF-IDF (optional for v1)
   - Allow manual override and learn from it

3. Add merchant database:
   - Create merchants.json with common Indian merchants
   - Format: { merchantName, category, aliases[] }
   - Include: Swiggy, Zomato, Amazon, Flipkart, IRCTC, BookMyShow, etc.

4. Export function: categorizeTransaction(merchantName: string): string

5. Add learning mechanism:
   - Store user corrections in database
   - Use them for future categorization
```

### Cursor Prompt 10: Transaction API & Database

```
Build transaction management APIs:

1. API endpoints in apps/api:
   - GET /api/transactions
     - Query params: start_date, end_date, card_id, category
     - Return paginated transactions
     - Include card info and category

   - PUT /api/transactions/:id/category
     - Allow manual category change
     - Store in user_category_corrections table for learning

   - GET /api/transactions/stats
     - Return spending by category
     - Return spending by card
     - Return month-over-month comparison

2. Add indexes to transactions table:
   - user_id + date
   - user_id + category
   - user_id + card_id

3. Create views for common queries:
   - monthly_spending_by_category
   - card_usage_stats

4. Implement caching with Redis for stats queries
```

### Cursor Prompt 11: Transaction List UI (Web PWA)

```
Build transaction viewing and management in web app:

1. Create screens:
   - src/screens/transactions/TransactionListScreen.tsx
     - Grouped by date (Today, Yesterday, This Week, etc.)
     - Show merchant, amount, category icon
     - Pull-to-refresh
     - Infinite scroll with react-query
     - Filter button (by card, category, date range)

   - src/screens/transactions/TransactionDetailScreen.tsx
     - Full transaction details
     - Change category (dropdown)
     - Show card used
     - Add notes (future)

   - src/screens/transactions/FilterScreen.tsx
     - Date range picker
     - Multi-select for categories
     - Multi-select for cards
     - Apply/reset filters

2. Create components:
   - src/components/transactions/TransactionItem.tsx
     - Merchant name, amount, category icon
     - Swipeable for quick actions

   - src/components/transactions/CategoryIcon.tsx
     - Icon mapping for each category
     - Use lucide-react-native

3. Add search functionality:
   - Search by merchant name
   - Debounced search with API call

4. State management:
   - Zustand store for transactions and filters
   - Optimistic updates for category changes

Design: Clean list view, smooth animations, clear typography.
```

---

## Week 4-5: Feature 4 - Credit Card Optimizer (Core Feature!)

### Cursor Prompt 12: Rewards Calculation Engine

```
Build the core CC optimization engine in packages/cc-engine:

1. Create src/optimizer/rewardsCalculator.ts:
   - Define reward rules structure:
     interface RewardRule {
       category: string;
       rewardType: 'cashback' | 'points' | 'miles';
       rewardRate: number;
       cap?: number;
       minTransaction?: number;
       conditions?: string[];
     }

   - Function: calculateReward(amount, category, cardRules): number
   - Handle different reward types (cashback %, points per 100, etc.)
   - Apply caps and conditions

2. Create src/optimizer/cardOptimizer.ts:
   - Function: getBestCard(amount, category, userCards[]): RecommendationResult
   - Compare all user's cards for the transaction
   - Return best card with reasoning
   - Include second-best option

   interface RecommendationResult {
     bestCard: Card;
     expectedReward: number;
     reasoning: string;
     alternatives: Array<{card: Card, reward: number}>;
   }

3. Create card rules database:
   - src/data/cardRules.ts
   - Hardcode rules for popular Indian cards:
     - HDFC Millennia (5% cashback on shopping, 1% others)
     - ICICI Amazon Pay (5% on Amazon, 2% others)
     - SBI SimplyCLICK (10X on dining, 5X others)
     - Axis Magnus (25 points per 200 on travel)
     - etc. (Add 15-20 popular cards)

4. Add tests for different scenarios
```

### Cursor Prompt 13: Card Optimizer API

```
Create card recommendation API:

1. API endpoint in apps/api:
   - POST /api/optimizer/recommend
   - Body: { amount: number, category: string }
   - Response: { bestCard, expectedReward, reasoning, alternatives[] }

2. Flow:
   - Fetch user's cards with benefits
   - Call optimizer from @finmatter/cc-engine
   - Log recommendation for analytics
   - Return result

3. Add caching:
   - Cache user's card portfolio in Redis
   - Invalidate on card updates
   - Cache common category recommendations

4. Add endpoint for batch recommendations:
   - POST /api/optimizer/recommend-batch
   - Accept array of {amount, category}
   - Useful for analyzing past transactions
```

### Cursor Prompt 14: Card Optimizer UI (Web PWA) - THE HERO FEATURE

```
Build the card recommendation interface - the core value prop:

1. Create main optimizer screen:
   - src/screens/optimizer/CardOptimizerScreen.tsx
   - Top section: Amount input (large, prominent)
   - Category selection (chips or dropdown)
   - Big "Find Best Card" button
   - Result card showing:
     - Best card visual
     - Expected reward amount (highlighted)
     - Reasoning text
     - Alternative cards (collapsed, expandable)

2. Create quick optimizer widget:
   - src/components/optimizer/QuickOptimizerWidget.tsx
   - Compact version for home screen
   - Recent categories as quick chips
   - One-tap to get recommendation

3. Add to home screen:
   - Home tab shows QuickOptimizerWidget prominently
   - Below it: Recent transactions, Card usage stats

4. Animations:
   - Card flip animation when showing result
   - Confetti animation for high reward recommendations
   - Smooth transitions between states

5. State management:
   - Store recent recommendations
   - Cache frequently used categories

Make this screen FAST and DELIGHTFUL. This is your killer feature.
```

---

## Week 5-6: Feature 5 - AI Assistant (Basic Version)

### Cursor Prompt 15: AI Assistant Backend

```
Implement AI assistant using OpenAI API:

1. Create service in apps/api/src/services/aiAssistant.ts:
   - Initialize OpenAI client
   - Build system prompt with user context:
     - User's cards and benefits
     - Recent transactions summary
     - Spending patterns

2. API endpoint:
   - POST /api/ai/chat
   - Body: { message: string, conversationId?: string }
   - Response: { reply: string, conversationId: string }

3. Implement context building:
   - Function: buildUserContext(userId): string
   - Include last 30 days of transactions
   - Card portfolio summary
   - Top spending categories
   - Current month spending vs last month

4. Add conversation history:
   - Store in database: ai_conversations table
   - Keep last 10 messages for context
   - Clear old conversations after 7 days

5. Implement rate limiting:
   - Free tier: 10 queries per day
   - Premium: Unlimited

6. Add confidence scoring:
   - Parse AI response
   - Add metadata about data sources used
   - Flag uncertain responses

Use GPT-4o-mini for cost efficiency in MVP.
```

### Cursor Prompt 16: AI Assistant UI (Web PWA)

```
Build AI chat interface in web app:

1. Create screen:
   - src/screens/ai/AIAssistantScreen.tsx
   - Chat interface with message bubbles
   - User messages (right, blue)
   - AI messages (left, gray with typing indicator)
   - Input bar at bottom (fixed)

2. Features:
   - Typing indicator animation
   - Quick prompts (chips above input):
     - "Where did I spend most?"
     - "Which card for restaurants?"
     - "Show my spending trend"
   - Voice input option (future)
   - Share conversation (future)

3. Components:
   - src/components/ai/MessageBubble.tsx
     - Support text and card recommendations
     - Markdown rendering for formatted responses
     - Copy message button

   - src/components/ai/QuickPrompts.tsx
     - Horizontal scrollable chips
     - Context-aware suggestions

4. State management:
   - Zustand store for chat history
   - Persist conversations locally
   - Clear cache on logout

5. Add empty state:
   - When no messages, show sample questions
   - Friendly illustration
   - "Ask me anything about your finances"

Make it feel conversational and helpful, not robotic.
```

---

## Week 6-7: Feature 6 - Dashboard & Insights

### Cursor Prompt 17: Dashboard Analytics API

```
Build analytics endpoints for dashboard:

1. API endpoints in apps/api:
   - GET /api/analytics/overview
     - Total spending this month
     - Top category
     - Most used card
     - Month-over-month change

   - GET /api/analytics/spending-by-category
     - Spending breakdown by category
     - Time range parameter

   - GET /api/analytics/card-usage
     - Spending per card
     - Rewards earned per card

   - GET /api/analytics/trends
     - Last 6 months spending trend
     - Category trends
     - Card usage over time

2. Optimize queries:
   - Create materialized views in Supabase
   - Use database functions for complex calculations
   - Cache results in Redis (5 min TTL)

3. Add real-time updates:
   - Use Supabase Realtime for live transaction updates
   - Update dashboard without refresh
```

### Cursor Prompt 18: Dashboard UI (Web PWA)

```
Build dashboard/home screen in web app:

1. Main screen:
   - src/screens/home/HomeScreen.tsx
   - Top section: Total spending this month (big number)
   - Quick optimizer widget
   - Spending by category (horizontal bar chart)
   - Recent transactions (last 5)
   - Card usage breakdown (pie chart)

2. Use charts:
   - Install victory-native for React Native charts
   - Create reusable chart components:
     - src/components/charts/SpendingPieChart.tsx
     - src/components/charts/TrendLineChart.tsx
     - src/components/charts/CategoryBarChart.tsx

3. Pull-to-refresh for latest data

4. Navigation:
   - Tap on category chart → Filter transactions by category
   - Tap on card in pie chart → Card detail screen
   - Tap on recent transaction → Transaction detail

5. Add skeleton loaders for data fetching

Design: Clean, spacious, easy to scan. Focus on key numbers.
```

---

## Week 7-8: Feature 7 - Email Integration

### Cursor Prompt 19: Email Parser Service

```
Build email transaction alert parser:

1. Create email parsing service in packages/cc-engine:
   - src/emailParser/index.ts
   - Support Gmail and Outlook via IMAP

2. Parsing logic:
   - Detect credit card transaction emails
   - Common senders: alerts@hdfcbank.com, alerts@icicibank.com, etc.
   - Extract:
     - Transaction amount
     - Merchant name
     - Date/time
     - Card last 4 digits

3. Use regex patterns for each bank's email format

4. API in apps/api:
   - POST /api/email/connect
     - OAuth flow for Gmail
     - Store encrypted tokens

   - POST /api/email/sync
     - Fetch last 30 days of emails
     - Parse transaction alerts
     - Create transactions if not duplicate
     - Return count of new transactions

5. Add email_connections table:
   - user_id, email_provider, access_token (encrypted), last_sync

6. Implement background job to sync emails daily
```

### Cursor Prompt 20: Email Integration UI (Web PWA)

```
Build email connection flow in web app:

1. Create screens:
   - src/screens/settings/EmailConnectionScreen.tsx
     - List connected emails
     - Add new email button
     - OAuth flow (in-app browser)
     - Show last sync time
     - Manual sync button

   - src/screens/settings/EmailSyncStatusScreen.tsx
     - Show sync progress
     - Transactions found and added
     - Errors/duplicates skipped

2. Add to settings/profile section

3. Show banner on home screen if email not connected:
   - "Connect email for automatic transaction tracking"
   - Dismiss option

4. State management:
   - Store email connection status
   - Trigger sync from UI
```

---

## Week 8-9: Feature 8 - Goals & Spending Limits

### Cursor Prompt 21: Goals System (Backend)

```
Implement financial goals and spending limits:

1. Database migration for goals table:
   - id, user_id, goal_type (spending_limit, savings_goal)
   - category (for spending limits)
   - target_amount, current_amount
   - period (monthly, yearly)
   - start_date, end_date
   - is_active

2. API endpoints:
   - POST /api/goals - Create goal
   - GET /api/goals - List user goals
   - PUT /api/goals/:id - Update goal
   - DELETE /api/goals/:id
   - GET /api/goals/:id/progress - Current progress

3. Background job:
   - Calculate progress daily
   - Send notifications when:
     - 80% of limit reached
     - 100% of limit reached
     - Goal achieved

4. Add to transaction creation:
   - Check if transaction affects any goal
   - Update goal progress
   - Trigger notification if needed
```

### Cursor Prompt 22: Goals UI (Web PWA)

```
Build goals and limits interface:

1. Create screens:
   - src/screens/goals/GoalListScreen.tsx
     - List all active goals
     - Progress bars for each
     - Add goal FAB

   - src/screens/goals/CreateGoalScreen.tsx
     - Goal type selection (spending limit, savings goal)
     - Category selection (for spending limits)
     - Amount input
     - Period selection (monthly, yearly)

   - src/screens/goals/GoalDetailScreen.tsx
     - Detailed progress
     - Chart showing spending over time
     - Transactions contributing to goal
     - Edit/delete options

2. Add goal cards to home screen:
   - Show goals nearing limit
   - Visual progress indicators

3. Notifications:
   - Use react-native-push-notification
   - Local notifications for goal alerts
   - Settings to enable/disable notifications

Design: Encouraging, not punishing. Use green for good progress, yellow for warning.
```

---

## Week 9-10: Feature 9 - Account Aggregator Integration

### Cursor Prompt 23: Account Aggregator Setup

```
Integrate Account Aggregator framework:

1. Research and setup:
   - Choose AA provider (Sahamati, OneMoney, Finvu)
   - Get API credentials
   - Understand consent flow

2. Implement in apps/api:
   - src/services/accountAggregator.ts
   - Consent management endpoints:
     - POST /api/aa/initiate-consent
     - GET /api/aa/consent-status
     - POST /api/aa/fetch-data

3. Database tables:
   - aa_consents: consent_id, user_id, status, expires_at
   - aa_accounts: account_id, user_id, fip_id, account_type

4. Data fetching:
   - Fetch bank statements via AA
   - Parse and store transactions
   - Map to existing cards or create new

5. Handle AA data format (FIU specification)

This is complex - may need 2-3 iterations to get right.
```

### Cursor Prompt 24: Account Aggregator UI (Web PWA)

```
Build AA consent flow in web app:

1. Create screens:
   - src/screens/aa/AAOnboardingScreen.tsx
     - Explain benefits of AA
     - "Connect Bank" button

   - src/screens/aa/AAConsentScreen.tsx
     - Webview for AA consent flow
     - Handle redirects back to app

   - src/screens/aa/AAAccountsScreen.tsx
     - List connected bank accounts
     - Auto-sync toggle
     - Manual fetch button

2. Simplify onboarding:
   - "One-tap setup" badge
   - Show compared to manual PDF upload
   - Security badges (RBI approved, etc.)

3. Add to settings:
   - Manage consents
   - Revoke access
   - View connected institutions

Make this feel secure and trustworthy. AA is still new for many users.
```

---

## Week 10: Advanced Card Features

### Cursor Prompt 25: Card Comparison Tool

```
Build card comparison feature in web-pwa:

1. Create comparison page:
   - apps/web-pwa/src/app/cards/compare/page.tsx
   - Accept query params: ?ids=card1,card2,card3
   - Support 2-4 cards in comparison

2. Features:
   - Side-by-side comparison table
   - Highlight best values (green checkmark)
   - Compare:
     * Basic info (bank, name, network, type)
     * Financials (annual fee, credit limit, utilization)
     * Rewards (by category)
     * Benefits and perks
   - Export to PDF option
   - Share comparison link

3. Card selection UI:
   - Add checkboxes to cards list page
   - "Compare Selected" button (shows when 2+ selected)
   - Max 4 cards selectable
   - Navigate to comparison page with selected IDs

4. Comparison logic:
   - Determine "best" value for each metric:
     * Annual fee: Lower is better (FREE is best)
     * Credit limit: Higher is better
     * Utilization: Lower is better
     * Reward rate: Higher is better
   - Add visual indicators (✨ for best, ⚠️ for worst)

5. Responsive design:
   - Desktop: Full table view
   - Mobile/Tablet: Swipeable cards or accordion

Use react-to-pdf for PDF export.
```

### Cursor Prompt 26: Card Analytics Dashboard

````
Build analytics dashboard for card portfolio:

1. Create analytics page:
   - apps/web-pwa/src/app/cards/analytics/page.tsx
   - Show comprehensive portfolio insights

2. Install charting library:
   - pnpm add recharts (or chart.js)
   - Create reusable chart components

3. Analytics sections:

   a) Overview Stats (Top Row):
      - Total rewards earned this month
      - Best performing card
      - Optimization score (0-100)
      - Total spending

   b) Spending by Card (Pie Chart):
      - Show percentage and amount per card
      - Click to filter transactions

   c) Rewards by Card (Bar Chart):
      - Compare rewards earned across cards
      - Show monthly/yearly toggle

   d) Utilization Trends (Line Chart):
      - Show utilization over last 6 months
      - Highlight danger zones (>70%)

   e) Optimization Opportunities:
      - List missed savings
      - "You used Card A for dining, Card B would save ₹X"
      - Show potential monthly savings
      - Track acceptance rate

4. Create analytics hook:
   - apps/web-pwa/src/hooks/useCardAnalytics.ts
   - Calculate all metrics
   - Support date range filtering
   - Cache calculations

5. Optimization Score Algorithm:
   ```typescript
   optimizationScore = (
     actualRewards / potentialOptimalRewards
   ) * 100

   // Factors:
   // - Using best card for each category
   // - Maximizing reward caps
   // - Avoiding annual fees on unused cards
   // - Maintaining healthy utilization
````

Note: For MVP, use mock transaction data. Replace with real data once transactions feature is built.

```

### Cursor Prompt 27: Payment Reminders System

```

Build payment reminder system:

1. Database migration:
   - Add payment_reminders table:
     - id, user_id, card_id
     - due_date (calculated or manual)
     - amount_due, minimum_payment
     - status (pending, paid, overdue)
     - reminder_sent (boolean)
     - paid_at (timestamp)

2. Due date calculation utility:
   - apps/web-pwa/src/lib/paymentUtils.ts
   - Function: calculateDueDate(billingDay: number): Date
   - Logic: billing_day + 15 days (default)
   - Support bank-specific rules:
     - HDFC: billing day + 20 days
     - SBI: billing day + 15 days
     - ICICI: billing day + 18 days

3. Create reminder component:
   - apps/web-pwa/src/components/cards/PaymentReminder.tsx
   - Show on card detail page
   - Show "Due in X days" badge
   - Color coding:
     - Green: >7 days
     - Yellow: 3-7 days
     - Red: <3 days or overdue

4. Dashboard widget:
   - apps/web-pwa/src/components/dashboard/UpcomingPayments.tsx
   - List all cards with upcoming payments
   - Sort by due date (closest first)
   - Quick "Mark as Paid" action

5. Notification system:
   - API endpoint: POST /api/reminders/schedule
   - Schedule push notifications:
     - 7 days before due date
     - 3 days before due date
     - 1 day before due date
     - On due date (if not paid)
   - Use Supabase Edge Functions or cron job

6. Payment tracking:
   - "Mark as Paid" button
   - Store payment date
   - Track on-time payment streak
   - Show payment history

For MVP: Calculate due dates, show reminders. Push notifications can be added in Phase 2.

```

## Week 11: Polish, Testing, & Beta Prep

### Cursor Prompt 28: Error Handling & Edge Cases

```

Implement comprehensive error handling across the app:

1. Global error boundary in web app
2. Retry logic for failed API calls
3. Offline mode handling (PWA):
   - Queue failed requests
   - Retry when back online
   - Show offline indicator

4. Validation:
   - Input validation on all forms
   - Server-side validation in APIs
   - Clear error messages

5. Logging and monitoring:
   - Setup Sentry for error tracking
   - Log critical user actions
   - Performance monitoring

6. Handle edge cases:
   - Empty states for all lists
   - No cards added yet
   - No transactions
   - AI rate limit reached

```

### Cursor Prompt 26: Onboarding Flow

```

Create smooth onboarding experience:

1. Screens:
   - Welcome screen with value props
   - Permission requests (biometric, notifications)
   - Add first card tutorial
   - Upload first statement or connect email
   - Complete profile

2. Progress indicator throughout onboarding

3. Skip options where appropriate

4. Interactive tutorials:
   - Highlight key features
   - Dismissible tooltips
   - "Next time" option

5. Store onboarding completion status

```

### Cursor Prompt 27: Performance Optimization

```

Optimize app performance:

1. Web PWA:
   - Implement lazy loading for pages/components
   - Image optimization (Next.js Image)
   - Reduce bundle size (code splitting)
   - Optimize re-renders (React.memo, useMemo)
   - Profile with Flipper

2. API:
   - Add database indexes
   - Optimize N+1 queries
   - Implement query result caching
   - Add API response compression

3. Add loading states everywhere:
   - Skeleton screens
   - Progressive loading
   - Optimistic updates

4. Test on low-end Android devices

```

---

## Week 11-12: Beta Launch Prep

### Cursor Prompt 28: Analytics & Monitoring

```

Setup analytics and monitoring:

1. Implement event tracking:
   - User signup, login
   - Card added, statement uploaded
   - Optimizer used
   - AI query sent
   - Goal created

2. Use PostHog or Mixpanel:
   - Install SDK in web app
   - Track key user actions
   - Setup funnels (signup → add card → first recommendation)
   - Track retention cohorts

3. Backend monitoring:
   - API response times
   - Error rates
   - Database query performance

4. Create admin dashboard (simple Next.js app):
   - Total users
   - Daily active users
   - Feature usage stats
   - Top errors

```

### Cursor Prompt 29: Security Hardening

```

Final security review and hardening:

1. Web PWA:
   - Implement HTTPS everywhere
   - Encrypt sensitive data at rest (IndexedDB)
   - Secure WebView configurations
   - Remove console.logs in production

2. API:
   - Rate limiting on all endpoints
   - CORS configuration
   - SQL injection prevention (use parameterized queries)
   - XSS prevention
   - Implement audit logs

3. Supabase:
   - Review RLS policies
   - Disable direct database access in production
   - Setup database backups
   - Enable 2FA for admin accounts

4. Penetration testing (basic):
   - Test auth flows
   - Try SQL injection
   - Test file upload vulnerabilities

```

### Cursor Prompt 30: Beta Testing Setup

```

Prepare for beta launch:

1. Create beta testing group:
   - Setup TestFlight (iOS)
   - Setup Google Play Internal Testing (Android)
   - Create invitation system

2. Feedback mechanism:
   - In-app feedback button (shake gesture)
   - Bug report form with screenshots
   - Feature request form
   - NPS survey after 7 days of use
   - Direct messaging with beta testers (Telegram group)

3. Beta documentation:
   - Known issues list
   - Feature roadmap
   - FAQ document
   - Setup guide for testers

4. Analytics for beta:
   - Track crash-free rate
   - Monitor feature adoption
   - Track drop-off points
   - Session duration and frequency

5. Rollout strategy:
   - Week 1: 10 close friends/family
   - Week 2: 30 more users (expand circle)
   - Week 3-4: Fix critical bugs, gather feedback
   - Month 2: 100-200 users
   - Iterate based on feedback

```

---

## Feature Priority Matrix

### P0 (Must Have for Beta)

- ✅ Auth + Biometric
- ✅ Card Portfolio Management
- ✅ PDF Statement Upload & Parsing
- ✅ Transaction List & Categorization
- ✅ Credit Card Optimizer (CORE!)
- ✅ Basic Dashboard

### P1 (Should Have for Beta)

- ✅ AI Assistant (Basic)
- ✅ Email Integration
- ✅ Goals & Spending Limits

### P2 (Nice to Have, Post-Beta)

- Account Aggregator Integration
- Advanced AI features
- Social sharing
- Referral system
- Premium features

---

## Testing Strategy

### Unit Tests (Week 6+)

```

packages/cc-engine/\*_/_.test.ts

- Test reward calculations
- Test card optimizer logic
- Test categorization

apps/api/\*_/_.test.ts

- Test API endpoints
- Test database queries

```

### Integration Tests (Week 8+)

```

Test full user flows:

- Signup → Add card → Upload statement → Get recommendation
- Test PDF parsing end-to-end
- Test AI assistant with real queries

```

### Manual Testing Checklist (Weekly)

```

□ Fresh install and signup
□ Add 3 different bank cards
□ Upload PDF from each bank
□ Verify transactions parsed correctly
□ Test card optimizer with different amounts/categories
□ Ask AI assistant 5 questions
□ Create spending goal and trigger alert
□ Test on both iOS and Android
□ Test offline behavior
□ Test with slow network

```

---

## When You Get Stuck

### Week 1-2 Blockers (Expected)

- **PDF parsing not working:** Start with one bank, perfect it, then expand
- **React Native build issues:** Run `npx react-native doctor`, fix one by one
- **Supabase RLS confusing:** Start without RLS, add it in Week 6

### Week 3-4 Blockers

- **Categorization accuracy low:** Start with basic keyword matching, improve later
- **Too much data to handle:** Add pagination early, limit to last 3 months

### Week 5-6 Blockers

- **AI responses slow:** Use streaming responses, show typing indicator
- **OpenAI costs high:** Switch to GPT-4o-mini, add caching

### General Debugging

1. Check logs (console, Sentry)
2. Add more logging
3. Test with simpler data
4. Ask Cursor to debug with full error context
5. Google the exact error message
6. Ask on React Native Discord/Stack Overflow

---

## Success Metrics (Track Weekly)

### Development Velocity

- Features completed vs planned
- Bugs introduced vs fixed
- Code commits per day

### Product Quality

- Crash-free rate (target >99%)
- API response time (target <500ms)
- PDF parse success rate (target >90%)

### Personal Metrics

- Hours coded per day
- Features shipped per week
- Days since last commit (should be 0!)

---

## Emergency Pivots (If Needed)

### If PDF parsing is too hard (Week 3)

→ Focus on manual transaction entry + email parsing
→ Make manual entry SUPER fast and easy

### If AI costs are too high (Week 6)

→ Start with rule-based responses
→ Use AI only for complex queries
→ Add tighter rate limits

### If AA integration is too complex (Week 10)

→ Ship without it for beta
→ Add in Month 3-4
→ PDF + email is enough for MVP

---

## Final Pre-Start Checklist

Before you start coding TODAY:

□ Supabase account created
□ OpenAI API key ready
□ React Native environment setup complete
□ Git repo initialized (private)
□ VS Code + Cursor installed
□ Coffee/tea ready ☕
□ Phone on silent 📵
□ 4-hour block of uninterrupted time

---

## Remember

1. **Ship weekly, not perfectly**
2. **Use it yourself daily from Week 2**
3. **Don't overthink, just code**
4. **Bugs are normal, fix them later**
5. **Talk to users starting Week 4**
6. **The app exists to help YOU first**
7. **Speed > Perfection in first 3 months**

---

## Final Words

You have everything you need:

- ✅ Full-stack skills
- ✅ Clear roadmap
- ✅ 30 detailed Cursor prompts
- ✅ 12-week timeline
- ✅ The right tech stack

**Stop reading. Start coding.**

Your first prompt is waiting in Cursor.
Your first commit is 30 minutes away.
Your first user (you) is 2 weeks away.
Your first 100 users are 3 months away.

The clock is ticking. CRED doesn't have this feature yet.

Go build. 🚀
```

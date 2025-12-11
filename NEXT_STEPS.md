# Next Steps - FinMatter Development Roadmap

## Current Status ✅

- ✅ Authentication (Phone OTP)
- ✅ Card Management (Add, Edit, Delete, List)
- ✅ BIN Lookup with Caching
- ✅ PDF Statement Upload & Parsing (Password-protected support)
- ✅ Statement Listing & Transaction View
- ✅ Background Processing for Long Operations
- ✅ Error Handling & Retry Mechanisms
- ✅ Transaction Pages (List, Detail, Search, Filters)
- ✅ Dashboard Widgets (Spending Summary, Categorized Spends, Recent Transactions, Recent Rewards, Spending Analysis)
- ✅ Card Details Page (Recent Transactions, Statement Metadata, Rewards & Offers)
- ✅ Spending Insights Page (Global spending analytics)

---

## Immediate Next Steps (Correct Dependency Order)

### Phase 1: Enhance Existing Features (Week 1-2) 🔥 HIGH PRIORITY

#### 1.1 **Statement Polling & Real-Time Updates** ⏱️

**Why:** Users need to know when statement parsing completes. Real-time updates improve UX significantly.

**Implementation:**

- Create `useStatementStatus` hook
  - Polls `/api/statements/{id}` every 5 seconds
  - Returns: `'processing' | 'success' | 'failed' | null`
  - Auto-stops when done
- Card details page integration
  - Track `uploadedStatementId` after upload
  - Show parsing banner while processing
  - Poll status automatically
  - On completion:
    - Show success toast
    - Refresh card data (credit limits)
    - Refresh latest statement
    - Refresh recent transactions
    - Stop polling
- Page focus refresh
  - On window focus, check for processing statements
  - Auto-refresh if found

**API:**

- Use existing `GET /api/statements/:id` endpoint
- Add `parsing_status` field to response

**UI:**

- Parsing status banner on card details page
- Progress indicator
- Success/error notifications

**Timeline:** 2-3 days

---

#### 1.2 **Card Details Page Enhancements** 📊

**A. Month/Year Filter for Statement Insights**

- Dropdown to select billing period
- Fetch all statements: `GET /api/statements?card_id={cardId}&status=success`
- Show metadata for selected period
- Default: latest statement

**B. Cumulative Insights Widget**

- Metrics:
  - Total reward points (current)
  - Rewards earned this year (sum from all statements)
  - Average monthly spending (from transactions)
  - Top spending category
  - Credit utilization (available/total)
- Data sources:
  - Statements: `reward_points_earned`, `reward_points_total`
  - Transactions: aggregate by month, category

**C. Spending Trends Mini Chart**

- Line chart: last 6 months spending
- Data from transactions grouped by month
- Show on card details page

**Timeline:** 3-4 days

---

#### 1.3 **Complete Dashboard Widgets** 📈

**Current:** 6 widgets implemented
**Missing:** 2 more widgets from original plan

**A. Financial Summary Widget**

- Total credit limit (sum across all cards)
- Total available credit (sum)
- Total amount due (sum from latest statements)
- Total minimum due (sum)
- Next payment due date (earliest)

**B. Card Usage Breakdown Widget** (Enhance existing)

- Pie or bar chart
- Spending per card (percentage and amount)
- Shows which card is used most
- Click to filter transactions

**API Endpoints Needed:**

- `GET /api/analytics/financial-summary` - Credit limits, dues
- `GET /api/analytics/card-usage?start_date=...&end_date=...` - Card breakdown

**Timeline:** 2-3 days

---

## Core Feature Development (After Phase 1)

### 2. **Transaction Categorization Engine** 🔥 FOUNDATION

**Why:** Foundation for all analytics, insights, and the card optimizer. Without categories, we can't recommend cards.

**Implementation:**

- Create `packages/cc-engine/src/categorizer/` module
- Merchant-to-category mapping database (Indian merchants)
- Keyword-based categorization with ML fallback
- Auto-categorize parsed transactions
- Manual override with learning capability

**Categories to support:**

- Dining (Restaurants, Food Delivery)
- Shopping (E-commerce, Retail)
- Groceries (Supermarkets, Online Grocery)
- Fuel (Petrol Pumps)
- Travel (Flights, Hotels, Trains, Cabs)
- Entertainment (Movies, OTT, Events)
- Bills (Utilities, Phone, Internet)
- Healthcare (Hospitals, Pharmacy)
- Education
- Others

**API:**

- `PATCH /api/transactions/:id/category` - Update category
- `GET /api/transactions/stats` - Category-wise spending stats
- `POST /api/transactions/bulk-categorize` - Bulk update categories

**UI:**

- Category icons in transaction list
- Category filter in transaction view
- Quick category change (swipe actions)
- Category picker with icons

**Timeline:** 4-5 days

---

### 3. **Analytics API Endpoints** 📊 UNDERSTAND SPENDING PATTERNS

**Why:** Need backend APIs to power dashboard widgets and analytics. Current widgets use client-side calculations which won't scale.

**Implementation:**

**API Endpoints to Create:**

- `GET /api/analytics/overview` - Dashboard summary
  - Total spending this month
  - vs last month (percentage change)
  - Average daily spending
  - Top category
  - Most used card
- `GET /api/analytics/spending-by-category` - Category breakdown
  - Time range parameter
  - Top 5-6 categories with percentages
- `GET /api/analytics/card-usage` - Card-wise stats
  - Spending per card
  - Rewards earned per card
  - Percentage breakdown
- `GET /api/analytics/trends` - Time-series data
  - Last 6 months spending trend
  - Category trends
  - Card usage over time
- `GET /api/analytics/financial-summary` - Credit limits, dues
  - Total credit limit (sum)
  - Total available credit (sum)
  - Total amount due (sum)
  - Total minimum due (sum)
  - Next payment due date (earliest)
- `GET /api/analytics/rewards-summary` - Points summary
  - Total reward points (sum across all cards)
  - Points earned this month
  - Points expiring soon (30/60 days warnings)
  - Best rewards card

**Optimization:**

- Create materialized views in Supabase for complex calculations
- Use database functions for aggregations
- Cache results (5 min TTL)
- Optimize queries with proper indexes

**Timeline:** 4-5 days

---

### 4. **Comprehensive Cards Database (100+ Top Cards)** 🗄️ CRITICAL PREREQUISITE

**Why:** Card Optimizer needs a complete database of cards with accurate reward rules. Can't optimize without knowing card benefits.

**Implementation:**

- Research and compile top 100+ Indian credit cards
- Structure reward rules per card:
  - Category-wise reward rates
  - Reward caps (monthly/quarterly/annual)
  - Minimum transaction amounts
  - Special conditions
  - Annual fees, joining fees
  - Milestone benefits
  - Special offers

**Cards to include (Priority):**

- **HDFC:** Millennia, Regalia, Diners Club, Infinia, Tata Neu Plus
- **ICICI:** Amazon Pay, Sapphiro, Coral, Rubyx, Emeralde
- **SBI:** SimplyCLICK, Cashback, Elite, Prime
- **Axis:** Magnus, Reserve, Ace, Flipkart, MyZone
- **Amex:** Platinum Travel, Gold, MRCC
- **Citi:** Rewards, PremierMiles, Cashback
- **Kotak:** PVR, League, White, Royale
- **Standard Chartered:** Rewards, Smart, Ultimate
- **RBL:** Shoprite, Zomato, Play
- **Yes Bank:** First Exclusive, Prosperity Rewards
- **IndusInd:** Legend, Pinnacle, Aura Edge
- **AU:** Zenith, LIT, Xcite
- And 50+ more popular cards

**Data Structure:**

- Use existing `cards_metadata` table
- Store reward rules in `rewards` JSONB field:
  ```json
  {
    "categories": {
      "dining": {
        "rate": 5,
        "type": "cashback",
        "cap": 1000,
        "capPeriod": "monthly"
      },
      "shopping": {
        "rate": 3,
        "type": "cashback",
        "cap": 500,
        "capPeriod": "monthly"
      },
      "fuel": {
        "rate": 2,
        "type": "cashback",
        "cap": 400,
        "capPeriod": "monthly"
      }
    },
    "baseRate": 1,
    "baseType": "cashback"
  }
  ```

**API:**

- `GET /api/cards/metadata` - List all card metadata
- `POST /api/cards/metadata` - Add/update card metadata (admin)
- `GET /api/cards/metadata/:id` - Get specific card details

**Data Sources:**

- Bank websites
- Card comparison sites
- Official card documentation
- User submissions (future)

**Timeline:** 7-10 days (research + data entry)

---

### 5. **Credit Card Optimizer** 🚀 CORE FEATURE (After above 4 are done)

**Why:** NOW we can build the optimizer with proper foundation: transactions, categories, analytics, and card database.

**Implementation:**

- Create `packages/cc-engine/src/optimizer/` module
- Reward calculation engine (uses card metadata)
- Best card recommendation algorithm
- Considers:
  - Transaction amount
  - Category
  - User's card portfolio
  - Reward caps remaining
  - Annual fee value
  - Milestone benefits

**API:**

- `POST /api/optimizer/recommend` - Get best card for transaction
  - Input: `{ amount: number, category: string }`
  - Output: `{ bestCard, expectedReward, reasoning, alternatives[] }`
- `POST /api/optimizer/recommend-batch` - Analyze past transactions
- `GET /api/optimizer/missed-opportunities` - Show where user could have saved

**UI:**

- Main optimizer screen with amount + category input
- Big "Find Best Card" button
- Result card showing:
  - Best card visual
  - Expected reward (highlighted)
  - Reasoning text ("5% cashback on dining")
  - Alternative cards with rewards
  - Savings potential
- Quick optimizer widget on home screen
- "Optimize Past Transactions" feature

**Timeline:** 5-7 days

---

### 6. **Email Integration for Statements** 📧 AUTOMATION

**Why:** Manual upload is tedious. Email integration automates transaction tracking.

**Implementation:**

- Email parser service (`packages/cc-engine/src/emailParser/`)
- Gmail OAuth integration
- IMAP email fetching
- Transaction alert parsing (HDFC, ICICI, Amex formats)
- Auto-deduplication

**API:**

- `POST /api/email/connect` - OAuth flow
- `POST /api/email/sync` - Manual sync trigger
- Background job for daily sync

**UI:**

- Settings screen for email connection
- OAuth flow (in-app browser)
- Connection status & last sync time
- Manual sync button
- Banner on dashboard if not connected

**Timeline:** 5-7 days

---

### 7. **SMS Integration for Transaction Alerts** 📱 REAL-TIME

**Why:** SMS alerts are faster than email. Perfect for real-time transaction tracking.

**Implementation:**

- SMS parsing service (similar to email parser)
- Support for major banks' SMS formats
- Regex patterns for transaction alerts
- Auto-extract: amount, merchant, date, card last 4

**Backend Options:**

1. **Twilio SMS Webhook** (Recommended)
   - Forward SMS to Twilio number
   - Webhook receives SMS
   - Parse and create transactions

2. **Android SMS Reader** (React Native wrapper)
   - Read SMS from device
   - Background service to monitor SMS
   - Auto-parse and sync to backend

3. **SMS Gateway API** (Indian providers)
   - Use services like MSG91, TextLocal
   - Forward SMS to webhook

**API:**

- `POST /api/sms/webhook` - Receive SMS from Twilio
- `POST /api/sms/sync` - Manual sync from device
- `GET /api/sms/connections` - List connected numbers

**UI:**

- Settings screen for SMS setup
- Instructions for forwarding SMS
- Transaction list with SMS source indicator
- Real-time transaction notifications

**Timeline:** 4-6 days (Twilio) or 7-10 days (React Native wrapper)

**Note:** For React Native wrapper, you'll need:

- `react-native-sms` or `react-native-get-sms-android`
- Background task permissions
- SMS read permissions
- Background service to monitor SMS

---

### 8. **AI Assistant (Basic)** 🤖 DIFFERENTIATOR

**Why:** Personalized financial guidance sets you apart from competitors.

**Implementation:**

- OpenAI GPT-4o-mini integration
- Context building from user data
- Conversation history
- Rate limiting

**API:**

- `POST /api/ai/chat` - Chat endpoint
- Context building from transactions, cards, spending

**UI:**

- Chat interface
- Message bubbles
- Quick prompts
- Typing indicator
- Empty state with sample questions

**Timeline:** 5-7 days

---

### 9. **Goals & Spending Limits** 🎯 ENGAGEMENT

**Why:** Helps users stay on track and increases app engagement.

**Implementation:**

- Goals database (spending limits, savings goals)
- Progress tracking
- Notifications when approaching limits

**API:**

- `POST /api/goals` - Create goal
- `GET /api/goals` - List goals
- `GET /api/goals/:id/progress` - Progress tracking

**UI:**

- Goal list screen
- Create goal flow
- Progress bars
- Dashboard widgets

**Timeline:** 3-4 days

---

### 10. **Payment Reminders** ⏰ UTILITY

**Why:** Users forget payment due dates. This prevents late fees.

**Implementation:**

- Due date calculation from billing day
- Reminder system (7 days, 3 days, 1 day before)
- Payment tracking

**API:**

- `GET /api/cards/:id/payment-reminder` - Get reminder info
- `POST /api/cards/:id/mark-paid` - Mark payment as made

**UI:**

- "Due in X days" badge on cards
- Dashboard widget for upcoming payments
- Push notifications (future)

**Timeline:** 2-3 days

---

## Recommended Implementation Order (Updated)

### Sprint 1 (Week 1-2): Enhance Existing Features ⚡ IMMEDIATE

**Priority:** Complete what's partially done and improve UX

1. **Statement Polling & Real-Time Updates** (2-3 days)
   - `useStatementStatus` hook
   - Card details integration
   - Auto-refresh on completion

2. **Card Details Page Enhancements** (3-4 days)
   - Month/year filter for statements
   - Cumulative insights widget
   - Spending trends mini chart

3. **Complete Dashboard Widgets** (2-3 days)
   - Financial Summary Widget
   - Enhanced Card Usage Breakdown
   - Connect to analytics APIs

**Total:** 7-10 days

---

### Sprint 2 (Week 3-4): Analytics Backend & Categorization 🔥 FOUNDATION

**Priority:** Build foundation for optimizer

1. **Analytics API Endpoints** (4-5 days)
   - All 6 analytics endpoints
   - Database optimizations
   - Caching strategy

2. **Transaction Categorization Engine** (4-5 days)
   - Categorizer engine
   - Merchant database
   - Auto-categorization
   - Manual override UI

**Total:** 8-10 days

---

### Sprint 3 (Week 5-6): Cards Database 🗄️ CRITICAL PREREQUISITE

3. **Comprehensive Cards Database** (7-10 days)
   - Research top 100+ cards
   - Structure reward rules
   - Populate cards_metadata table
   - Validate data accuracy

**Total:** 7-10 days

---

### Sprint 4 (Week 7-8): Core Feature 🚀

4. **Credit Card Optimizer** (5-7 days)
   - Reward calculation engine
   - Best card recommendation
   - Optimizer UI
   - Batch optimization

**Total:** 5-7 days

---

### Sprint 5 (Week 9-10): Automation & Intelligence

5. **Email Integration** (5-7 days)
6. **SMS Integration** (4-6 days)
7. **AI Assistant** (5-7 days)

**Total:** 14-20 days

---

### Sprint 6 (Week 11-12): Polish & Engagement

8. **Goals & Spending Limits** (3-4 days)
9. **Payment Reminders** (2-3 days)
10. **Export Features** (2-3 days)

**Total:** 7-10 days

---

## Technical Considerations

### Email Integration

- **Gmail OAuth:** Most common, easier to implement
- **IMAP:** More flexible but requires app passwords
- **Security:** Encrypt stored tokens, use secure storage

### SMS Integration

- **Twilio (Recommended):** Easiest, webhook-based, works for all users
- **React Native SMS Reader:** More native, requires permissions, Android-only initially
- **Hybrid Approach:** Start with Twilio, add native reader later

### React Native Wrapper for SMS

If going with native SMS reading:

```typescript
// Example structure
packages/sms-reader/
  src/
    index.ts          // Main SMS reader service
    parsers/          // Bank-specific SMS parsers
    android/          // Android native module
    ios/              // iOS native module (future)
```

**Libraries to consider:**

- `react-native-get-sms-android` (Android)
- `react-native-sms` (both platforms, limited)
- Custom native module for better control

---

## Success Metrics

Track these as you build:

- **Transaction Categorization:** 85%+ accuracy
- **Card Optimizer:** 95%+ recommendation accuracy
- **Email/SMS Sync:** <5 min processing time
- **AI Assistant:** <3s response time
- **User Engagement:** Daily active users, feature adoption

---

## Quick Wins (Can be done in parallel)

- [x] Search transactions ✅
- [x] Filter by date range ✅
- [x] Transaction notes/editing ✅
- [x] Spending trends visualization ✅
- [ ] Export transactions to CSV
- [ ] Recurring transaction detection
- [ ] Card comparison tool (from PRD)
- [ ] Transaction bulk actions (bulk categorize, bulk edit)

---

## Future Considerations (Post-MVP)

- Account Aggregator Integration (Week 9-10 in dev plan)
- Advanced AI features (predictions, anomaly detection)
- Multi-currency support
- Family account sharing
- Investment tracking
- Bill reminders & payment scheduling

---

## Notes

- **Parser Testing:** Continue refining parsers with real statements as you build other features
- **Performance:** Add caching early (Redis for API, SWR for frontend)
- **Security:** Encrypt sensitive data (email tokens, SMS data)
- **Privacy:** Be transparent about data usage, especially for email/SMS

---

**Correct Sequence:**

**Phase 1 (Immediate):**

1. **Statement Polling** → Better UX for existing feature
2. **Card Details Enhancements** → Complete partially done features
3. **Complete Dashboard** → Finish widget implementation

**Phase 2 (Foundation):** 4. **Analytics APIs** → Backend for scalable analytics 5. **Categorization** → Foundation for everything 6. **Cards Database** → Know what cards offer

**Phase 3 (Core Feature):** 7. **Card Optimizer** → Recommend best card (uses all above)

**Phase 4 (Automation & Intelligence):** 8. **Email/SMS Integration** → Automate data entry 9. **AI Assistant** → Personalized guidance

**Phase 5 (Polish):** 10. **Goals & Reminders** → Engagement features

**Don't skip steps!** The optimizer needs transactions, categories, and card data to work properly.

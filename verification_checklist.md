# FinMatter Verification Checklist - Week 0-2

## Cursor Prompt for Automated Verification

```
I need you to verify that all Week 0-2 features are implemented correctly in the FinMatter app. Please check the following and provide a detailed report:

CONTEXT:
- This is a React Native app (monorepo with Turborepo)
- Backend: Next.js API + Supabase
- Mobile: React Native CLI + NativeWind
- State: Zustand
- Storage: MMKV

Please analyze the codebase and verify each item below. For each check, respond with:
✅ PASS - Feature working as expected
⚠️ PARTIAL - Feature exists but has issues
❌ FAIL - Feature missing or broken
📝 NOTE - Additional information

---

## WEEK 0: AUTHENTICATION & ONBOARDING

### 1. Authentication System

#### 1.1 Phone Authentication
- [ ] Check: `src/screens/auth/PhoneInputScreen.tsx` exists
- [ ] Check: Phone input uses country code picker (+91 default for India)
- [ ] Check: Phone validation (10-digit Indian numbers)
- [ ] Check: API integration: `POST /api/auth/send-otp`
- [ ] Check: Error handling (invalid number, network errors)
- [ ] Check: Loading states during OTP send

#### 1.2 OTP Verification
- [ ] Check: `src/screens/auth/OTPVerificationScreen.tsx` exists
- [ ] Check: 6-digit OTP input component
- [ ] Check: Auto-verification on 6 digits entered
- [ ] Check: Resend OTP with 30-second cooldown
- [ ] Check: API integration: `POST /api/auth/verify-otp`
- [ ] Check: Success/error animations
- [ ] Check: Attempt tracking (max 3 attempts)

#### 1.3 Biometric Setup
- [ ] Check: `src/screens/auth/BiometricSetupScreen.tsx` exists
- [ ] Check: Device capability detection
- [ ] Check: Biometric enrollment using react-native-biometrics
- [ ] Check: Skip option available
- [ ] Check: Preference stored in database

#### 1.4 Security Features
- [ ] Check: MMKV secure storage configured
- [ ] Check: Session token storage implemented
- [ ] Check: 30-day OTP re-verification logic exists
- [ ] Check: Biometric re-authentication on app launch
- [ ] Check: Auto-logout on session expiry

### 2. Onboarding System

#### 2.1 Welcome/Name Screen
- [ ] Check: `src/screens/onboarding/WelcomeScreen.tsx` exists
- [ ] Check: Name input with validation (min 2 chars)
- [ ] Check: API integration: `PUT /api/users/profile`
- [ ] Check: Name stored in authStore
- [ ] Check: NO email input (email removed from onboarding)

#### 2.2 Permission Screens
- [ ] Check: `src/screens/onboarding/NotificationPermissionScreen.tsx` exists
- [ ] Check: Uses react-native-permissions for notification request
- [ ] Check: Skip option available
- [ ] Check: Permission status stored

- [ ] Check: `src/screens/onboarding/SMSPermissionScreen.tsx` exists (Android only)
- [ ] Check: SMS permission request (Android)
- [ ] Check: Screen skipped on iOS
- [ ] Check: Privacy explanation present

#### 2.3 Tutorial
- [ ] Check: `src/screens/onboarding/TutorialScreen.tsx` exists
- [ ] Check: Swipeable carousel (3 slides minimum)
- [ ] Check: Slides show ONLY Phase 1 features (card optimizer, tracking)
- [ ] Check: Progress dots indicator
- [ ] Check: Skip button available
- [ ] Check: "Let's Go" on final slide

#### 2.4 Add First Card Prompt
- [ ] Check: `src/screens/onboarding/AddFirstCardScreen.tsx` exists
- [ ] Check: Motivational copy about adding cards
- [ ] Check: "Add Card" button navigates correctly
- [ ] Check: "Skip" option (dev mode only, if __DEV__)
- [ ] Check: Marks onboarding_completed flag on completion

### 3. Navigation

#### 3.1 Navigation Structure
- [ ] Check: AuthStack defined (Phone → OTP → Biometric)
- [ ] Check: OnboardingStack defined (Welcome → Permissions → Tutorial → AddCard)
- [ ] Check: AppStack/MainStack defined
- [ ] Check: Root navigator switches based on auth state
- [ ] Check: Navigation uses React Navigation 6

#### 3.2 Navigation Flow
- [ ] Check: Unauthenticated → AuthStack
- [ ] Check: Authenticated + !onboarded → OnboardingStack
- [ ] Check: Authenticated + onboarded → AppStack
- [ ] Check: Can't navigate back to onboarding after completion
- [ ] Check: Biometric re-auth on app launch (if enabled)

### 4. State Management

#### 4.1 Auth Store
- [ ] Check: `src/stores/authStore.ts` exists
- [ ] Check: Uses Zustand
- [ ] Check: Fields: phoneNumber, session, user, isAuthenticated
- [ ] Check: Fields: userName, notificationsEnabled, smsPermissionGranted
- [ ] Check: Field: onboardingCompleted, biometricEnabled
- [ ] Check: Actions: sendOTP, verifyOTP, logout
- [ ] Check: Actions: setUserProfile, completeOnboarding
- [ ] Check: Persistence to MMKV implemented

### 5. Backend API

#### 5.1 API Endpoints
- [ ] Check: `apps/api` exists with Next.js setup
- [ ] Check: Endpoint: `POST /api/auth/send-otp` exists
  - Accepts: { phoneNumber: string }
  - Returns: { success: boolean }
  - Integrates with Twilio/Supabase
  
- [ ] Check: Endpoint: `POST /api/auth/verify-otp` exists
  - Accepts: { phoneNumber: string, otp: string }
  - Returns: { success: boolean, session, user }
  
- [ ] Check: Endpoint: `PUT /api/users/profile` exists
  - Accepts: { name: string }
  - Returns: { success: boolean, user }

#### 5.2 Supabase Integration
- [ ] Check: Supabase client configured in `lib/supabase/client.ts`
- [ ] Check: Environment variables set (SUPABASE_URL, keys)
- [ ] Check: Phone auth provider enabled in Supabase
- [ ] Check: Twilio configured (or Supabase auth messaging)

#### 5.3 Database Schema
- [ ] Check: `users` table exists in Supabase
- [ ] Check: Fields: id, phone_number, name
- [ ] Check: Fields: notifications_enabled, sms_permission_granted
- [ ] Check: Fields: onboarding_completed, biometric_enabled
- [ ] Check: Fields: created_at, last_login
- [ ] Check: RLS disabled temporarily (or proper policies set)

---

## WEEK 1: CARD PORTFOLIO

### 6. Card Management Screens

#### 6.1 Card List Screen
- [ ] Check: `src/screens/cards/CardListScreen.tsx` exists
- [ ] Check: Displays user's cards as visual card components
- [ ] Check: Shows last 4 digits (with show/hide toggle)
- [ ] Check: FAB button to add new card
- [ ] Check: Empty state when no cards
- [ ] Check: Pull-to-refresh implemented

#### 6.2 Add Card Screen
- [ ] Check: `src/screens/cards/AddCardScreen.tsx` exists
- [ ] Check: Bank selection dropdown/search
- [ ] Check: Card selection from bank's cards
- [ ] Check: "Don't see your card?" → Manual entry option
- [ ] Check: Fields: Card name, last 4 digits, credit limit
- [ ] Check: Network selection (Visa/MC/RuPay/Amex)
- [ ] Check: Validation on all fields
- [ ] Check: API integration: `POST /api/cards`

#### 6.3 Card Detail Screen
- [ ] Check: `src/screens/cards/CardDetailScreen.tsx` exists
- [ ] Check: Shows full card details
- [ ] Check: Displays reward rules
- [ ] Check: Shows benefits list
- [ ] Check: Edit button navigates to edit screen
- [ ] Check: Delete option with confirmation

#### 6.4 Edit Card Screen
- [ ] Check: `src/screens/cards/EditCardScreen.tsx` exists
- [ ] Check: Pre-filled form with existing data
- [ ] Check: Can update card name, limit, etc.
- [ ] Check: API integration: `PUT /api/cards/:id`

### 7. Card Components

#### 7.1 Credit Card Visual
- [ ] Check: `src/components/cards/CreditCardVisual.tsx` exists
- [ ] Check: Gradient based on card metadata
- [ ] Check: Shows bank name, last 4 digits
- [ ] Check: Shows network (Visa/MC/etc)
- [ ] Check: Flip animation for show/hide number
- [ ] Check: Generic gradient for unknown cards

#### 7.2 Card Metadata System
- [ ] Check: Card database exists in `packages/cc-engine/src/data/cards`
- [ ] Check: At least 20-30 popular cards defined
- [ ] Check: CardMetadata interface with reward rules
- [ ] Check: BankMetadata with logos and colors
- [ ] Check: CardSearchService for querying cards

### 8. Card Backend

#### 8.1 Card API Endpoints
- [ ] Check: `POST /api/cards` - Create card
  - Accepts: card data
  - Returns: created card with ID
  
- [ ] Check: `GET /api/cards` - Get user's cards
  - Filters by user_id
  - Returns array of cards
  
- [ ] Check: `GET /api/cards/:id` - Get single card
  - Returns card details with metadata
  
- [ ] Check: `PUT /api/cards/:id` - Update card
  - Accepts: updated fields
  - Returns updated card
  
- [ ] Check: `DELETE /api/cards/:id` - Delete/deactivate card
  - Soft delete (sets is_active = false)

#### 8.2 Card Database Schema
- [ ] Check: `cards` table exists in Supabase
- [ ] Check: Fields: id, user_id, card_metadata_id
- [ ] Check: Fields: bank_id, card_name, last_four_digits
- [ ] Check: Fields: card_type, network, credit_limit
- [ ] Check: Fields: primary_color, secondary_color
- [ ] Check: Fields: reward_type, is_custom, is_active
- [ ] Check: Fields: created_at, updated_at
- [ ] Check: Foreign key to users table
- [ ] Check: Indexes on user_id

#### 8.3 Card Benefits Table (Optional)
- [ ] Check: If `card_benefits` table exists
- [ ] Check: Links to cards table
- [ ] Check: Stores category-wise reward rules

---

## WEEK 2: PDF PARSER (If Completed)

### 9. PDF Statement Parser

#### 9.1 Parser Service
- [ ] Check: `packages/cc-engine/src/parsers` exists
- [ ] Check: Base parser class defined
- [ ] Check: Bank-specific parsers (HDFC, ICICI, SBI, Axis)
- [ ] Check: Uses pdf-parse library
- [ ] Check: Returns standardized transaction format
- [ ] Check: Extracts: date, merchant, amount, category
- [ ] Check: Error handling for unparsable PDFs

#### 9.2 PDF Upload
- [ ] Check: File picker integrated (react-native-document-picker)
- [ ] Check: PDF upload endpoint: `POST /api/statements/upload`
- [ ] Check: File validation (type, size limit 5MB)
- [ ] Check: Upload to Supabase Storage (encrypted)
- [ ] Check: Progress indicator during upload

#### 9.3 Transaction Storage
- [ ] Check: `transactions` table exists in Supabase
- [ ] Check: Fields: id, user_id, card_id, date
- [ ] Check: Fields: merchant_name, amount, category
- [ ] Check: Fields: raw_text, statement_id
- [ ] Check: Fields: created_at
- [ ] Check: Indexes on user_id, card_id, date

#### 9.4 Statement Tracking
- [ ] Check: `statements` table exists
- [ ] Check: Fields: id, user_id, card_id, file_path
- [ ] Check: Fields: upload_date, transaction_count
- [ ] Check: Field: parsing_status (pending/success/failed)

---

## ARCHITECTURE & CODE QUALITY

### 10. Monorepo Structure

#### 10.1 Turborepo Setup
- [ ] Check: `turbo.json` exists at root
- [ ] Check: Workspace packages defined
- [ ] Check: Build pipeline configured
- [ ] Check: Caching enabled

#### 10.2 Package Structure
- [ ] Check: `apps/mobile` exists (React Native)
- [ ] Check: `apps/api` exists (Next.js)
- [ ] Check: `packages/types` exists
- [ ] Check: `packages/shared` exists
- [ ] Check: `packages/ui` exists (if used)
- [ ] Check: `packages/cc-engine` exists

#### 10.3 Package Configuration
- [ ] Check: Root `package.json` has workspaces
- [ ] Check: Each package has proper `package.json`
- [ ] Check: Type references work across packages
- [ ] Check: Scripts work: `pnpm dev:mobile`, `pnpm dev:api`

### 11. TypeScript

#### 11.1 TypeScript Config
- [ ] Check: `tsconfig.json` at root
- [ ] Check: Strict mode enabled
- [ ] Check: Path aliases configured (@finmatter/*)
- [ ] Check: Each package has own tsconfig

#### 11.2 Type Safety
- [ ] Check: No `any` types in critical code
- [ ] Check: API types defined in packages/types
- [ ] Check: Props properly typed in components
- [ ] Check: State interfaces defined

### 12. Code Quality

#### 12.1 Linting
- [ ] Check: ESLint configured
- [ ] Check: Prettier configured
- [ ] Check: Run `pnpm lint` - passes or <100 warnings acceptable
- [ ] Check: No critical errors

#### 12.2 Build
- [ ] Check: `pnpm build` succeeds for all packages
- [ ] Check: No TypeScript errors
- [ ] Check: Metro bundler starts without errors
- [ ] Check: Android app builds successfully

### 13. Dependencies

#### 13.1 Core Dependencies
- [ ] Check: react-native installed (0.81+)
- [ ] Check: @react-navigation/native
- [ ] Check: @supabase/supabase-js
- [ ] Check: zustand
- [ ] Check: react-native-mmkv

#### 13.2 UI Dependencies
- [ ] Check: nativewind
- [ ] Check: react-native-linear-gradient
- [ ] Check: lucide-react-native (icons)

#### 13.3 Auth Dependencies
- [ ] Check: react-native-biometrics
- [ ] Check: react-native-permissions
- [ ] Check: react-native-phone-number-input

#### 13.4 Utilities
- [ ] Check: date-fns (if used)
- [ ] Check: axios or fetch wrapper

---

## TESTING & FUNCTIONALITY

### 14. Manual Testing Checklist

#### 14.1 Auth Flow
- [ ] Test: Install fresh → Sign up with phone
- [ ] Test: Receive OTP on phone within 10 seconds
- [ ] Test: Verify OTP → Navigate to biometric setup
- [ ] Test: Skip biometric → Go to onboarding
- [ ] Test: Enable biometric → Biometric prompt works
- [ ] Test: Wrong OTP → Shows error, shake animation
- [ ] Test: Resend OTP → Works after 30s cooldown

#### 14.2 Onboarding Flow
- [ ] Test: Enter name → Saves to profile
- [ ] Test: Notification permission → Request works
- [ ] Test: SMS permission (Android) → Request works
- [ ] Test: Tutorial → Swipe through 3 slides
- [ ] Test: Skip tutorial → Goes to next screen
- [ ] Test: AddFirstCard → Navigates to main app or card form

#### 14.3 Card Management
- [ ] Test: Add new card → Select bank → Select card
- [ ] Test: Card from database → Auto-fills metadata
- [ ] Test: Manual entry → Can add unknown card
- [ ] Test: Card list → Shows all user's cards
- [ ] Test: Card visual → Shows correct gradient/colors
- [ ] Test: Edit card → Can update details
- [ ] Test: Delete card → Confirmation → Soft delete

#### 14.4 Navigation & State
- [ ] Test: Close app → Reopen → Biometric re-auth
- [ ] Test: Biometric fail → Fall back to OTP
- [ ] Test: Logout → Returns to phone input
- [ ] Test: Can't go back to onboarding after completion
- [ ] Test: Deep link handling (if implemented)

#### 14.5 Error Handling
- [ ] Test: No internet → Proper error messages
- [ ] Test: API timeout → Shows retry option
- [ ] Test: Invalid data → Validation errors shown
- [ ] Test: Permission denied → App continues (not blocked)

---

## ENVIRONMENT & CONFIGURATION

### 15. Environment Variables

#### 15.1 API Environment
- [ ] Check: `apps/api/.env.local` exists
- [ ] Check: SUPABASE_URL set
- [ ] Check: SUPABASE_ANON_KEY set
- [ ] Check: SUPABASE_SERVICE_KEY set (kept secret!)
- [ ] Check: TWILIO credentials (if using Twilio directly)

#### 15.2 Mobile Environment
- [ ] Check: `apps/mobile/.env` exists
- [ ] Check: SUPABASE_URL set
- [ ] Check: SUPABASE_ANON_KEY set
- [ ] Check: API_URL set (localhost for dev)

#### 15.3 Security
- [ ] Check: `.env` files in `.gitignore`
- [ ] Check: `.env.example` files exist for reference
- [ ] Check: No secrets committed to git

### 16. Platform-Specific

#### 16.1 iOS Configuration
- [ ] Check: `ios/Podfile` exists
- [ ] Check: Pods installed (`cd ios && pod install`)
- [ ] Check: Info.plist has required permissions
- [ ] Check: Face ID/Touch ID usage description

#### 16.2 Android Configuration
- [ ] Check: `android/app/build.gradle` configured
- [ ] Check: AndroidManifest.xml has required permissions
- [ ] Check: Minimum SDK version compatible
- [ ] Check: Signing config for release builds

---

## SECURITY & PRIVACY

### 17. Security Measures

#### 17.1 Data Protection
- [ ] Check: Passwords/OTPs never logged
- [ ] Check: Tokens stored in encrypted storage (MMKV)
- [ ] Check: HTTPS for all API calls
- [ ] Check: Sensitive data not in plain text

#### 17.2 Authentication
- [ ] Check: Session expiry implemented
- [ ] Check: 30-day OTP re-verification
- [ ] Check: Logout clears all stored data
- [ ] Check: Biometric fallback to OTP

#### 17.3 Privacy
- [ ] Check: SMS read permission explanation clear
- [ ] Check: Notification permission optional
- [ ] Check: User can skip optional permissions
- [ ] Check: Data usage explained in onboarding

---

## PERFORMANCE & UX

### 18. Performance

#### 18.1 App Performance
- [ ] Check: App launches in <3 seconds
- [ ] Check: Screen transitions smooth (60fps)
- [ ] Check: No memory leaks (test with long usage)
- [ ] Check: API calls don't block UI

#### 18.2 Bundle Size
- [ ] Check: APK/IPA size reasonable (<50MB)
- [ ] Check: Unnecessary dependencies removed
- [ ] Check: ProGuard/tree-shaking enabled for production

### 19. User Experience

#### 19.1 Feedback Systems
- [ ] Check: Toast notifications implemented
- [ ] Check: Haptic feedback on actions
- [ ] Check: Loading spinners during async operations
- [ ] Check: Success/error animations

#### 19.2 Accessibility
- [ ] Check: Text readable (good contrast)
- [ ] Check: Touch targets large enough (min 44x44)
- [ ] Check: Error messages clear and actionable
- [ ] Check: Empty states have helpful messaging

---

## DOCUMENTATION

### 20. Code Documentation

#### 20.1 README Files
- [ ] Check: Root README.md exists with setup instructions
- [ ] Check: Each package has README
- [ ] Check: API endpoints documented
- [ ] Check: Environment variables documented

#### 20.2 Code Comments
- [ ] Check: Complex logic has comments
- [ ] Check: TODOs marked for future work
- [ ] Check: Type definitions have descriptions

---

## KNOWN ISSUES & TECHNICAL DEBT

### 21. Issues to Track

- [ ] Note: StyleSheet vs NativeWind inconsistency
- [ ] Note: RLS disabled (to be enabled Week 6)
- [ ] Note: Linting warnings count: [X]
- [ ] Note: Missing features for MVP (list them)
- [ ] Note: Performance bottlenecks identified
- [ ] Note: Browser storage not available (artifacts limitation)

---

## FINAL VERIFICATION

### 22. Critical Path Test

**Complete this flow end-to-end without errors:**

1. Fresh install
2. Sign up with phone + OTP
3. Setup biometric
4. Complete onboarding (name, permissions, tutorial)
5. Add first card
6. View card in list
7. Edit card details
8. Close app
9. Reopen → Biometric re-auth
10. Logout
11. Login again with OTP

**Result:**
- [ ] All steps complete without crashes
- [ ] Data persists correctly
- [ ] UI looks polished
- [ ] No critical errors in console

---

## REPORT FORMAT

For each section, provide:

```
## [SECTION NAME]
Status: ✅ COMPLETE | ⚠️ PARTIAL | ❌ INCOMPLETE

Details:
- [Specific check]: ✅/⚠️/❌
- [Specific check]: ✅/⚠️/❌
...

Issues Found:
1. [Issue description]
2. [Issue description]

Recommendations:
1. [Suggestion]
2. [Suggestion]
```

---

## PRIORITY LEVELS

**P0 (Critical - Must Fix Now):**
- Auth flow broken
- App crashes on key screens
- Data loss issues
- Security vulnerabilities

**P1 (Important - Fix This Week):**
- Missing core features
- Poor UX on key flows
- Performance issues
- Incomplete error handling

**P2 (Nice to Have - Fix Week 6):**
- Styling inconsistencies
- Minor bugs
- Code quality improvements
- Missing non-critical features

**P3 (Future):**
- Technical debt
- Optimizations
- Nice-to-have features

---

END OF VERIFICATION CHECKLIST
```

---

Now analyze the FinMatter codebase and provide a comprehensive verification report following this checklist.
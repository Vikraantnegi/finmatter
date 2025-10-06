# Credit Card Metadata & UI System

## Architecture Overview

```
User adds card → Search card database → If found: Use metadata → If not found: Manual entry + generic UI
```

---

## 1. Card Database Structure

### Database Schema

**File:** `packages/cc-engine/src/data/cardDatabase.ts`

```typescript
export interface CardMetadata {
  id: string; // Unique identifier (e.g., "hdfc-millennia")
  bankId: string; // Bank identifier (e.g., "hdfc")
  cardName: string; // Display name (e.g., "HDFC Millennia Credit Card")
  cardType: 'credit' | 'debit';
  network: 'visa' | 'mastercard' | 'rupay' | 'amex';
  
  // Visual Design
  primaryColor: string; // Hex color for card gradient
  secondaryColor: string; // Secondary gradient color
  logoUrl?: string; // URL to card image (optional)
  
  // Card Details
  annualFee: number; // In rupees
  joiningFee: number;
  rewardType: 'cashback' | 'points' | 'miles' | 'none';
  
  // Reward Rules
  rewardRules: RewardRule[];
  
  // Benefits
  benefits: string[]; // Array of benefit descriptions
  
  // Metadata
  minIncome?: number; // Minimum income requirement
  isActive: boolean; // Is this card still being issued?
  issueDate?: string; // When card was launched
  lastUpdated: string; // When metadata was last updated
}

export interface RewardRule {
  category: string; // e.g., "dining", "shopping", "fuel"
  rewardRate: number; // e.g., 5 (means 5% or 5 points per 100)
  rewardUnit: 'percent' | 'points_per_100' | 'miles_per_100';
  cap?: number; // Monthly/yearly cap on rewards
  capPeriod?: 'monthly' | 'yearly';
  minTransaction?: number; // Minimum transaction amount
  conditions?: string[]; // Special conditions
}

export interface BankMetadata {
  id: string; // e.g., "hdfc"
  name: string; // e.g., "HDFC Bank"
  logoUrl: string; // Bank logo
  primaryColor: string; // Brand color
  supportEmail?: string;
  supportPhone?: string;
}
```

---

## 2. Top 40 Cards Database (Starter)

**File:** `packages/cc-engine/src/data/cards/index.ts`

```typescript
export const CARD_DATABASE: CardMetadata[] = [
  // HDFC Cards
  {
    id: 'hdfc-millennia',
    bankId: 'hdfc',
    cardName: 'HDFC Millennia Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#004C8F',
    secondaryColor: '#0066CC',
    annualFee: 1000,
    joiningFee: 1000,
    rewardType: 'cashback',
    rewardRules: [
      {
        category: 'shopping',
        rewardRate: 5,
        rewardUnit: 'percent',
        cap: 1000,
        capPeriod: 'monthly',
        conditions: ['Only on online shopping', 'Minimum ₹1000 per transaction']
      },
      {
        category: 'dining',
        rewardRate: 5,
        rewardUnit: 'percent',
        cap: 1000,
        capPeriod: 'monthly'
      },
      {
        category: 'default',
        rewardRate: 1,
        rewardUnit: 'percent'
      }
    ],
    benefits: [
      '5% cashback on shopping and dining (up to ₹1000/month)',
      '1% cashback on all other spends',
      'Complimentary lounge access (4 times/year)',
      '1% fuel surcharge waiver'
    ],
    minIncome: 25000,
    isActive: true,
    lastUpdated: '2025-10-01'
  },
  
  {
    id: 'hdfc-regalia',
    bankId: 'hdfc',
    cardName: 'HDFC Regalia Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#8B4513',
    secondaryColor: '#D4AF37',
    annualFee: 2500,
    joiningFee: 2500,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'travel',
        rewardRate: 4,
        rewardUnit: 'points_per_100'
      },
      {
        category: 'default',
        rewardRate: 4,
        rewardUnit: 'points_per_100'
      }
    ],
    benefits: [
      '4 reward points per ₹150 spent',
      'Unlimited domestic lounge access',
      '6 international lounge access per year',
      'Air accident cover of ₹1 crore'
    ],
    minIncome: 100000,
    isActive: true,
    lastUpdated: '2025-10-01'
  },
  
  // ICICI Cards
  {
    id: 'icici-amazon-pay',
    bankId: 'icici',
    cardName: 'ICICI Amazon Pay Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#FF9900',
    secondaryColor: '#232F3E',
    annualFee: 0,
    joiningFee: 0,
    rewardType: 'cashback',
    rewardRules: [
      {
        category: 'amazon',
        rewardRate: 5,
        rewardUnit: 'percent',
        conditions: ['Only for Amazon Prime members']
      },
      {
        category: 'shopping',
        rewardRate: 2,
        rewardUnit: 'percent',
        conditions: ['Only on Amazon.in for non-Prime members']
      },
      {
        category: 'default',
        rewardRate: 1,
        rewardUnit: 'percent'
      }
    ],
    benefits: [
      '5% cashback on Amazon (Prime members)',
      '2% cashback on Amazon (non-Prime)',
      '1% cashback everywhere else',
      'No annual fee'
    ],
    isActive: true,
    lastUpdated: '2025-10-01'
  },
  
  // SBI Cards
  {
    id: 'sbi-simplyclick',
    bankId: 'sbi',
    cardName: 'SBI SimplyCLICK Credit Card',
    cardType: 'credit',
    network: 'visa',
    primaryColor: '#0D3C7C',
    secondaryColor: '#4A90E2',
    annualFee: 499,
    joiningFee: 499,
    rewardType: 'points',
    rewardRules: [
      {
        category: 'dining',
        rewardRate: 10,
        rewardUnit: 'points_per_100'
      },
      {
        category: 'movies',
        rewardRate: 10,
        rewardUnit: 'points_per_100'
      },
      {
        category: 'default',
        rewardRate: 1,
        rewardUnit: 'points_per_100'
      }
    ],
    benefits: [
      '10X reward points on dining and movies',
      '5X on online shopping',
      '1% fuel surcharge waiver',
      'Annual fee waiver on spending ₹1L'
    ],
    isActive: true,
    lastUpdated: '2025-10-01'
  },
  
  // Add 36 more popular cards...
];

export const BANK_DATABASE: BankMetadata[] = [
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    logoUrl: 'https://cdn.finmatter.app/banks/hdfc.png',
    primaryColor: '#004C8F',
    supportEmail: 'support@hdfcbank.com',
    supportPhone: '1800-266-4332'
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    logoUrl: 'https://cdn.finmatter.app/banks/icici.png',
    primaryColor: '#F47920',
    supportEmail: 'support@icicibank.com',
    supportPhone: '1800-200-3344'
  },
  {
    id: 'sbi',
    name: 'SBI Card',
    logoUrl: 'https://cdn.finmatter.app/banks/sbi.png',
    primaryColor: '#0D3C7C',
    supportEmail: 'customer.care@sbicard.com',
    supportPhone: '1860-180-1290'
  },
  // Add more banks...
];
```

---

## 3. Card Search & Selection System

### UI Flow

**Step 1: User starts adding a card**

```
AddCardScreen
  ↓
"Which bank is this card from?"
  ↓
Bank Selector (searchable dropdown)
  ↓ Selected bank: HDFC
  ↓
"Which HDFC card do you have?"
  ↓
Card Selector (shows only HDFC cards from database)
  ↓ Selected: HDFC Millennia
  ↓
Pre-filled form with metadata
  ↓
User enters: Last 4 digits, Credit limit (optional)
  ↓
Save
```

**Step 2: If card not in database**

```
Card Selector
  ↓
"Don't see your card?"
  ↓
Manual Entry Form
  ↓
User enters:
  - Card name
  - Last 4 digits
  - Credit limit
  - Network (Visa/MC/RuPay/Amex)
  ↓
Save with generic metadata
```

---

## 4. Card Search Service

**File:** `packages/cc-engine/src/services/cardSearch.ts`

```typescript
import { CARD_DATABASE, BANK_DATABASE } from '../data/cards';

export class CardSearchService {
  
  // Get all banks
  getAllBanks() {
    return BANK_DATABASE;
  }
  
  // Get cards by bank
  getCardsByBank(bankId: string) {
    return CARD_DATABASE.filter(card => card.bankId === bankId && card.isActive);
  }
  
  // Search cards by name
  searchCards(query: string) {
    const lowerQuery = query.toLowerCase();
    return CARD_DATABASE.filter(card => 
      card.cardName.toLowerCase().includes(lowerQuery) ||
      card.bankId.toLowerCase().includes(lowerQuery)
    );
  }
  
  // Get specific card
  getCardById(cardId: string) {
    return CARD_DATABASE.find(card => card.id === cardId);
  }
  
  // Get bank by ID
  getBankById(bankId: string) {
    return BANK_DATABASE.find(bank => bank.id === bankId);
  }
  
  // Fuzzy match for card identification (from PDF parsing)
  matchCardFromStatement(bankName: string, cardName?: string) {
    // Try to match bank first
    const bank = BANK_DATABASE.find(b => 
      bankName.toLowerCase().includes(b.name.toLowerCase()) ||
      b.name.toLowerCase().includes(bankName.toLowerCase())
    );
    
    if (!bank) return null;
    
    // If card name provided, try to match
    if (cardName) {
      const cards = this.getCardsByBank(bank.id);
      return cards.find(c => 
        cardName.toLowerCase().includes(c.cardName.toLowerCase().replace('credit card', '').trim())
      );
    }
    
    return null;
  }
}
```

---

## 5. UI Component for Card Display

**File:** `apps/mobile/src/components/cards/CreditCardVisual.tsx`

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface Props {
  card: {
    bankId: string;
    cardName: string;
    lastFourDigits: string;
    network: 'visa' | 'mastercard' | 'rupay' | 'amex';
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export const CreditCardVisual: React.FC<Props> = ({ card }) => {
  // Get card metadata for colors
  const metadata = cardSearchService.getCardById(card.id);
  
  const colors = metadata 
    ? [metadata.primaryColor, metadata.secondaryColor]
    : ['#6B7280', '#4B5563']; // Generic gray gradient
  
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="w-full h-48 rounded-2xl p-6 justify-between"
    >
      {/* Bank Logo (top left) */}
      <View>
        <Text className="text-white text-lg font-bold">
          {card.bankName || 'Credit Card'}
        </Text>
      </View>
      
      {/* Card Number (middle) */}
      <View className="flex-row items-center">
        <Text className="text-white text-xl tracking-widest">
          •••• •••• •••• {card.lastFourDigits}
        </Text>
      </View>
      
      {/* Card Name + Network (bottom) */}
      <View className="flex-row justify-between items-end">
        <Text className="text-white text-sm opacity-90">
          {card.cardName}
        </Text>
        <Text className="text-white text-xs font-bold">
          {card.network.toUpperCase()}
        </Text>
      </View>
    </LinearGradient>
  );
};
```

---

## 6. Fallback for Unknown Cards

**When card is NOT in database:**

```typescript
// Generic card metadata
const GENERIC_CARD_METADATA = {
  primaryColor: '#6B7280',
  secondaryColor: '#4B5563',
  rewardType: 'none',
  rewardRules: [],
  benefits: ['Manual reward tracking'],
};

// Use this when card not found
const cardMetadata = getCardById(cardId) || GENERIC_CARD_METADATA;
```

---

## 7. Where to Get Card Data

### Manual Research (Week 1-2):
**Top 40 cards cover 80% of users:**
1. **HDFC:** Millennia, Regalia, Diners Black, Infinia
2. **ICICI:** Amazon Pay, Platinum, Sapphiro, Emeralde
3. **SBI:** SimplyCLICK, SimplySAVE, Prime, Aurum
4. **Axis:** Magnus, Vistara, Ace, Flipkart
5. **AMEX:** Gold, Platinum, Membership Rewards
6. **Kotak, Yes Bank, IndusInd:** Top 2-3 cards each

**Sources:**
- Bank websites (reward terms)
- CardExpert.in
- BankBazaar.com
- Paisabazaar.com

### API Sources (Future - Week 8+):
- **CardExpert API** (if they have one)
- **Scrape bank websites** (legal gray area)
- **User-submitted data** (crowdsource)

---

## 8. Database Storage

**In your Supabase `cards` table:**

```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  
  -- Card identification
  card_metadata_id TEXT, -- Links to CARD_DATABASE (e.g., "hdfc-millennia")
  bank_id TEXT, -- Links to BANK_DATABASE
  card_name TEXT NOT NULL,
  last_four_digits TEXT NOT NULL,
  
  -- User-specific data
  credit_limit NUMERIC,
  billing_day INTEGER,
  
  -- Metadata (cached from database or manual entry)
  card_type TEXT, -- 'credit' or 'debit'
  network TEXT, -- 'visa', 'mastercard', etc.
  primary_color TEXT,
  secondary_color TEXT,
  reward_type TEXT,
  
  -- Flags
  is_custom BOOLEAN DEFAULT false, -- true if not in our database
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**When user adds a card:**
1. Search CARD_DATABASE
2. If found → Store `card_metadata_id` + cache metadata
3. If not found → Set `is_custom = true`, user enters metadata manually

---

## 9. UI Screens Updated

### AddCardScreen Flow:

```
1. Select Bank (searchable dropdown)
   ↓
2. Select Card from bank's cards
   OR
   "Don't see your card?" → Manual entry
   ↓
3. If from database:
   - Show card preview with gradient
   - Auto-fill reward rules
   - User only enters: Last 4 digits, credit limit
   ↓
4. If manual:
   - User enters: Card name, last 4 digits, network
   - Generic gray gradient
   - Can add rewards manually later
   ↓
5. Save to database
```

---

## 10. Priority for MVP

**Week 1 (Now):**
- ✅ Create card database with TOP 20 cards
- ✅ HDFC (5), ICICI (5), SBI (5), Axis (5)
- ✅ Bank selector UI
- ✅ Card selector UI
- ✅ Generic fallback for unknown cards

**Week 6 (Polish):**
- Add 20 more popular cards (total 40)
- Improve card visuals
- Add bank logos

**Week 10+ (Post-launch):**
- Crowdsource card data from users
- Build admin panel to add new cards
- API integration for card data

---

## Bottom Line

### For MVP (Week 1):
1. **Hardcode TOP 20-30 popular cards** in `packages/cc-engine/src/data/cards`
2. **Two-step selection:** Bank → Card
3. **Fallback:** Manual entry for unknown cards with generic UI
4. **Don't overthink:** 30 cards = 80% of users covered

### Data Sources:
- Bank websites (manual research - 2-3 hours)
- CardExpert.in / BankBazaar
- Your own knowledge of popular cards

### Implementation:
- **Time:** 4-6 hours to research and add 30 cards
- **Maintenance:** Add new cards as users request them
- **Scalability:** Move to API/database later (Week 8+)

---

**Start with 20-30 cards. Users can manually add rest. Expand based on demand.**


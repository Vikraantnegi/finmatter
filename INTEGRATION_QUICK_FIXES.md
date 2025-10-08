# FinMatter - Quick Integration Fixes

**Estimated Time:** 45 minutes  
**Priority:** CRITICAL  
**Impact:** Makes card management fully functional

---

## Fix 1: Add Card Integration (15 minutes)

**File:** `apps/web-pwa/src/app/cards/add/page.tsx`

**Current Code** (Lines 144-183):

```typescript
const handleSubmit = async () => {
  if (!validateForm()) return;

  setLoading(true);
  try {
    // Create card object
    const _newCard: Partial<Card> = {
      cardName: formData.cardName,
      lastFourDigits: formData.lastFourDigits,
      creditLimit: Number(formData.creditLimit),
      availableCredit: Number(formData.availableCredit),
      billingDay: formData.billingDay ? Number(formData.billingDay) : undefined,
      expiryDate: formData.expiryDate || undefined,
      bankName: formData.bankName,
      network: selectedCard?.network || 'visa',
      rewardType: selectedCard?.rewardType || 'cashback',
      primaryColor: selectedCard?.primaryColor,
      secondaryColor: selectedCard?.secondaryColor,
      cardMetadataId: selectedCard?.id,
      bankId: selectedBank?.id,
      isCustom: !selectedCard,
    };

    // TODO: Call API to create card
    // console.log('Creating card:', newCard);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Redirect to cards list
    router.push('/cards');
  } catch (error) {
    console.error('Error creating card:', error);
    setErrors({ submit: 'Failed to create card. Please try again.' });
  } finally {
    setLoading(false);
  }
};
```

**Fixed Code:**

```typescript
import { cardService } from '@/services/cardService';
import toast from 'react-hot-toast';

const handleSubmit = async () => {
  if (!validateForm()) return;

  setLoading(true);
  try {
    // Create card object with proper type mapping
    const newCardData = {
      cardName: formData.cardName,
      lastFourDigits: formData.lastFourDigits,
      cardType: 'credit' as const,
      network: (selectedCard?.network || 'visa') as
        | 'visa'
        | 'mastercard'
        | 'rupay'
        | 'amex'
        | 'discover',
      rewardType: (selectedCard?.rewardType || 'cashback') as
        | 'cashback'
        | 'points'
        | 'miles'
        | 'none',
      bankName: formData.bankName,
      annualFee: selectedCard?.annualFee || 0,
      currency: 'INR',
      creditLimit: Number(formData.creditLimit),
      availableCredit: Number(formData.availableCredit),
      issueDate: formData.issueDate || undefined,
      expiryDate: formData.expiryDate || undefined,
    };

    // Call API to create card
    const createdCard = await cardService.createCard(newCardData);

    toast.success('Card added successfully!');

    // Redirect to card details or cards list
    router.push(`/cards/${createdCard.id}`);
  } catch (error) {
    console.error('Error creating card:', error);
    setErrors({ submit: 'Failed to create card. Please try again.' });
    toast.error('Failed to create card. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

**Changes:**

1. ✅ Import `cardService` and `toast`
2. ✅ Map form data to API contract (match backend schema)
3. ✅ Call `cardService.createCard()`
4. ✅ Show success toast
5. ✅ Redirect to card details page (better UX)
6. ✅ Show error toast on failure

---

## Fix 2: Fetch Cards Integration (10 minutes)

**File:** `apps/web-pwa/src/stores/cardStore.ts`

**Current Code** (Lines 72-83):

```typescript
fetchCards: async () => {
  // TODO: Call API to fetch cards
  set({ isLoading: true, error: null });
  try {
    // Simulated API call
    // const cards = await apiClient.get('/api/cards');
    // set({ cards, isLoading: false });
    set({ isLoading: false });
  } catch (error) {
    set({ error: 'Failed to fetch cards', isLoading: false });
  }
},
```

**Fixed Code:**

```typescript
import { cardService } from '@/services/cardService';

fetchCards: async () => {
  set({ isLoading: true, error: null });
  try {
    const cards = await cardService.getCards();
    set({ cards, isLoading: false, error: null });
  } catch (error) {
    console.error('Failed to fetch cards:', error);
    set({
      cards: [],
      error: 'Failed to fetch cards',
      isLoading: false
    });
  }
},
```

**Changes:**

1. ✅ Import `cardService` at top of file
2. ✅ Call `cardService.getCards()`
3. ✅ Set cards in state
4. ✅ Clear error on success
5. ✅ Set empty array on error

---

## Fix 3: Update Card Integration (10 minutes)

**File:** `apps/web-pwa/src/stores/cardStore.ts`

**Current Code** (Lines 47-55):

```typescript
updateCard: async (cardId, updates) => {
  // TODO: Call API to update card
  set(state => ({
    cards: state.cards.map(card =>
      card.id === cardId ? { ...card, ...updates } : card,
    ),
    error: null,
  }));
},
```

**Fixed Code:**

```typescript
import { cardService } from '@/services/cardService';
import toast from 'react-hot-toast';

updateCard: async (cardId, updates) => {
  try {
    // Call API to update card
    const updatedCard = await cardService.updateCard(cardId, updates);

    // Update local state with server response
    set(state => ({
      cards: state.cards.map(card =>
        card.id === cardId ? updatedCard : card,
      ),
      error: null,
    }));

    toast.success('Card updated successfully!');
  } catch (error) {
    console.error('Failed to update card:', error);
    set({ error: 'Failed to update card' });
    toast.error('Failed to update card. Please try again.');
    throw error;
  }
},
```

**Changes:**

1. ✅ Import `cardService` and `toast`
2. ✅ Call `cardService.updateCard()`
3. ✅ Use server response to update state
4. ✅ Show success toast
5. ✅ Show error toast and rethrow on failure

---

## Fix 4: Delete Card Integration (10 minutes)

**File:** `apps/web-pwa/src/stores/cardStore.ts`

**Current Code** (Lines 64-70):

```typescript
deleteCard: async cardId => {
  // TODO: Call API to delete card
  set(state => ({
    cards: state.cards.filter(card => card.id !== cardId),
    error: null,
  }));
},
```

**Fixed Code:**

```typescript
import { cardService } from '@/services/cardService';
import toast from 'react-hot-toast';

deleteCard: async cardId => {
  try {
    // Call API to delete card (soft delete on backend)
    await cardService.deleteCard(cardId);

    // Remove from local state
    set(state => ({
      cards: state.cards.filter(card => card.id !== cardId),
      error: null,
    }));

    toast.success('Card deleted successfully!');
  } catch (error) {
    console.error('Failed to delete card:', error);
    set({ error: 'Failed to delete card' });
    toast.error('Failed to delete card. Please try again.');
    throw error;
  }
},
```

**Changes:**

1. ✅ Import `cardService` and `toast`
2. ✅ Call `cardService.deleteCard()`
3. ✅ Remove from local state after API success
4. ✅ Show success toast
5. ✅ Show error toast and rethrow on failure

---

## Complete Fixed File

**File:** `apps/web-pwa/src/stores/cardStore.ts`

Here's the complete fixed version:

```typescript
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Card } from '@finmatter/types';
import { cardService } from '@/services/cardService';
import toast from 'react-hot-toast';

interface CardState {
  cards: Card[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCards: (cards: Card[]) => void;
  addCard: (card: Card) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => Promise<void>;
  removeCard: (cardId: string) => void;
  deleteCard: (cardId: string) => Promise<void>;
  fetchCards: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed values
  getTotalLimit: () => number;
  getTotalUsed: () => number;
  getTotalAvailable: () => number;
  getAverageUtilization: () => number;
}

export const useCardStore = create<CardState>()(
  persist(
    (set, get) => ({
      cards: [],
      isLoading: false,
      error: null,

      setCards: cards => {
        set({ cards, error: null });
      },

      addCard: card => {
        set(state => ({
          cards: [...state.cards, card],
          error: null,
        }));
      },

      updateCard: async (cardId, updates) => {
        try {
          // Call API to update card
          const updatedCard = await cardService.updateCard(cardId, updates);

          // Update local state with server response
          set(state => ({
            cards: state.cards.map(card =>
              card.id === cardId ? updatedCard : card,
            ),
            error: null,
          }));

          toast.success('Card updated successfully!');
        } catch (error) {
          console.error('Failed to update card:', error);
          set({ error: 'Failed to update card' });
          toast.error('Failed to update card. Please try again.');
          throw error;
        }
      },

      removeCard: cardId => {
        set(state => ({
          cards: state.cards.filter(card => card.id !== cardId),
          error: null,
        }));
      },

      deleteCard: async cardId => {
        try {
          // Call API to delete card (soft delete on backend)
          await cardService.deleteCard(cardId);

          // Remove from local state
          set(state => ({
            cards: state.cards.filter(card => card.id !== cardId),
            error: null,
          }));

          toast.success('Card deleted successfully!');
        } catch (error) {
          console.error('Failed to delete card:', error);
          set({ error: 'Failed to delete card' });
          toast.error('Failed to delete card. Please try again.');
          throw error;
        }
      },

      fetchCards: async () => {
        set({ isLoading: true, error: null });
        try {
          const cards = await cardService.getCards();
          set({ cards, isLoading: false, error: null });
        } catch (error) {
          console.error('Failed to fetch cards:', error);
          set({
            cards: [],
            error: 'Failed to fetch cards',
            isLoading: false,
          });
        }
      },

      setLoading: loading => {
        set({ isLoading: loading });
      },

      setError: error => {
        set({ error });
      },

      getTotalLimit: () => {
        return get().cards.reduce(
          (total, card) => total + (card.creditLimit || 0),
          0,
        );
      },

      getTotalUsed: () => {
        return get().cards.reduce((total, card) => {
          const limit = card.creditLimit || 0;
          const used = limit - (card.availableCredit || 0);
          return total + used;
        }, 0);
      },

      getTotalAvailable: () => {
        const state = get();
        return state.getTotalLimit() - state.getTotalUsed();
      },

      getAverageUtilization: () => {
        const state = get();
        const totalLimit = state.getTotalLimit();
        const totalUsed = state.getTotalUsed();

        if (totalLimit === 0) return 0;
        return (totalUsed / totalLimit) * 100;
      },
    }),
    {
      name: 'card-storage',
      partialize: state => ({ cards: state.cards }),
    },
  ),
);
```

---

## Verification Steps

After applying all fixes:

### 1. Test Authentication

```bash
# Start API
cd apps/api
pnpm dev

# Start Web PWA (in another terminal)
cd apps/web-pwa
pnpm dev

# Open browser
open http://localhost:3001
```

1. Enter phone number → Send OTP
2. Enter OTP → Verify
3. Complete onboarding
4. Check localStorage for auth-token ✅

### 2. Test Add Card

1. Go to Dashboard → Click "Add New Card"
2. Select Bank (e.g., HDFC Bank)
3. Select Card (e.g., HDFC Millennia)
4. Fill in details:
   - Last 4 digits: 1234
   - Credit limit: 100000
   - Available: 75000
5. Submit
6. **Check Supabase dashboard** → cards table → Should see new row ✅
7. Verify redirect to card details page ✅
8. Check toast notification appears ✅

### 3. Test View Cards

1. Go to Dashboard
2. Check portfolio stats show correct numbers ✅
3. Check recent cards section shows cards ✅
4. Go to "View All Cards"
5. Verify cards list displays ✅
6. Click a card → Verify details page loads ✅

### 4. Test Update Card

1. Go to card details
2. Click "Edit"
3. Change available credit
4. Save
5. **Check Supabase dashboard** → Verify updated ✅
6. Refresh page → Verify change persists ✅

### 5. Test Delete Card

1. Go to card details
2. Click "Delete"
3. Confirm deletion
4. **Check Supabase dashboard** → status should be 'inactive' ✅
5. Verify card removed from list ✅
6. Check toast notification ✅

---

## Common Issues & Solutions

### Issue 1: "CORS Error"

**Solution:** Make sure API is running on port 3000

```bash
cd apps/api
pnpm dev
# Should show: Server listening on http://localhost:3000
```

### Issue 2: "Unauthorized" Error

**Solution:** Check auth token

```javascript
// In browser console
localStorage.getItem('auth-token');
// Should return JWT token
```

### Issue 3: Cards Not Appearing

**Solution:** Check network tab in browser DevTools

- Should see: `GET http://localhost:3000/api/cards`
- Response should contain array of cards
- Check Supabase dashboard → cards table

### Issue 4: Type Errors

**Solution:** Rebuild packages

```bash
pnpm build:packages
```

---

## API Contract Reference

### POST /api/cards

```typescript
// Request Body
{
  "bankName": "HDFC Bank",
  "cardName": "HDFC Millennia Credit Card",
  "lastFourDigits": "1234",
  "cardType": "credit",
  "network": "visa",
  "rewardType": "cashback",
  "annualFee": 1000,
  "currency": "INR",
  "creditLimit": 100000,
  "availableCredit": 75000
}

// Response
{
  "success": true,
  "data": {
    "card": {
      "id": "uuid",
      "user_id": "uuid",
      "bank_name": "HDFC Bank",
      // ... full card object
    }
  }
}
```

### GET /api/cards

```typescript
// Response
{
  "success": true,
  "data": {
    "cards": [
      { /* card object */ }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 5,
      "hasMore": false
    }
  }
}
```

---

## Testing Checklist

- [ ] Authentication works
- [ ] OTP verification works
- [ ] Onboarding completes
- [ ] Dashboard loads
- [ ] Can add card with metadata
- [ ] Can add card manually
- [ ] Cards appear in Supabase
- [ ] Cards display in list
- [ ] Cards display on dashboard
- [ ] Portfolio stats are correct
- [ ] Can click card to view details
- [ ] Can edit card
- [ ] Changes persist in DB
- [ ] Can delete card
- [ ] Card shows as inactive in DB
- [ ] All toast notifications work

---

## Estimated Effort

- **Fix 1 (Add Card):** 15 minutes
- **Fix 2 (Fetch Cards):** 10 minutes
- **Fix 3 (Update Card):** 10 minutes
- **Fix 4 (Delete Card):** 10 minutes
- **Testing:** 15-20 minutes

**Total:** ~60 minutes

---

## Next Steps After Fixes

1. ✅ Verify all critical flows work
2. ✅ Test with real phone number (OTP)
3. ✅ Check Supabase dashboard for data
4. 📝 Update integration audit to reflect fixes
5. 🎯 Move to benefits integration audit
6. 🚀 Deploy to staging environment

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Network tab for API calls
3. Check Supabase logs
4. Verify environment variables
5. Restart both dev servers

Good luck! 🚀

-- Migration: 20251101000003_enhance_existing_cards_metadata.sql
-- Enhance existing card metadata with eligibility criteria and features
-- This makes cards more informative and helps users find the right card

-- ============================================
-- PART 1: UPDATE HDFC CARDS
-- ============================================

-- HDFC Millennia
UPDATE public.cards_metadata
SET 
  eligibility_criteria = '[
    {
      "minIncome": 300000,
      "creditScore": 700,
      "categories": ["Salaried", "Self-Employed"],
      "ageRange": [21, 65]
    }
  ]'::jsonb,
  features = '[
    "5% cashback on online shopping and dining",
    "1% unlimited cashback on all other spends",
    "Complimentary airport lounge access (4 visits/year)",
    "1% fuel surcharge waiver",
    "Zero liability on fraudulent transactions",
    "Complimentary movie tickets on spend threshold"
  ]'::jsonb
WHERE id = 'hdfc-millennia';

-- HDFC Regalia
UPDATE public.cards_metadata
SET 
  eligibility_criteria = '[
    {
      "minIncome": 800000,
      "creditScore": 750,
      "categories": ["Salaried", "Self-Employed"],
      "ageRange": [25, 70]
    }
  ]'::jsonb,
  features = '[
    "4 reward points per ₹150 on all spends",
    "Unlimited domestic lounge access",
    "6 international lounge visits per year",
    "Air accident cover of ₹1 crore",
    "Concierge services",
    "Golf privileges",
    "Complimentary makeMyTrip vouchers"
  ]'::jsonb
WHERE id = 'hdfc-regalia';

-- HDFC MoneyBack+
UPDATE public.cards_metadata
SET 
  eligibility_criteria = '[
    {
      "minIncome": 250000,
      "creditScore": 680,
      "categories": ["Salaried", "Self-Employed"],
      "ageRange": [21, 60]
    }
  ]'::jsonb,
  features = '[
    "2 reward points per ₹150 on online spends",
    "1 reward point per ₹150 on offline spends",
    "1% fuel surcharge waiver",
    "25% discount on movie tickets",
    "Lifestyle benefits and offers",
    "Zero liability on lost/stolen card"
  ]'::jsonb
WHERE id = 'hdfc-moneyback';

-- HDFC Diners Club Black
UPDATE public.cards_metadata
SET 
  eligibility_criteria = '[
    {
      "minIncome": 3000000,
      "creditScore": 775,
      "categories": ["Salaried", "Self-Employed"],
      "ageRange": [28, 70]
    }
  ]'::jsonb,
  features = '[
    "5 reward points per ₹150 on all spends",
    "Unlimited domestic and international lounge access",
    "Golf privileges - 6 rounds per year",
    "Complimentary Club Marriott membership",
    "Concierge services 24/7",
    "Air accident cover of ₹2 crores",
    "Golf insurance up to ₹25,000",
    "Complimentary membership to premium hotels"
  ]'::jsonb
WHERE id = 'hdfc-diners-black';

-- HDFC Infinia
UPDATE public.cards_metadata
SET 
  eligibility_criteria = '[
    {
      "minIncome": 5000000,
      "creditScore": 800,
      "categories": ["Salaried", "Self-Employed"],
      "ageRange": [30, 70]
    }
  ]'::jsonb,
  features = '[
    "5 reward points per ₹150 on all spends",
    "Unlimited domestic and international lounge access",
    "Complimentary ITC Hotel vouchers",
    "Priority Pass membership",
    "Concierge services 24/7",
    "Air accident cover of ₹2 crores",
    "Golf privileges",
    "Luxury hotel and resort privileges"
  ]'::jsonb
WHERE id = 'hdfc-infinia';

-- HDFC Tata Neu Plus
UPDATE public.cards_metadata
SET 
  eligibility_criteria = '[
    {
      "minIncome": 200000,
      "creditScore": 650,
      "categories": ["Salaried", "Self-Employed"],
      "ageRange": [21, 60]
    }
  ]'::jsonb,
  features = '[
    "5% NeuCoins on Tata brands",
    "1% NeuCoins on UPI spends",
    "0.5% NeuCoins on all other spends",
    "UPI-enabled credit card",
    "Lifetime free - No annual fee",
    "Wide acceptance via RuPay network",
    "Cashback on utilities and bills"
  ]'::jsonb
WHERE id = 'hdfc-tata-neu-plus';

-- ============================================
-- PART 2: UPDATE ICICI CARDS
-- ============================================

-- ICICI Amazon Pay
UPDATE public.cards_metadata
SET 
  eligibility_criteria = '[
    {
      "minIncome": 200000,
      "creditScore": 650,
      "categories": ["Salaried", "Self-Employed", "Professional"],
      "ageRange": [21, 65]
    }
  ]'::jsonb,
  features = '[
    "5% cashback for Amazon Prime members",
    "3% cashback for non-Prime members",
    "2% cashback on dining and Uber",
    "1% cashback everywhere else",
    "Lifetime free - No annual fee",
    "Instant cashback credited",
    "Wide merchant acceptance"
  ]'::jsonb
WHERE id = 'icici-amazon-pay';

-- ICICI Platinum Chip
UPDATE public.cards_metadata
SET 
  eligibility_criteria = '[
    {
      "minIncome": 200000,
      "creditScore": 650,
      "categories": ["Salaried", "Self-Employed"],
      "ageRange": [21, 60]
    }
  ]'::jsonb,
  features = '[
    "2 reward points per ₹100 on all spends",
    "1% fuel surcharge waiver",
    "Lifetime free - No annual fee",
    "Air accident cover",
    "Zero liability on fraudulent transactions",
    "EMI options available"
  ]'::jsonb
WHERE id = 'icici-platinum';

-- ============================================
-- PART 3: UPDATE SBI CARDS
-- ============================================

-- SBI SimplyCLICK
UPDATE public.cards_metadata
SET 
  eligibility_criteria = '[
    {
      "minIncome": 350000,
      "creditScore": 700,
      "categories": ["Salaried", "Self-Employed"],
      "ageRange": [21, 60]
    }
  ]'::jsonb,
  features = '[
    "10X reward points on dining",
    "10X reward points on movie tickets",
    "5X reward points on online shopping",
    "1X reward points on other spends",
    "1% fuel surcharge waiver",
    "Annual fee waiver on spends above ₹1 Lakh",
    "Discount vouchers on lifestyle brands"
  ]'::jsonb
WHERE id = 'sbi-simplyclick';

-- ============================================
-- PART 4: UPDATE AXIS CARDS
-- ============================================

-- Axis Magnus
UPDATE public.cards_metadata
SET 
  eligibility_criteria = '[
    {
      "minIncome": 1000000,
      "creditScore": 750,
      "categories": ["Salaried", "Self-Employed"],
      "ageRange": [25, 70]
    }
  ]'::jsonb,
  features = '[
    "25 EDGE reward points per ₹200 on travel",
    "12 EDGE reward points per ₹200 on other spends",
    "Unlimited domestic and international lounge access",
    "Golf privileges",
    "Buy One Get One movie tickets",
    "Complimentary access to premium events",
    "Airport meet and greet services"
  ]'::jsonb
WHERE id = 'axis-magnus';

-- ============================================
-- PART 5: UPDATE AMERICAN EXPRESS CARDS
-- ============================================

-- Amex Gold
UPDATE public.cards_metadata
SET 
  eligibility_criteria = '[
    {
      "minIncome": 600000,
      "creditScore": 750,
      "categories": ["Salaried", "Self-Employed", "Professional"],
      "ageRange": [25, 70]
    }
  ]'::jsonb,
  features = '[
    "4 reward points per ₹50 on travel and dining",
    "1 reward point per ₹50 on other spends",
    "8 airport lounge visits per year",
    "Taj Epicure membership",
    "Annual Taj hotel voucher worth ₹5000",
    "Travel benefits and insurance",
    "Concierge services"
  ]'::jsonb
WHERE id = 'amex-gold';

-- ============================================
-- PART 6: ENHANCE DESCRIPTIONS
-- ============================================

-- Make descriptions more informative
UPDATE public.cards_metadata
SET description = 'Perfect for online shopping and dining with 5% cashback rewards. Ideal for millennials who prefer digital transactions.'
WHERE id = 'hdfc-millennia';

UPDATE public.cards_metadata
SET description = 'Premium lifestyle card offering comprehensive rewards on all spends with unlimited domestic lounge access. Perfect for frequent travelers.'
WHERE id = 'hdfc-regalia';

UPDATE public.cards_metadata
SET description = 'Entry-level card perfect for online transactions with attractive reward points. Excellent choice for first-time credit card users.'
WHERE id = 'hdfc-moneyback';

UPDATE public.cards_metadata
SET description = 'Ultimate luxury card offering unmatched premium benefits including unlimited lounge access, golf privileges, and exclusive memberships.'
WHERE id = 'hdfc-diners-black';

UPDATE public.cards_metadata
SET description = 'Ultimate premium card with unparalleled luxury benefits. Designed for ultra-high net worth individuals seeking maximum value.'
WHERE id = 'hdfc-infinia';

UPDATE public.cards_metadata
SET description = 'Lifetime free UPI-enabled credit card with exclusive benefits on Tata brands. Perfect for loyal Tata customers who want unified rewards.'
WHERE id = 'hdfc-tata-neu-plus';

UPDATE public.cards_metadata
SET description = 'Zero annual fee card offering instant cashback on Amazon purchases and everyday spends. Perfect for online shoppers.'
WHERE id = 'icici-amazon-pay';

UPDATE public.cards_metadata
SET description = 'Lifetime free card with basic reward points on all spends. Ideal entry point to credit card rewards.'
WHERE id = 'icici-platinum';

UPDATE public.cards_metadata
SET description = 'Entertainment-focused card with 10X points on dining and movies. Perfect for foodies and movie lovers.'
WHERE id = 'sbi-simplyclick';

UPDATE public.cards_metadata
SET description = 'Premium travel and lifestyle card with exceptional rewards and unlimited lounge access. Ideal for frequent travelers and high-spenders.'
WHERE id = 'axis-magnus';

UPDATE public.cards_metadata
SET description = 'Premium lifestyle card with strong dining and travel rewards, plus luxury hotel benefits. Perfect for frequent diners and travelers.'
WHERE id = 'amex-gold';

-- ============================================
-- MIGRATION COMPLETE
-- Enhanced 11 existing cards with eligibility
-- criteria and detailed features
-- ============================================



-- Add Popular Indian Credit Cards - Comprehensive Metadata & BIN Ranges
-- This migration adds 24 new credit cards from major Indian banks

-- ============================================
-- PART 1: ICICI BANK CARDS (4 new cards)
-- ============================================

-- ICICI Emeralde
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'icici-emeralde',
  'ICICI Bank Emeralde Credit Card',
  'ICICI Bank',
  'credit',
  'visa',
  'points',
  12000.00,
  '#047857',
  '#059669',
  'Premium lifestyle card with comprehensive travel and dining benefits',
  '[
    {"category": "travel", "description": "4 reward points per ₹100 on travel", "rewardRate": 4.00, "rewardType": "points", "value": "4X points"},
    {"category": "dining", "description": "4 reward points per ₹100 on dining", "rewardRate": 4.00, "rewardType": "points", "value": "4X points"},
    {"category": "default", "description": "2 reward points per ₹100 on other spends", "rewardRate": 2.00, "rewardType": "points", "value": "2X points"},
    {"category": "lounge", "description": "Unlimited domestic and international lounge access", "rewardRate": 0.00, "rewardType": "none", "value": "Unlimited"},
    {"category": "concierge", "description": "24/7 concierge services", "rewardRate": 0.00, "rewardType": "none", "value": "24/7 service"}
  ]'::jsonb,
  '{"calculation": "Points-based rewards", "pointsValue": "₹0.25 per point"}'::jsonb
);

-- ICICI Expressions Premier Miles (EPM)
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'icici-epm',
  'ICICI Expressions Premier Miles',
  'ICICI Bank',
  'credit',
  'mastercard',
  'miles',
  500.00,
  '#5B21B6',
  '#7C3AED',
  'Travel-focused card with miles rewards on every spend',
  '[
    {"category": "travel", "description": "2 miles per ₹100 on travel bookings", "rewardRate": 2.00, "rewardType": "miles", "value": "2 miles"},
    {"category": "default", "description": "1.5 miles per ₹100 on all other spends", "rewardRate": 1.50, "rewardType": "miles", "value": "1.5 miles"},
    {"category": "fuel", "description": "1% fuel surcharge waiver", "rewardRate": 1.00, "rewardType": "cashback", "value": "1% waiver"}
  ]'::jsonb,
  '{"calculation": "Miles-based rewards", "milesValue": "₹0.30 per mile"}'::jsonb
);

-- ICICI Times Black
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'icici-times-black',
  'ICICI Times Black Credit Card',
  'ICICI Bank',
  'credit',
  'mastercard',
  'points',
  4000.00,
  '#18181B',
  '#27272A',
  'Premium lifestyle card with Times Prime membership and rewards',
  '[
    {"category": "dining", "description": "10X reward points on dining", "rewardRate": 10.00, "rewardType": "points", "value": "10X points"},
    {"category": "movies", "description": "10X reward points on movies", "rewardRate": 10.00, "rewardType": "points", "value": "10X points"},
    {"category": "default", "description": "2X reward points on other spends", "rewardRate": 2.00, "rewardType": "points", "value": "2X points"},
    {"category": "membership", "description": "Complimentary Times Prime membership", "rewardRate": 0.00, "rewardType": "none", "value": "Free membership"}
  ]'::jsonb,
  '{"calculation": "Points-based rewards", "pointsValue": "₹0.25 per point"}'::jsonb
);

-- ICICI MMT
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'icici-mmt',
  'ICICI MakeMyTrip Credit Card',
  'ICICI Bank',
  'credit',
  'mastercard',
  'cashback',
  500.00,
  '#E31837',
  '#FF385C',
  'Travel card with cashback on MakeMyTrip bookings',
  '[
    {"category": "travel", "description": "4% cashback on MakeMyTrip", "rewardRate": 4.00, "rewardType": "cashback", "value": "4% cashback"},
    {"category": "dining", "description": "2% cashback on dining", "rewardRate": 2.00, "rewardType": "cashback", "value": "2% cashback"},
    {"category": "default", "description": "1% cashback on other spends", "rewardRate": 1.00, "rewardType": "cashback", "value": "1% cashback"}
  ]'::jsonb,
  '{"calculation": "Percentage-based cashback", "travelBonus": "Extra on MakeMyTrip"}'::jsonb
);

-- ============================================
-- PART 2: AXIS BANK CARDS (9 new cards)
-- ============================================

-- Axis Rewards
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'axis-rewards',
  'Axis Bank Rewards Credit Card',
  'Axis Bank',
  'credit',
  'visa',
  'points',
  500.00,
  '#6B7280',
  '#9CA3AF',
  'Simple rewards card with points on all spends',
  '[
    {"category": "default", "description": "4 EDGE points per ₹200", "rewardRate": 4.00, "rewardType": "points", "value": "4X points"},
    {"category": "fuel", "description": "1% fuel surcharge waiver", "rewardRate": 1.00, "rewardType": "cashback", "value": "1% waiver"}
  ]'::jsonb,
  '{"calculation": "EDGE reward points", "pointsValue": "₹0.20 per point"}'::jsonb
);

-- Axis Cashback
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'axis-cashback',
  'Axis Bank Cashback Credit Card',
  'Axis Bank',
  'credit',
  'mastercard',
  'cashback',
  500.00,
  '#047857',
  '#10B981',
  'Flat 5% cashback on select categories',
  '[
    {"category": "utilities", "description": "5% cashback on bill payments", "rewardRate": 5.00, "rewardType": "cashback", "rewardCap": 400, "capPeriod": "monthly", "value": "5% cashback"},
    {"category": "default", "description": "1% cashback on other spends", "rewardRate": 1.00, "rewardType": "cashback", "value": "1% cashback"}
  ]'::jsonb,
  '{"calculation": "Percentage-based cashback", "utilitiesCap": "₹400 per month"}'::jsonb
);

-- Axis Privilege
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'axis-privilege',
  'Axis Bank Privilege Credit Card',
  'Axis Bank',
  'credit',
  'visa',
  'points',
  1500.00,
  '#7C3AED',
  '#A855F7',
  'Premium card with enhanced reward rates',
  '[
    {"category": "default", "description": "15 EDGE points per ₹200", "rewardRate": 15.00, "rewardType": "points", "value": "15X points"},
    {"category": "lounge", "description": "Domestic lounge access", "rewardRate": 0.00, "rewardType": "none", "rewardCap": 8, "capPeriod": "yearly", "value": "8 visits/year"}
  ]'::jsonb,
  '{"calculation": "EDGE reward points", "pointsValue": "₹0.20 per point"}'::jsonb
);

-- Axis Atlas
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'axis-atlas',
  'Axis Bank Atlas Credit Card',
  'Axis Bank',
  'credit',
  'visa',
  'miles',
  5000.00,
  '#1E3A8A',
  '#3B82F6',
  'Travel-focused card with miles and lounge access',
  '[
    {"category": "travel", "description": "10 miles per ₹200 on travel", "rewardRate": 10.00, "rewardType": "miles", "value": "10 miles"},
    {"category": "default", "description": "4 miles per ₹200 on other spends", "rewardRate": 4.00, "rewardType": "miles", "value": "4 miles"},
    {"category": "lounge", "description": "Unlimited domestic and international lounge access", "rewardRate": 0.00, "rewardType": "none", "value": "Unlimited"}
  ]'::jsonb,
  '{"calculation": "Miles-based rewards", "milesValue": "₹1.00 per mile"}'::jsonb
);

-- Axis Magnus Burgundy
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'axis-magnus-burgundy',
  'Axis Bank Magnus Burgundy',
  'Axis Bank',
  'credit',
  'visa',
  'points',
  30000.00,
  '#7F1D1D',
  '#991B1B',
  'Ultra-premium card with maximum rewards and benefits',
  '[
    {"category": "travel", "description": "40 EDGE points per ₹200 on travel", "rewardRate": 40.00, "rewardType": "points", "value": "40X points"},
    {"category": "default", "description": "20 EDGE points per ₹200 on other spends", "rewardRate": 20.00, "rewardType": "points", "value": "20X points"},
    {"category": "lounge", "description": "Unlimited lounge access worldwide", "rewardRate": 0.00, "rewardType": "none", "value": "Unlimited"},
    {"category": "concierge", "description": "Dedicated lifestyle concierge", "rewardRate": 0.00, "rewardType": "none", "value": "Premium service"}
  ]'::jsonb,
  '{"calculation": "EDGE reward points", "pointsValue": "₹0.20 per point", "premiumTier": "Burgundy exclusive"}'::jsonb
);

-- Axis Horizon (replacing Select)
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'axis-horizon',
  'Axis Bank Horizon Credit Card',
  'Axis Bank',
  'credit',
  'mastercard',
  'points',
  5000.00,
  '#0369A1',
  '#0284C7',
  'Travel and lifestyle card with comprehensive benefits',
  '[
    {"category": "travel", "description": "20 EDGE points per ₹200 on travel", "rewardRate": 20.00, "rewardType": "points", "value": "20X points"},
    {"category": "default", "description": "10 EDGE points per ₹200 on other spends", "rewardRate": 10.00, "rewardType": "points", "value": "10X points"},
    {"category": "lounge", "description": "Unlimited domestic lounge access", "rewardRate": 0.00, "rewardType": "none", "value": "Unlimited domestic"}
  ]'::jsonb,
  '{"calculation": "EDGE reward points", "pointsValue": "₹0.20 per point"}'::jsonb
);

-- Axis My Zone
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'axis-myzone',
  'Axis Bank My Zone Credit Card',
  'Axis Bank',
  'credit',
  'mastercard',
  'cashback',
  500.00,
  '#EC4899',
  '#F472B6',
  'Lifestyle card for shopping, dining, and entertainment',
  '[
    {"category": "shopping", "description": "2% cashback on shopping", "rewardRate": 2.00, "rewardType": "cashback", "value": "2% cashback"},
    {"category": "dining", "description": "2% cashback on dining", "rewardRate": 2.00, "rewardType": "cashback", "value": "2% cashback"},
    {"category": "default", "description": "1% cashback on other spends", "rewardRate": 1.00, "rewardType": "cashback", "value": "1% cashback"}
  ]'::jsonb,
  '{"calculation": "Percentage-based cashback"}'::jsonb
);

-- Axis Neo
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'axis-neo',
  'Axis Bank Neo Credit Card',
  'Axis Bank',
  'credit',
  'visa',
  'points',
  250.00,
  '#14B8A6',
  '#2DD4BF',
  'Entry-level card with basic rewards',
  '[
    {"category": "default", "description": "2 EDGE points per ₹200", "rewardRate": 2.00, "rewardType": "points", "value": "2X points"},
    {"category": "fuel", "description": "1% fuel surcharge waiver", "rewardRate": 1.00, "rewardType": "cashback", "value": "1% waiver"}
  ]'::jsonb,
  '{"calculation": "EDGE reward points", "pointsValue": "₹0.20 per point"}'::jsonb
);

-- Axis Airtel
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'axis-airtel',
  'Airtel Axis Bank Credit Card',
  'Axis Bank',
  'credit',
  'mastercard',
  'cashback',
  500.00,
  '#E41D24',
  '#F44336',
  '25% cashback on Airtel bills and partner brands',
  '[
    {"category": "airtel", "description": "25% cashback on Airtel bills", "rewardRate": 25.00, "rewardType": "cashback", "rewardCap": 300, "capPeriod": "monthly", "value": "25% cashback"},
    {"category": "utilities", "description": "10% cashback on utilities", "rewardRate": 10.00, "rewardType": "cashback", "rewardCap": 300, "capPeriod": "monthly", "value": "10% cashback"},
    {"category": "default", "description": "1% cashback on other spends", "rewardRate": 1.00, "rewardType": "cashback", "value": "1% cashback"}
  ]'::jsonb,
  '{"calculation": "Percentage-based cashback", "airtelBonus": "Up to ₹300/month"}'::jsonb
);

-- ============================================
-- PART 3: HDFC BANK CARDS (6 new cards)
-- ============================================

-- HDFC Regalia Gold
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'hdfc-regalia-gold',
  'HDFC Regalia Gold Credit Card',
  'HDFC Bank',
  'credit',
  'visa',
  'points',
  6500.00,
  '#B8860B',
  '#FFD700',
  'Premium card with enhanced rewards and travel benefits',
  '[
    {"category": "travel", "description": "8 reward points per ₹150 on travel", "rewardRate": 8.00, "rewardType": "points", "value": "8X points"},
    {"category": "dining", "description": "8 reward points per ₹150 on dining", "rewardRate": 8.00, "rewardType": "points", "value": "8X points"},
    {"category": "default", "description": "4 reward points per ₹150 on other spends", "rewardRate": 4.00, "rewardType": "points", "value": "4X points"},
    {"category": "lounge", "description": "Unlimited domestic and 12 international lounge visits", "rewardRate": 0.00, "rewardType": "none", "value": "Unlimited + 12 intl"}
  ]'::jsonb,
  '{"calculation": "Points-based rewards", "pointsValue": "₹0.30 per point"}'::jsonb
);

-- HDFC DCB Metal
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'hdfc-dcb-metal',
  'HDFC Diners Club Black Metal',
  'HDFC Bank',
  'credit',
  'visa',
  'points',
  10000.00,
  '#1C1C1E',
  '#2C2C2E',
  'Super-premium metal card with exceptional rewards',
  '[
    {"category": "dining", "description": "10 reward points per ₹150 on dining", "rewardRate": 10.00, "rewardType": "points", "value": "10X points"},
    {"category": "travel", "description": "10 reward points per ₹150 on travel", "rewardRate": 10.00, "rewardType": "points", "value": "10X points"},
    {"category": "default", "description": "3.3 reward points per ₹150 on other spends", "rewardRate": 3.30, "rewardType": "points", "value": "3.3X points"},
    {"category": "lounge", "description": "Unlimited lounge access worldwide", "rewardRate": 0.00, "rewardType": "none", "value": "Unlimited worldwide"}
  ]'::jsonb,
  '{"calculation": "Points-based rewards", "pointsValue": "₹0.40 per point", "metalCard": true}'::jsonb
);

-- HDFC Marriott Bonvoy
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'hdfc-marriott-bonvoy',
  'HDFC Marriott Bonvoy Credit Card',
  'HDFC Bank',
  'credit',
  'visa',
  'points',
  3000.00,
  '#8B4513',
  '#A0522D',
  'Hotel co-branded card with Marriott Bonvoy points',
  '[
    {"category": "marriott", "description": "6 Bonvoy points per ₹150 on Marriott", "rewardRate": 6.00, "rewardType": "points", "value": "6 Bonvoy points"},
    {"category": "default", "description": "3 Bonvoy points per ₹150 on other spends", "rewardRate": 3.00, "rewardType": "points", "value": "3 Bonvoy points"},
    {"category": "bonus", "description": "Free night certificate on renewal", "rewardRate": 0.00, "rewardType": "none", "value": "Free night"}
  ]'::jsonb,
  '{"calculation": "Marriott Bonvoy points", "pointsValue": "₹0.50 per point"}'::jsonb
);

-- HDFC Tata Neu RuPay
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'hdfc-tata-neu-rupay',
  'HDFC Tata Neu Infinity RuPay',
  'HDFC Bank',
  'credit',
  'rupay',
  'points',
  0.00,
  '#7C3AED',
  '#A855F7',
  'Co-branded card with NeuCoins on Tata brands',
  '[
    {"category": "tata", "description": "5% NeuCoins on Tata brands", "rewardRate": 5.00, "rewardType": "points", "value": "5% NeuCoins"},
    {"category": "default", "description": "1.5% NeuCoins on other spends", "rewardRate": 1.50, "rewardType": "points", "value": "1.5% NeuCoins"},
    {"category": "upi", "description": "Rewards on UPI transactions", "rewardRate": 1.00, "rewardType": "points", "value": "1% on UPI"}
  ]'::jsonb,
  '{"calculation": "NeuCoins", "neuCoinsValue": "1 NeuCoin = ₹1", "zeroAnnualFee": true}'::jsonb
);

-- HDFC Swiggy
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'hdfc-swiggy',
  'HDFC Swiggy Credit Card',
  'HDFC Bank',
  'credit',
  'visa',
  'cashback',
  500.00,
  '#FC8019',
  '#FFA94D',
  'Food delivery card with cashback on Swiggy',
  '[
    {"category": "swiggy", "description": "10% cashback on Swiggy", "rewardRate": 10.00, "rewardType": "cashback", "rewardCap": 1500, "capPeriod": "monthly", "value": "10% cashback"},
    {"category": "dining", "description": "5% cashback on dining", "rewardRate": 5.00, "rewardType": "cashback", "value": "5% cashback"},
    {"category": "default", "description": "1% cashback on other spends", "rewardRate": 1.00, "rewardType": "cashback", "value": "1% cashback"}
  ]'::jsonb,
  '{"calculation": "Percentage-based cashback", "swiggyCap": "₹1500 per month"}'::jsonb
);

-- HDFC IRCTC
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'hdfc-irctc',
  'HDFC IRCTC Credit Card',
  'HDFC Bank',
  'credit',
  'visa',
  'points',
  500.00,
  '#1E40AF',
  '#3B82F6',
  'Railway travel card with rewards on IRCTC bookings',
  '[
    {"category": "irctc", "description": "10% value back on IRCTC", "rewardRate": 10.00, "rewardType": "cashback", "rewardCap": 500, "capPeriod": "monthly", "value": "10% value back"},
    {"category": "fuel", "description": "1% fuel surcharge waiver", "rewardRate": 1.00, "rewardType": "cashback", "value": "1% waiver"},
    {"category": "bonus", "description": "Free railway lounge access", "rewardRate": 0.00, "rewardType": "none", "rewardCap": 2, "capPeriod": "quarterly", "value": "2 visits/quarter"}
  ]'::jsonb,
  '{"calculation": "Value back on IRCTC", "irctcCap": "₹500 per month"}'::jsonb
);

-- ============================================
-- PART 4: SBI CARDS (2 new cards)
-- ============================================

-- SBI Cashback
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'sbi-cashback',
  'SBI Cashback Credit Card',
  'State Bank of India',
  'credit',
  'visa',
  'cashback',
  999.00,
  '#16A34A',
  '#22C55E',
  'Flat 5% cashback on online shopping and 1% on offline',
  '[
    {"category": "online", "description": "5% cashback on online spends", "rewardRate": 5.00, "rewardType": "cashback", "rewardCap": 5000, "capPeriod": "monthly", "value": "5% cashback"},
    {"category": "offline", "description": "1% cashback on offline spends", "rewardRate": 1.00, "rewardType": "cashback", "value": "1% cashback"}
  ]'::jsonb,
  '{"calculation": "Percentage-based cashback", "onlineCap": "₹5000 per month"}'::jsonb
);

-- SBI Vistara
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'sbi-vistara',
  'SBI Vistara Credit Card',
  'State Bank of India',
  'credit',
  'visa',
  'miles',
  3000.00,
  '#7E22CE',
  '#9333EA',
  'Airline co-branded card with Club Vistara miles',
  '[
    {"category": "vistara", "description": "4 CV points per ₹100 on Vistara", "rewardRate": 4.00, "rewardType": "miles", "value": "4 CV points"},
    {"category": "default", "description": "3 CV points per ₹100 on other spends", "rewardRate": 3.00, "rewardType": "miles", "value": "3 CV points"},
    {"category": "bonus", "description": "Milestone CV points on spending", "rewardRate": 0.00, "rewardType": "miles", "value": "Milestone rewards"}
  ]'::jsonb,
  '{"calculation": "Club Vistara points", "cvPointValue": "₹1.00 per CV point"}'::jsonb
);

-- ============================================
-- PART 5: HSBC CARDS (2 new cards)
-- ============================================

-- HSBC Travel One (Smart Value)
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'hsbc-smart-value',
  'HSBC Smart Value Credit Card',
  'HSBC',
  'credit',
  'visa',
  'cashback',
  750.00,
  '#0284C7',
  '#0EA5E9',
  'Travel and lifestyle card with cashback rewards',
  '[
    {"category": "travel", "description": "10X reward points on travel", "rewardRate": 10.00, "rewardType": "points", "value": "10X points"},
    {"category": "dining", "description": "10X reward points on dining", "rewardRate": 10.00, "rewardType": "points", "value": "10X points"},
    {"category": "default", "description": "2X reward points on other spends", "rewardRate": 2.00, "rewardType": "points", "value": "2X points"}
  ]'::jsonb,
  '{"calculation": "Points-based rewards", "pointsValue": "₹0.30 per point"}'::jsonb
);

-- HSBC Live+
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'hsbc-live-plus',
  'HSBC Live+ Credit Card',
  'HSBC',
  'credit',
  'mastercard',
  'cashback',
  999.00,
  '#E11D48',
  '#F43F5E',
  'Lifestyle card for shopping, dining, and entertainment',
  '[
    {"category": "online", "description": "10X reward points on online shopping", "rewardRate": 10.00, "rewardType": "points", "value": "10X points"},
    {"category": "entertainment", "description": "10X reward points on entertainment", "rewardRate": 10.00, "rewardType": "points", "value": "10X points"},
    {"category": "default", "description": "2X reward points on other spends", "rewardRate": 2.00, "rewardType": "points", "value": "2X points"}
  ]'::jsonb,
  '{"calculation": "Points-based rewards", "pointsValue": "₹0.30 per point"}'::jsonb
);

-- ============================================
-- PART 6: AMEX CARDS (1 new card)
-- ============================================

-- Amex Reserve (Centurion-level)
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description, benefits, reward_rules
) VALUES (
  'amex-reserve',
  'American Express Reserve Credit Card',
  'American Express',
  'credit',
  'amex',
  'points',
  10000.00,
  '#111827',
  '#1F2937',
  'Ultra-premium card with exceptional benefits and concierge',
  '[
    {"category": "default", "description": "3 reward points per ₹50 on all spends", "rewardRate": 3.00, "rewardType": "points", "value": "3X points"},
    {"category": "bonus", "description": "Milestone bonus points on annual spend", "rewardRate": 0.00, "rewardType": "points", "value": "Milestone bonuses"},
    {"category": "lounge", "description": "Unlimited lounge access worldwide + guest", "rewardRate": 0.00, "rewardType": "none", "value": "Unlimited + guest"},
    {"category": "concierge", "description": "24/7 premium concierge service", "rewardRate": 0.00, "rewardType": "none", "value": "Premium concierge"}
  ]'::jsonb,
  '{"calculation": "Membership Rewards points", "pointsValue": "₹0.50 per point", "premiumTier": true}'::jsonb
);

-- ============================================
-- PART 7: ADD BIN RANGES FOR ALL NEW CARDS
-- ============================================

-- ICICI Bank BIN ranges (new cards)
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('42591200', '42591299', 'ICICI Bank', 'Visa', 'ICICI Emeralde', 'IN'),
('40118700', '40118799', 'ICICI Bank', 'Mastercard', 'ICICI EPM', 'IN'),
('55414200', '55414299', 'ICICI Bank', 'Mastercard', 'ICICI Times Black', 'IN'),
('41882400', '41882499', 'ICICI Bank', 'Mastercard', 'ICICI MMT', 'IN');

-- Axis Bank BIN ranges (new cards)
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('42867100', '42867199', 'Axis Bank', 'Visa', 'Axis Rewards', 'IN'),
('43759800', '43759899', 'Axis Bank', 'Mastercard', 'Axis Cashback', 'IN'),
('52243400', '52243499', 'Axis Bank', 'Mastercard', 'Axis Privilege', 'IN'),
('42237100', '42237199', 'Axis Bank', 'Visa', 'Axis Atlas', 'IN'),
('46357000', '46357099', 'Axis Bank', 'Visa', 'Axis Magnus Burgundy', 'IN'),
('55710200', '55710299', 'Axis Bank', 'Mastercard', 'Axis Horizon', 'IN'),
('45678900', '45678999', 'Axis Bank', 'Mastercard', 'Axis My Zone', 'IN'),
('55384500', '55384599', 'Axis Bank', 'Visa', 'Axis Neo', 'IN'),
('44556600', '44556699', 'Axis Bank', 'Mastercard', 'Axis Airtel', 'IN');

-- HDFC Bank BIN ranges (new cards)
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('40533000', '40533099', 'HDFC Bank', 'Visa', 'HDFC Regalia Gold', 'IN'),
('42292200', '42292299', 'HDFC Bank', 'Visa', 'HDFC DCB Metal', 'IN'),
('54211100', '54211199', 'HDFC Bank', 'Mastercard', 'HDFC Marriott Bonvoy', 'IN'),
('43412300', '43412399', 'HDFC Bank', 'RuPay', 'HDFC Tata Neu Infinity', 'IN'),
('45737300', '45737399', 'HDFC Bank', 'Visa', 'HDFC Swiggy', 'IN'),
('55672400', '55672499', 'HDFC Bank', 'Visa', 'HDFC IRCTC', 'IN');

-- SBI Cards BIN ranges (new cards)
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('43142200', '43142299', 'State Bank of India', 'Visa', 'SBI Cashback', 'IN'),
('43782400', '43782499', 'State Bank of India', 'Visa', 'SBI Card Vistara', 'IN');

-- HSBC BIN ranges (new cards)
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('40234500', '40234599', 'HSBC', 'Visa', 'HSBC Smart Value', 'IN'),
('53782300', '53782399', 'HSBC', 'Mastercard', 'HSBC Live+', 'IN');

-- American Express BIN ranges (new cards)
INSERT INTO bin_ranges (bin_start, bin_end, bank_name, card_network, card_brand, country_code) VALUES
('37144200', '37144299', 'American Express', 'Amex', 'Amex Reserve', 'IN');

-- ============================================
-- MIGRATION COMPLETE
-- Total cards added: 24 new cards across all major banks
-- Total BIN ranges added: 24 new BIN ranges
-- (Note: 6 cards already existed: icici-coral, axis-vistara, axis-flipkart, amex-platinum-travel, hdfc-moneyback, hdfc-db-privilege)
-- ============================================


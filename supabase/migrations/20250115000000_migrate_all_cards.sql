-- Migration: 20250115000000_migrate_all_cards.sql
-- Complete migration of all cards from CARD_DATABASE to cards_metadata table

-- ============================================
-- 1. Add remaining HDFC cards
-- ============================================

-- HDFC MoneyBack+ Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'hdfc-moneyback',
  'HDFC MoneyBack+ Credit Card',
  'HDFC Bank',
  'credit',
  'visa',
  'points',
  500.00,
  '#FF6B35',
  '#FF8C42',
  'Perfect for online transactions with reward points',
  '[
    {
      "category": "online",
      "description": "2 reward points per ₹150 on online spends",
      "rewardRate": 2.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Online transactions only"],
      "value": "2 points"
    },
    {
      "category": "default",
      "description": "1 reward point per ₹150 on offline spends",
      "rewardRate": 1.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "1 point"
    },
    {
      "category": "fuel",
      "description": "1% fuel surcharge waiver",
      "rewardRate": 1.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Surcharge waiver"],
      "value": "1% waiver"
    }
  ]'::jsonb,
  '{
    "calculation": "Points-based rewards",
    "pointsValue": "₹0.25 per point",
    "onlineBonus": "2X points on online transactions",
    "minimumSpend": 150,
    "creditLimit": "Standard range"
  }'::jsonb
);

-- HDFC Diners Club Black
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'hdfc-diners-black',
  'HDFC Diners Club Black',
  'HDFC Bank',
  'credit',
  'mastercard',
  'points',
  10000.00,
  '#000000',
  '#1A1A1A',
  'Ultimate luxury card with premium benefits',
  '[
    {
      "category": "default",
      "description": "5 reward points per ₹150 spent",
      "rewardRate": 3.30,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "5 points"
    },
    {
      "category": "lounge",
      "description": "Unlimited domestic and international lounge access",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Unlimited access"],
      "value": "Unlimited"
    },
    {
      "category": "golf",
      "description": "Golf privileges - 6 rounds per year",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": 6.00,
      "capPeriod": "yearly",
      "conditions": ["Golf privileges"],
      "value": "6 rounds"
    },
    {
      "category": "membership",
      "description": "Complimentary Club Marriott membership",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Complimentary"],
      "value": "Membership"
    }
  ]'::jsonb,
  '{
    "calculation": "Premium points system",
    "pointsValue": "₹0.25 per point",
    "premiumFeatures": "Lounge access, golf, membership",
    "minimumSpend": 150,
    "creditLimit": "Premium range"
  }'::jsonb
);

-- HDFC Infinia Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'hdfc-infinia',
  'HDFC Infinia Credit Card',
  'HDFC Bank',
  'credit',
  'visa',
  'points',
  12500.00,
  '#4A148C',
  '#7B1FA2',
  'Ultimate premium card with luxury benefits',
  '[
    {
      "category": "default",
      "description": "5 reward points per ₹150 spent",
      "rewardRate": 3.30,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "5 points"
    },
    {
      "category": "lounge",
      "description": "Unlimited domestic and international lounge access",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Unlimited access"],
      "value": "Unlimited"
    },
    {
      "category": "hotel",
      "description": "Complimentary ITC Hotel vouchers",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Complimentary vouchers"],
      "value": "Vouchers"
    },
    {
      "category": "membership",
      "description": "Priority Pass membership",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Priority Pass"],
      "value": "Membership"
    },
    {
      "category": "concierge",
      "description": "Concierge services",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Concierge services"],
      "value": "Services"
    }
  ]'::jsonb,
  '{
    "calculation": "Ultimate premium points",
    "pointsValue": "₹0.25 per point",
    "luxuryFeatures": "Lounge access, hotel vouchers, concierge",
    "minimumSpend": 150,
    "creditLimit": "Ultra premium range"
  }'::jsonb
);

-- HDFC Tata Neu Plus Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'hdfc-tata-neu-plus',
  'HDFC Tata Neu Plus Credit Card',
  'HDFC Bank',
  'credit',
  'rupay',
  'points',
  0.00,
  '#1C4587',
  '#4A90E2',
  'Lifetime free UPI-enabled card with Tata brand benefits',
  '[
    {
      "category": "tata",
      "description": "5% NeuCoins on all Tata brands",
      "rewardRate": 5.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Tata brands: BigBasket, 1mg, Croma, Westside, Titan, etc."],
      "value": "5% NeuCoins"
    },
    {
      "category": "upi",
      "description": "1% NeuCoins on UPI spends",
      "rewardRate": 1.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["UPI transactions only"],
      "value": "1% NeuCoins"
    },
    {
      "category": "default",
      "description": "0.5% NeuCoins on other spends",
      "rewardRate": 0.50,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "0.5% NeuCoins"
    }
  ]'::jsonb,
  '{
    "calculation": "NeuCoins system",
    "coinsValue": "₹1 per NeuCoin",
    "tataBrandBonus": "5% on Tata brands",
    "upiEnabled": "UPI credit card",
    "lifetimeFree": "No annual fee"
  }'::jsonb
);

-- ============================================
-- 2. Add ICICI cards
-- ============================================

-- ICICI Platinum Chip Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'icici-platinum',
  'ICICI Platinum Chip Credit Card',
  'ICICI Bank',
  'credit',
  'visa',
  'points',
  0.00,
  '#C0C0C0',
  '#A8A8A8',
  'Lifetime free card with basic rewards',
  '[
    {
      "category": "default",
      "description": "2 reward points per ₹100 spent",
      "rewardRate": 2.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "2 points"
    },
    {
      "category": "fuel",
      "description": "1% fuel surcharge waiver",
      "rewardRate": 1.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Surcharge waiver"],
      "value": "1% waiver"
    },
    {
      "category": "insurance",
      "description": "Lost card liability cover",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Lost card liability"],
      "value": "Cover"
    }
  ]'::jsonb,
  '{
    "calculation": "Basic points system",
    "pointsValue": "₹0.25 per point",
    "lifetimeFree": "No annual fee",
    "minimumSpend": 100,
    "creditLimit": "Standard range"
  }'::jsonb
);

-- ICICI Sapphiro Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'icici-sapphiro',
  'ICICI Sapphiro Credit Card',
  'ICICI Bank',
  'credit',
  'visa',
  'points',
  3500.00,
  '#0F52BA',
  '#4169E1',
  'Premium travel-focused card with lounge benefits',
  '[
    {
      "category": "travel",
      "description": "4 reward points per ₹100 on travel",
      "rewardRate": 4.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "4 points"
    },
    {
      "category": "default",
      "description": "2 reward points per ₹100 on other spends",
      "rewardRate": 2.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "2 points"
    },
    {
      "category": "lounge",
      "description": "Unlimited domestic lounge access",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Unlimited domestic access"],
      "value": "Unlimited"
    },
    {
      "category": "lounge",
      "description": "12 international lounge visits per year",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": 12.00,
      "capPeriod": "yearly",
      "conditions": ["International access"],
      "value": "12 visits"
    }
  ]'::jsonb,
  '{
    "calculation": "Travel-focused points",
    "pointsValue": "₹0.25 per point",
    "travelBonus": "4X points on travel",
    "minimumSpend": 100,
    "creditLimit": "Premium range"
  }'::jsonb
);

-- ICICI Coral Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'icici-coral',
  'ICICI Coral Credit Card',
  'ICICI Bank',
  'credit',
  'visa',
  'points',
  500.00,
  '#FF7F50',
  '#FF6347',
  'Dining-focused card with lounge access',
  '[
    {
      "category": "dining",
      "description": "2 reward points per ₹100 on dining",
      "rewardRate": 2.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "2 points"
    },
    {
      "category": "default",
      "description": "1 reward point per ₹100 on other spends",
      "rewardRate": 1.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "1 point"
    },
    {
      "category": "lounge",
      "description": "2 complimentary airport lounge visits per year",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": 2.00,
      "capPeriod": "yearly",
      "conditions": ["Complimentary access"],
      "value": "2 visits"
    },
    {
      "category": "fuel",
      "description": "1% fuel surcharge waiver",
      "rewardRate": 1.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Surcharge waiver"],
      "value": "1% waiver"
    }
  ]'::jsonb,
  '{
    "calculation": "Dining-focused points",
    "pointsValue": "₹0.25 per point",
    "diningBonus": "2X points on dining",
    "minimumSpend": 100,
    "creditLimit": "Standard range"
  }'::jsonb
);

-- ICICI Manchester United Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'icici-manchester-united',
  'ICICI Manchester United Credit Card',
  'ICICI Bank',
  'credit',
  'visa',
  'points',
  500.00,
  '#DA291C',
  '#FFD700',
  'Football-themed card for Manchester United fans',
  '[
    {
      "category": "default",
      "description": "2 reward points per ₹100 spent",
      "rewardRate": 2.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "2 points"
    },
    {
      "category": "merchandise",
      "description": "Exclusive Manchester United merchandise",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Exclusive merchandise"],
      "value": "Merchandise"
    },
    {
      "category": "fuel",
      "description": "1% fuel surcharge waiver",
      "rewardRate": 1.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Surcharge waiver"],
      "value": "1% waiver"
    }
  ]'::jsonb,
  '{
    "calculation": "Basic points with theme",
    "pointsValue": "₹0.25 per point",
    "themeBenefits": "Manchester United merchandise",
    "minimumSpend": 100,
    "creditLimit": "Standard range"
  }'::jsonb
);

-- ============================================
-- 3. Add SBI cards
-- ============================================

-- SBI SimplySAVE Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'sbi-simplysave',
  'SBI SimplySAVE Credit Card',
  'State Bank of India',
  'credit',
  'visa',
  'cashback',
  499.00,
  '#28A745',
  '#20C997',
  'Cashback-focused card for everyday spending',
  '[
    {
      "category": "dining",
      "description": "10% cashback on dining",
      "rewardRate": 10.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "10% cashback"
    },
    {
      "category": "groceries",
      "description": "5% cashback on grocery shopping",
      "rewardRate": 5.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "5% cashback"
    },
    {
      "category": "default",
      "description": "1% cashback on other spends",
      "rewardRate": 1.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "1% cashback"
    },
    {
      "category": "fuel",
      "description": "1% fuel surcharge waiver",
      "rewardRate": 1.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Surcharge waiver"],
      "value": "1% waiver"
    }
  ]'::jsonb,
  '{
    "calculation": "Cashback system",
    "diningBonus": "10% on dining",
    "groceryBonus": "5% on groceries",
    "minimumSpend": 100,
    "creditLimit": "Standard range"
  }'::jsonb
);

-- SBI Card PRIME
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'sbi-prime',
  'SBI Card PRIME',
  'State Bank of India',
  'credit',
  'visa',
  'points',
  2999.00,
  '#6F42C1',
  '#9B59B6',
  'Premium card with high reward points',
  '[
    {
      "category": "default",
      "description": "10X reward points on all spends",
      "rewardRate": 10.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "10X points"
    },
    {
      "category": "lounge",
      "description": "Unlimited domestic airport lounge access",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Unlimited domestic access"],
      "value": "Unlimited"
    },
    {
      "category": "lounge",
      "description": "2 international lounge visits per year",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": 2.00,
      "capPeriod": "yearly",
      "conditions": ["International access"],
      "value": "2 visits"
    },
    {
      "category": "golf",
      "description": "Complimentary golf lessons",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Complimentary lessons"],
      "value": "Lessons"
    }
  ]'::jsonb,
  '{
    "calculation": "High multiplier points",
    "pointsValue": "₹0.25 per point",
    "highMultiplier": "10X on all spends",
    "minimumSpend": 100,
    "creditLimit": "Premium range"
  }'::jsonb
);

-- SBI Card Aurum
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'sbi-aurum',
  'SBI Card Aurum',
  'State Bank of India',
  'credit',
  'visa',
  'points',
  4999.00,
  '#FFD700',
  '#FFA500',
  'Ultra premium card with maximum rewards',
  '[
    {
      "category": "default",
      "description": "15X reward points on all spends",
      "rewardRate": 15.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "15X points"
    },
    {
      "category": "lounge",
      "description": "Unlimited domestic airport lounge access",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Unlimited domestic access"],
      "value": "Unlimited"
    },
    {
      "category": "lounge",
      "description": "6 international lounge visits per year",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": 6.00,
      "capPeriod": "yearly",
      "conditions": ["International access"],
      "value": "6 visits"
    },
    {
      "category": "golf",
      "description": "Golf privileges",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Golf privileges"],
      "value": "Privileges"
    },
    {
      "category": "movies",
      "description": "Movie ticket discounts",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Movie ticket discounts"],
      "value": "Discounts"
    }
  ]'::jsonb,
  '{
    "calculation": "Maximum multiplier points",
    "pointsValue": "₹0.25 per point",
    "maximumMultiplier": "15X on all spends",
    "luxuryFeatures": "Golf, movies, lounge access",
    "minimumSpend": 100,
    "creditLimit": "Ultra premium range"
  }'::jsonb
);

-- ============================================
-- 4. Add Axis cards
-- ============================================

-- Axis Vistara Infinite Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'axis-vistara',
  'Axis Vistara Infinite Credit Card',
  'Axis Bank',
  'credit',
  'visa',
  'miles',
  10000.00,
  '#4B0082',
  '#663399',
  'Travel-focused card with Vistara airline benefits',
  '[
    {
      "category": "travel",
      "description": "10 CV Points per ₹100 on travel bookings",
      "rewardRate": 10.00,
      "rewardType": "miles",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "10 CV Points"
    },
    {
      "category": "default",
      "description": "4 CV Points per ₹100 on other spends",
      "rewardRate": 4.00,
      "rewardType": "miles",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "4 CV Points"
    },
    {
      "category": "tickets",
      "description": "2 complimentary Vistara tickets per year",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": 2.00,
      "capPeriod": "yearly",
      "conditions": ["Complimentary tickets"],
      "value": "2 tickets"
    },
    {
      "category": "lounge",
      "description": "Unlimited airport lounge access",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Unlimited access"],
      "value": "Unlimited"
    },
    {
      "category": "priority",
      "description": "Priority check-in and boarding",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Priority services"],
      "value": "Priority"
    }
  ]'::jsonb,
  '{
    "calculation": "Vistara miles system",
    "milesValue": "₹1 per CV Point",
    "travelBonus": "10X miles on travel",
    "airlineBenefits": "Complimentary tickets, priority services",
    "minimumSpend": 100,
    "creditLimit": "Premium range"
  }'::jsonb
);

-- Flipkart Axis Bank Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'axis-flipkart',
  'Flipkart Axis Bank Credit Card',
  'Axis Bank',
  'credit',
  'visa',
  'cashback',
  500.00,
  '#2874F0',
  '#FFE600',
  'E-commerce focused card with Flipkart benefits',
  '[
    {
      "category": "flipkart",
      "description": "5% cashback on Flipkart, Myntra, 2GUD",
      "rewardRate": 5.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Flipkart, Myntra, 2GUD purchases"],
      "value": "5% cashback"
    },
    {
      "category": "dining",
      "description": "4% cashback on dining and Swiggy/Zomato",
      "rewardRate": 4.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Dining and Swiggy/Zomato"],
      "value": "4% cashback"
    },
    {
      "category": "default",
      "description": "1.5% cashback on other spends",
      "rewardRate": 1.50,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "1.5% cashback"
    },
    {
      "category": "bills",
      "description": "Unlimited 1% cashback on bill payments",
      "rewardRate": 1.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Bill payments"],
      "value": "1% cashback"
    }
  ]'::jsonb,
  '{
    "calculation": "E-commerce cashback system",
    "flipkartBonus": "5% on Flipkart ecosystem",
    "diningBonus": "4% on dining and food delivery",
    "billPayments": "Unlimited 1% on bills",
    "minimumSpend": 100,
    "creditLimit": "Standard range"
  }'::jsonb
);

-- ============================================
-- 5. Add remaining Amex cards
-- ============================================

-- American Express Platinum Travel Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'amex-platinum-travel',
  'American Express Platinum Travel Card',
  'American Express',
  'credit',
  'amex',
  'points',
  3500.00,
  '#C0C0C0',
  '#E8E8E8',
  'Travel-focused card with premium benefits',
  '[
    {
      "category": "travel",
      "description": "10 reward points per ₹50 on travel bookings",
      "rewardRate": 10.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "10 points"
    },
    {
      "category": "default",
      "description": "1 reward point per ₹50 on other spends",
      "rewardRate": 1.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "1 point"
    },
    {
      "category": "membership",
      "description": "Complimentary Priority Pass membership",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Priority Pass"],
      "value": "Membership"
    },
    {
      "category": "lounge",
      "description": "Unlimited lounge access",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Unlimited access"],
      "value": "Unlimited"
    },
    {
      "category": "insurance",
      "description": "Travel insurance up to ₹50 lakhs",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": 5000000.00,
      "capPeriod": null,
      "conditions": ["Travel insurance"],
      "value": "₹50 lakhs"
    }
  ]'::jsonb,
  '{
    "calculation": "Travel-focused points",
    "pointsValue": "₹0.25 per point",
    "travelBonus": "10X points on travel",
    "premiumFeatures": "Priority Pass, travel insurance",
    "minimumSpend": 50,
    "creditLimit": "Premium range"
  }'::jsonb
);

-- American Express Membership Rewards Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules
) VALUES (
  'amex-mrcc',
  'American Express Membership Rewards Card',
  'American Express',
  'credit',
  'amex',
  'points',
  1000.00,
  '#006FCF',
  '#0099FF',
  'Flexible rewards card with bonus points',
  '[
    {
      "category": "default",
      "description": "1 reward point per ₹50 on all spends",
      "rewardRate": 1.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "1 point"
    },
    {
      "category": "bonus",
      "description": "1000 bonus points on spending ₹6000 in a month (4 times per year)",
      "rewardRate": 999.99,
      "rewardType": "points",
      "rewardCap": 4.00,
      "capPeriod": "yearly",
      "conditions": ["Spend ₹6000 in a month"],
      "value": "1000 bonus points"
    },
    {
      "category": "conversion",
      "description": "Convert points to frequent flyer miles",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Convert to miles"],
      "value": "Conversion"
    }
  ]'::jsonb,
  '{
    "calculation": "Flexible points with bonuses",
    "pointsValue": "₹0.25 per point",
    "bonusSystem": "1000 bonus points monthly (4 times/year)",
    "conversionOptions": "Convert to airline miles",
    "minimumSpend": 50,
    "creditLimit": "Standard range"
  }'::jsonb
);


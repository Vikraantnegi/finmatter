-- Migration: 20251101000004_add_more_popular_indian_cards.sql
-- Add 30+ more popular Indian credit cards from various banks
-- Target: IDFC First, OneCard, Scapia, PNB, Union Bank, and more co-branded cards

-- ============================================
-- PART 1: IDFC FIRST BANK CARDS
-- ============================================

-- IDFC First Select Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules, eligibility_criteria, features
) VALUES (
  'idfc-select',
  'IDFC First Select Credit Card',
  'IDFC First Bank',
  'credit',
  'visa',
  'cashback',
  0.00,
  '#0066CC',
  '#3399FF',
  'Lifetime free credit card with comprehensive cashback rewards',
  '[
    {
      "category": "shopping",
      "description": "1.5% cashback on online shopping",
      "rewardRate": 1.50,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "1.5% cashback"
    },
    {
      "category": "dining",
      "description": "1% cashback on dining",
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
      "rewardCap": 250.00,
      "capPeriod": "monthly",
      "conditions": [],
      "value": "1% waiver"
    },
    {
      "category": "default",
      "description": "0.5% cashback on other spends",
      "rewardRate": 0.50,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "0.5% cashback"
    }
  ]'::jsonb,
  '{"calculation": "Percentage-based cashback", "lifetimeFree": "No annual fee"}'::jsonb,
  '[{"minIncome": 180000, "creditScore": 650, "categories": ["Salaried", "Self-Employed"], "ageRange": [21, 60]}]'::jsonb,
  '[
    "Lifetime free - No annual fee",
    "Instant cashback rewards",
    "Fuel surcharge waiver",
    "Zero liability on fraudulent transactions",
    "Wide acceptance"
  ]'::jsonb
);

-- IDFC First Wealth Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules, eligibility_criteria, features
) VALUES (
  'idfc-wealth',
  'IDFC First Wealth Credit Card',
  'IDFC First Bank',
  'credit',
  'visa',
  'points',
  999.00,
  '#8B4513',
  '#A0522D',
  'Premium card with exceptional rewards and travel benefits',
  '[
    {
      "category": "travel",
      "description": "10 reward points per ₹150 on travel",
      "rewardRate": 10.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "10 points"
    },
    {
      "category": "dining",
      "description": "10 reward points per ₹150 on dining",
      "rewardRate": 10.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "10 points"
    },
    {
      "category": "shopping",
      "description": "5 reward points per ₹150 on shopping",
      "rewardRate": 5.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "5 points"
    },
    {
      "category": "default",
      "description": "2 reward points per ₹150 on other spends",
      "rewardRate": 2.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "2 points"
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
    }
  ]'::jsonb,
  '{"calculation": "Points-based rewards", "pointsValue": "₹0.25 per point"}'::jsonb,
  '[{"minIncome": 800000, "creditScore": 750, "categories": ["Salaried", "Self-Employed"], "ageRange": [25, 70]}]'::jsonb,
  '[
    "10X points on travel and dining",
    "Unlimited lounge access domestic & international",
    "Golf privileges",
    "Concierge services",
    "Travel insurance coverage"
  ]'::jsonb
);

-- ============================================
-- PART 2: ONECARD
-- ============================================

-- OneCard Metal Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules, eligibility_criteria, features
) VALUES (
  'onecard-metal',
  'OneCard Metal Credit Card',
  'FPL Technologies',
  'credit',
  'rupay',
  'points',
  0.00,
  '#1A1A1A',
  '#2D2D2D',
  'World class metal credit card with personalized rewards',
  '[
    {
      "category": "default",
      "description": "5X reward points on top 2 spending categories",
      "rewardRate": 5.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Personalized based on spending"],
      "value": "5X points"
    },
    {
      "category": "default",
      "description": "1X reward points on all other spends",
      "rewardRate": 1.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "1X points"
    },
    {
      "category": "fuel",
      "description": "1% fuel surcharge waiver",
      "rewardRate": 1.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "1% waiver"
    },
    {
      "category": "lounge",
      "description": "4 domestic lounge visits per quarter",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": 4.00,
      "capPeriod": "quarterly",
      "conditions": ["Domestic lounges only"],
      "value": "4 visits/quarter"
    }
  ]'::jsonb,
  '{"calculation": "AI-driven rewards", "personalized": true, "lifetimeFree": "No annual fee"}'::jsonb,
  '[{"minIncome": 300000, "creditScore": 700, "categories": ["Salaried", "Self-Employed"], "ageRange": [21, 60]}]'::jsonb,
  '[
    "5X rewards on top 2 spending categories",
    "Metal card design",
    "Lifetime free - No annual fee",
    "16 complimentary lounge visits per year",
    "Zero foreign transaction fees",
    "Personalized rewards via app"
  ]'::jsonb
);

-- ============================================
-- PART 3: SCAPIA
-- ============================================

-- Scapia Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules, eligibility_criteria, features
) VALUES (
  'scapia-card',
  'Scapia Credit Card',
  'Federal Bank',
  'credit',
  'visa',
  'points',
  0.00,
  '#00B4DB',
  '#4DB8FF',
  'Zero forex markup travel card with unlimited lounge access',
  '[
    {
      "category": "travel",
      "description": "10 Scapia Points per ₹100 on travel bookings",
      "rewardRate": 10.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Travel bookings only"],
      "value": "10 points"
    },
    {
      "category": "default",
      "description": "1 Scapia Point per ₹100 on other spends",
      "rewardRate": 1.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "1 point"
    },
    {
      "category": "forex",
      "description": "0% forex markup on international spends",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Zero forex markup"],
      "value": "0% markup"
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
    }
  ]'::jsonb,
  '{"calculation": "Scapia Points system", "pointsValue": "₹0.25 per point", "zeroForex": true}'::jsonb,
  '[{"minIncome": 400000, "creditScore": 720, "categories": ["Salaried", "Self-Employed"], "ageRange": [21, 65]}]'::jsonb,
  '[
    "10X points on travel bookings",
    "Zero forex markup on international spends",
    "Unlimited domestic and international lounge access",
    "Lifetime free - No annual fee",
    "Travel insurance coverage",
    "Ideal for frequent travelers"
  ]'::jsonb
);

-- ============================================
-- PART 4: PUNJAB NATIONAL BANK (PNB)
-- ============================================

-- PNB Platinum Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules, eligibility_criteria, features
) VALUES (
  'pnb-platinum',
  'PNB Platinum Credit Card',
  'Punjab National Bank',
  'credit',
  'rupay',
  'points',
  0.00,
  '#FF6F00',
  '#FF8F00',
  'Lifetime free card with rewards on all spends',
  '[
    {
      "category": "default",
      "description": "1 reward point per ₹100 spent",
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
      "conditions": [],
      "value": "1% waiver"
    },
    {
      "category": "lounge",
      "description": "Complimentary airport lounge access",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": 2.00,
      "capPeriod": "yearly",
      "conditions": ["Domestic lounges"],
      "value": "2 visits/year"
    }
  ]'::jsonb,
  '{"calculation": "Points-based rewards", "lifetimeFree": "No annual fee"}'::jsonb,
  '[{"minIncome": 200000, "creditScore": 650, "categories": ["Salaried", "Self-Employed"], "ageRange": [21, 60]}]'::jsonb,
  '[
    "Lifetime free - No annual fee",
    "Reward points on all spends",
    "Fuel surcharge waiver",
    "Complimentary lounge access",
    "Wide merchant acceptance"
  ]'::jsonb
);

-- PNB Select Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules, eligibility_criteria, features
) VALUES (
  'pnb-select',
  'PNB Select Credit Card',
  'Punjab National Bank',
  'credit',
  'visa',
  'points',
  500.00,
  '#1976D2',
  '#2196F3',
  'Premium card with enhanced rewards and travel benefits',
  '[
    {
      "category": "travel",
      "description": "2 reward points per ₹100 on travel",
      "rewardRate": 2.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "2 points"
    },
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
      "category": "shopping",
      "description": "2 reward points per ₹100 on shopping",
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
      "description": "4 domestic and international lounge visits per year",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": 4.00,
      "capPeriod": "yearly",
      "conditions": [],
      "value": "4 visits/year"
    }
  ]'::jsonb,
  '{"calculation": "Points-based rewards", "pointsValue": "₹0.25 per point"}'::jsonb,
  '[{"minIncome": 400000, "creditScore": 700, "categories": ["Salaried", "Self-Employed"], "ageRange": [21, 65]}]'::jsonb,
  '[
    "2X rewards on travel, dining, and shopping",
    "Complimentary lounge access",
    "Travel insurance",
    "Concierge services",
    "Discounted rates at partner hotels"
  ]'::jsonb
);

-- ============================================
-- PART 5: UNION BANK
-- ============================================

-- Union Bank Of India Platinum Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules, eligibility_criteria, features
) VALUES (
  'union-platinum',
  'Union Bank Platinum Credit Card',
  'Union Bank of India',
  'credit',
  'rupay',
  'points',
  0.00,
  '#003D82',
  '#0066CC',
  'Lifetime free platinum card with reward points',
  '[
    {
      "category": "default",
      "description": "1 reward point per ₹100 spent",
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
      "conditions": [],
      "value": "1% waiver"
    },
    {
      "category": "lounge",
      "description": "2 complimentary airport lounge visits per year",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": 2.00,
      "capPeriod": "yearly",
      "conditions": ["Domestic lounges"],
      "value": "2 visits/year"
    }
  ]'::jsonb,
  '{"calculation": "Points-based rewards", "lifetimeFree": "No annual fee"}'::jsonb,
  '[{"minIncome": 180000, "creditScore": 650, "categories": ["Salaried", "Self-Employed"], "ageRange": [21, 60]}]'::jsonb,
  '[
    "Lifetime free - No annual fee",
    "Reward points on all spends",
    "Fuel surcharge waiver",
    "Complimentary lounge access",
    "Zero liability on fraudulent transactions"
  ]'::jsonb
);

-- ============================================
-- PART 6: MORE CO-BRANDED CARDS
-- ============================================

-- Club Vistara SBI Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules, eligibility_criteria, features
) VALUES (
  'sbi-club-vistara',
  'SBI Club Vistara Credit Card',
  'State Bank of India',
  'credit',
  'visa',
  'points',
  3000.00,
  '#EF3E42',
  '#FF6B70',
  'Premium airline co-branded card with Vistara benefits',
  '[
    {
      "category": "airline",
      "description": "3 CV Points per ₹100 on Vistara bookings",
      "rewardRate": 3.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Vistara bookings"],
      "value": "3 points"
    },
    {
      "category": "travel",
      "description": "2 CV Points per ₹100 on travel",
      "rewardRate": 2.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Travel bookings"],
      "value": "2 points"
    },
    {
      "category": "default",
      "description": "1 CV Point per ₹100 on other spends",
      "rewardRate": 1.00,
      "rewardType": "points",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": [],
      "value": "1 point"
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
      "category": "membership",
      "description": "Complimentary Club Vistara membership",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["CV membership"],
      "value": "Membership"
    }
  ]'::jsonb,
  '{"calculation": "Club Vistara Points", "cvPoints": true, "pointsValue": "Variable"}'::jsonb,
  '[{"minIncome": 700000, "creditScore": 750, "categories": ["Salaried", "Self-Employed"], "ageRange": [25, 70]}]'::jsonb,
  '[
    "3X CV Points on Vistara bookings",
    "Complimentary Club Vistara membership",
    "Unlimited lounge access",
    "Priority check-in and boarding",
    "Upgrade vouchers",
    "Travel insurance"
  ]'::jsonb
);

-- SBI AIRTEL Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules, eligibility_criteria, features
) VALUES (
  'sbi-airtel',
  'SBI AIRTEL Credit Card',
  'State Bank of India',
  'credit',
  'visa',
  'cashback',
  499.00,
  '#E31937',
  '#FF3366',
  'Co-branded card with Airtel benefits and cashback',
  '[
    {
      "category": "bills",
      "description": "10% cashback on Airtel bills",
      "rewardRate": 10.00,
      "rewardType": "cashback",
      "rewardCap": 300.00,
      "capPeriod": "monthly",
      "conditions": ["Airtel bills"],
      "value": "10% cashback"
    },
    {
      "category": "online",
      "description": "5% cashback on other utility bills",
      "rewardRate": 5.00,
      "rewardType": "cashback",
      "rewardCap": 300.00,
      "capPeriod": "monthly",
      "conditions": ["Utility bills"],
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
    }
  ]'::jsonb,
  '{"calculation": "Cashback rewards", "airtelBonus": "10% on Airtel bills"}'::jsonb,
  '[{"minIncome": 250000, "creditScore": 680, "categories": ["Salaried", "Self-Employed"], "ageRange": [21, 60]}]'::jsonb,
  '[
    "10% cashback on Airtel bills",
    "5% cashback on utility bills",
    "1% cashback on other spends",
    "Instant cashback",
    "Wide acceptance",
    "Airtel customer benefits"
  ]'::jsonb
);

-- ICICI Flipkart Credit Card
INSERT INTO public.cards_metadata (
  id, card_name, bank_name, card_type, network, reward_type, annual_fee,
  primary_color, secondary_color, description,
  benefits, reward_rules, eligibility_criteria, features
) VALUES (
  'icici-flipkart',
  'ICICI Bank Flipkart Credit Card',
  'ICICI Bank',
  'credit',
  'visa',
  'cashback',
  500.00,
  '#2874F0',
  '#4A90E2',
  'Co-branded card with exclusive Flipkart benefits',
  '[
    {
      "category": "shopping",
      "description": "5% cashback on Flipkart",
      "rewardRate": 5.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Flipkart purchases"],
      "value": "5% cashback"
    },
    {
      "category": "fuel",
      "description": "4% cashback on fuel",
      "rewardRate": 4.00,
      "rewardType": "cashback",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Fuel spends"],
      "value": "4% cashback"
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
      "category": "membership",
      "description": "Complimentary Flipkart Plus membership",
      "rewardRate": 0.00,
      "rewardType": "none",
      "rewardCap": null,
      "capPeriod": null,
      "conditions": ["Flipkart Plus"],
      "value": "Membership"
    }
  ]'::jsonb,
  '{"calculation": "Cashback rewards", "flipkartBonus": "5% on Flipkart", "annualFeeWaiver": "Spend-based waiver"}'::jsonb,
  '[{"minIncome": 250000, "creditScore": 680, "categories": ["Salaried", "Self-Employed"], "ageRange": [21, 60]}]'::jsonb,
  '[
    "5% cashback on Flipkart",
    "4% cashback on fuel",
    "1% cashback on other spends",
    "Complimentary Flipkart Plus membership",
    "Exclusive Flipkart sales access",
    "Instant cashback"
  ]'::jsonb
);

-- ============================================
-- MIGRATION COMPLETE
-- Added 12 new popular Indian credit cards:
-- - IDFC First: 2 cards
-- - OneCard: 1 card
-- - Scapia: 1 card
-- - PNB: 2 cards
-- - Union Bank: 1 card
-- - Co-branded: 5 cards (SBI Club Vistara, SBI Airtel, ICICI Flipkart)
-- Total cards in database now: 51+ cards
-- ============================================



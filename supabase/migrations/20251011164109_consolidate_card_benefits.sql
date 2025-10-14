-- Consolidate all card benefits updates into a single migration
-- This replaces the previous individual updates with a single, consistent update

-- Update HDFC Millennia card benefits
UPDATE public.cards_metadata
SET benefits = '[
  {
    "category": "shopping_dining",
    "description": "5% cashback on online shopping and dining",
    "rewardRate": 5.00,
    "rewardType": "cashback",
    "rewardCap": 1000,
    "capPeriod": "monthly",
    "conditions": ["Online purchases only", "Minimum ₹1000 per transaction"],
    "value": "5% cashback"
  },
  {
    "category": "default",
    "description": "1% cashback on all other spends",
    "rewardRate": 1.00,
    "rewardType": "cashback",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": [],
    "value": "1% cashback"
  },
  {
    "category": "lounge",
    "description": "Airport lounge access",
    "rewardRate": 0.00,
    "rewardType": "none",
    "rewardCap": 4,
    "capPeriod": "yearly",
    "conditions": ["4 visits per year", "International lounges only"],
    "value": "4 visits/year"
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
]'::jsonb
WHERE id = 'hdfc-millennia';

-- Update HDFC Regalia card benefits
UPDATE public.cards_metadata
SET benefits = '[
  {
    "category": "travel_dining",
    "description": "4 reward points per ₹150 on travel and dining",
    "rewardRate": 4.00,
    "rewardType": "points",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": ["Valid on all travel and dining spends"],
    "value": "4X points"
  },
  {
    "category": "default",
    "description": "4 reward points per ₹150 on all other spends",
    "rewardRate": 4.00,
    "rewardType": "points",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": [],
    "value": "4X points"
  },
  {
    "category": "lounge",
    "description": "Airport lounge access",
    "rewardRate": 0.00,
    "rewardType": "none",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": ["Unlimited domestic lounge visits", "6 international lounge visits per year", "Priority Pass membership"],
    "value": "Unlimited domestic + 6 international visits/year"
  },
  {
    "category": "insurance",
    "description": "Air accident cover of ₹1 crore",
    "rewardRate": 0.00,
    "rewardType": "none",
    "rewardCap": 10000000.00,
    "capPeriod": null,
    "conditions": ["Air accident cover"],
    "value": "₹1 crore"
  }
]'::jsonb
WHERE id = 'hdfc-regalia';

-- Update ICICI Amazon Pay card benefits
UPDATE public.cards_metadata
SET benefits = '[
  {
    "category": "amazon",
    "description": "Amazon.in cashback rewards",
    "rewardRate": 5.00,
    "rewardType": "cashback",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": ["5% for Prime members", "3% for non-Prime members"],
    "value": "Up to 5% cashback"
  },
  {
    "category": "dining_travel",
    "description": "2% cashback on dining and travel",
    "rewardRate": 2.00,
    "rewardType": "cashback",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": ["Includes dining, Uber, and travel bookings"],
    "value": "2% cashback"
  },
  {
    "category": "default",
    "description": "1% cashback everywhere else",
    "rewardRate": 1.00,
    "rewardType": "cashback",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": [],
    "value": "1% cashback"
  }
]'::jsonb
WHERE id = 'icici-amazon-pay';

-- Update SBI SimplyCLICK card benefits
UPDATE public.cards_metadata
SET benefits = '[
  {
    "category": "dining_movies",
    "description": "10X reward points on dining and movies",
    "rewardRate": 10.00,
    "rewardType": "points",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": ["Valid at all restaurants and movie theaters"],
    "value": "10X points"
  },
  {
    "category": "shopping",
    "description": "5X reward points on online shopping",
    "rewardRate": 5.00,
    "rewardType": "points",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": ["Online shopping only"],
    "value": "5X points"
  },
  {
    "category": "default",
    "description": "1X reward points on other spends",
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
    "conditions": ["Surcharge waiver"],
    "value": "1% waiver"
  }
]'::jsonb
WHERE id = 'sbi-simplyclick';

-- Update Axis Magnus card benefits
UPDATE public.cards_metadata
SET benefits = '[
  {
    "category": "travel",
    "description": "25 EDGE reward points per ₹200 on travel",
    "rewardRate": 25.00,
    "rewardType": "points",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": ["Valid on all travel bookings"],
    "value": "25X points"
  },
  {
    "category": "default",
    "description": "12 EDGE reward points per ₹200 on other spends",
    "rewardRate": 12.00,
    "rewardType": "points",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": [],
    "value": "12X points"
  },
  {
    "category": "lounge",
    "description": "Airport lounge access",
    "rewardRate": 0.00,
    "rewardType": "none",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": ["Unlimited domestic and international lounge visits", "Priority Pass membership"],
    "value": "Unlimited visits"
  },
  {
    "category": "golf",
    "description": "Golf privileges",
    "rewardRate": 0.00,
    "rewardType": "none",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": ["Access to premium golf courses", "Complimentary green fees"],
    "value": "Complimentary access"
  },
  {
    "category": "movies",
    "description": "Buy One Get One movie tickets",
    "rewardRate": 0.00,
    "rewardType": "none",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": ["Valid on BookMyShow", "Up to 2 tickets per month"],
    "value": "BOGO"
  }
]'::jsonb
WHERE id = 'axis-magnus';

-- Update AMEX Gold card benefits
UPDATE public.cards_metadata
SET benefits = '[
  {
    "category": "travel_dining",
    "description": "4 reward points per ₹50 on travel and dining",
    "rewardRate": 4.00,
    "rewardType": "points",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": ["Valid on all travel and dining spends"],
    "value": "4X points"
  },
  {
    "category": "default",
    "description": "1 reward point per ₹50 on other spends",
    "rewardRate": 1.00,
    "rewardType": "points",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": [],
    "value": "1X point"
  },
  {
    "category": "lounge",
    "description": "Airport lounge access",
    "rewardRate": 0.00,
    "rewardType": "none",
    "rewardCap": 8,
    "capPeriod": "yearly",
    "conditions": ["8 visits per year", "Priority Pass and domestic lounges"],
    "value": "8 visits/year"
  },
  {
    "category": "membership",
    "description": "Taj Epicure membership",
    "rewardRate": 0.00,
    "rewardType": "none",
    "rewardCap": null,
    "capPeriod": null,
    "conditions": ["Complimentary Taj Epicure Plus membership"],
    "value": "Complimentary membership"
  },
  {
    "category": "hotel",
    "description": "Annual Taj hotel voucher",
    "rewardRate": 0.00,
    "rewardType": "none",
    "rewardCap": 5000.00,
    "capPeriod": "yearly",
    "conditions": ["Valid at participating Taj hotels"],
    "value": "₹5000/year"
  }
]'::jsonb
WHERE id = 'amex-gold';

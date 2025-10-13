-- Migration: 20250113000000_populate_card_benefits.sql
-- Populate card_benefits table with data from CARD_DATABASE
-- This makes the database the single source of truth for benefits

-- ============================================
-- 1. Add missing column and clear existing data
-- ============================================

-- Make card_id nullable to support template benefits (card_metadata_id)
ALTER TABLE public.card_benefits
ALTER COLUMN card_id DROP NOT NULL;

-- Add card_metadata_id column to link benefits to card types
ALTER TABLE public.card_benefits
ADD COLUMN IF NOT EXISTS card_metadata_id TEXT;

-- Add other missing columns from the schema fix
ALTER TABLE public.card_benefits
ADD COLUMN IF NOT EXISTS reward_type TEXT;

-- Drop and recreate the constraint to include 'none'
ALTER TABLE public.card_benefits
DROP CONSTRAINT IF EXISTS card_benefits_reward_type_check;

ALTER TABLE public.card_benefits
ADD CONSTRAINT card_benefits_reward_type_check 
CHECK (reward_type IN ('cashback', 'points', 'miles', 'none'));

ALTER TABLE public.card_benefits
ADD COLUMN IF NOT EXISTS cap_period TEXT CHECK (cap_period IN ('monthly', 'yearly'));

ALTER TABLE public.card_benefits
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.card_benefits
ADD COLUMN IF NOT EXISTS value TEXT;

-- Delete any existing card benefits
DELETE FROM public.card_benefits;

-- ============================================
-- 2. Populate card_benefits with CARD_DATABASE data
-- ============================================

-- Insert benefits for HDFC Millennia Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('hdfc-millennia', 'shopping', 5.00, 'cashback', 1000.00, 'monthly', '["Online purchases only", "Minimum ₹1000 per transaction"]', '5% cashback on shopping and dining (up to ₹1000/month)', '5% cashback', true),
  ('hdfc-millennia', 'dining', 5.00, 'cashback', 1000.00, 'monthly', '[]', '5% cashback on shopping and dining (up to ₹1000/month)', '5% cashback', true),
  ('hdfc-millennia', 'default', 1.00, 'cashback', null, null, '[]', '1% cashback on all other spends', '1% cashback', true),
  ('hdfc-millennia', 'lounge', 0.00, 'none', 4.00, 'yearly', '["Complimentary access"]', '4 complimentary airport lounge visits per year', '4 visits', true),
  ('hdfc-millennia', 'fuel', 1.00, 'cashback', null, null, '["Surcharge waiver"]', '1% fuel surcharge waiver', '1% waiver', true);

-- Insert benefits for HDFC Regalia Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('hdfc-regalia', 'travel', 4.00, 'points', null, null, '[]', '4 reward points per ₹150 spent', '4 points', true),
  ('hdfc-regalia', 'dining', 4.00, 'points', null, null, '[]', '4 reward points per ₹150 spent', '4 points', true),
  ('hdfc-regalia', 'default', 4.00, 'points', null, null, '[]', '4 reward points per ₹150 spent', '4 points', true),
  ('hdfc-regalia', 'lounge', 0.00, 'none', null, null, '["Unlimited domestic access"]', 'Unlimited domestic airport lounge access', 'Unlimited', true),
  ('hdfc-regalia', 'lounge', 0.00, 'none', 6.00, 'yearly', '["International access"]', '6 international lounge visits per year', '6 visits', true),
  ('hdfc-regalia', 'insurance', 0.00, 'none', 10000000.00, null, '["Air accident cover"]', 'Air accident cover of ₹1 crore', '₹1 crore', true);

-- Insert benefits for HDFC MoneyBack+ Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('hdfc-moneyback', 'online', 2.00, 'points', null, null, '["Online transactions only"]', '2 reward points per ₹150 on online spends', '2 points', true),
  ('hdfc-moneyback', 'default', 1.00, 'points', null, null, '[]', '1 reward point per ₹150 on offline spends', '1 point', true),
  ('hdfc-moneyback', 'fuel', 1.00, 'cashback', null, null, '["Surcharge waiver"]', '1% fuel surcharge waiver', '1% waiver', true);

-- Insert benefits for HDFC Diners Club Black
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('hdfc-diners-black', 'default', 3.30, 'points', null, null, '[]', '5 reward points per ₹150 spent', '5 points', true),
  ('hdfc-diners-black', 'lounge', 0.00, 'none', null, null, '["Unlimited access"]', 'Unlimited domestic and international lounge access', 'Unlimited', true),
  ('hdfc-diners-black', 'golf', 0.00, 'none', 6.00, 'yearly', '["Golf privileges"]', 'Golf privileges - 6 rounds per year', '6 rounds', true),
  ('hdfc-diners-black', 'membership', 0.00, 'none', null, null, '["Complimentary"]', 'Complimentary Club Marriott membership', 'Membership', true);

-- Insert benefits for HDFC Infinia Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('hdfc-infinia', 'default', 3.30, 'points', null, null, '[]', '5 reward points per ₹150 spent', '5 points', true),
  ('hdfc-infinia', 'lounge', 0.00, 'none', null, null, '["Unlimited access"]', 'Unlimited domestic and international lounge access', 'Unlimited', true),
  ('hdfc-infinia', 'hotel', 0.00, 'none', null, null, '["Complimentary vouchers"]', 'Complimentary ITC Hotel vouchers', 'Vouchers', true),
  ('hdfc-infinia', 'membership', 0.00, 'none', null, null, '["Priority Pass"]', 'Priority Pass membership', 'Membership', true),
  ('hdfc-infinia', 'concierge', 0.00, 'none', null, null, '["Concierge services"]', 'Concierge services', 'Services', true);

-- Insert benefits for HDFC Tata Neu Plus Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('hdfc-tata-neu-plus', 'tata', 5.00, 'points', null, null, '["Tata brands: BigBasket, 1mg, Croma, Westside, Titan, etc."]', '5% NeuCoins on all Tata brands', '5% NeuCoins', true),
  ('hdfc-tata-neu-plus', 'upi', 1.00, 'points', null, null, '["UPI transactions only"]', '1% NeuCoins on UPI spends', '1% NeuCoins', true),
  ('hdfc-tata-neu-plus', 'default', 0.50, 'points', null, null, '[]', '0.5% NeuCoins on other spends', '0.5% NeuCoins', true);

-- Insert benefits for ICICI Amazon Pay Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('icici-amazon-pay', 'amazon', 5.00, 'cashback', null, null, '["Amazon Prime members only"]', '5% cashback on Amazon.in (Prime members)', '5% cashback', true),
  ('icici-amazon-pay', 'amazon', 3.00, 'cashback', null, null, '["Non-Prime members"]', '3% cashback on Amazon.in (non-Prime)', '3% cashback', true),
  ('icici-amazon-pay', 'dining', 2.00, 'cashback', null, null, '["Dining and Uber"]', '2% cashback on dining and Uber', '2% cashback', true),
  ('icici-amazon-pay', 'default', 1.00, 'cashback', null, null, '[]', '1% cashback everywhere else', '1% cashback', true);

-- Insert benefits for ICICI Platinum Chip Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('icici-platinum', 'default', 2.00, 'points', null, null, '[]', '2 reward points per ₹100 spent', '2 points', true),
  ('icici-platinum', 'fuel', 1.00, 'cashback', null, null, '["Surcharge waiver"]', '1% fuel surcharge waiver', '1% waiver', true),
  ('icici-platinum', 'insurance', 0.00, 'none', null, null, '["Lost card liability"]', 'Lost card liability cover', 'Cover', true);

-- Insert benefits for ICICI Sapphiro Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('icici-sapphiro', 'travel', 4.00, 'points', null, null, '[]', '4 reward points per ₹100 on travel', '4 points', true),
  ('icici-sapphiro', 'default', 2.00, 'points', null, null, '[]', '2 reward points per ₹100 on other spends', '2 points', true),
  ('icici-sapphiro', 'lounge', 0.00, 'none', null, null, '["Unlimited domestic access"]', 'Unlimited domestic lounge access', 'Unlimited', true),
  ('icici-sapphiro', 'lounge', 0.00, 'none', 12.00, 'yearly', '["International access"]', '12 international lounge visits per year', '12 visits', true);

-- Insert benefits for ICICI Coral Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('icici-coral', 'dining', 2.00, 'points', null, null, '[]', '2 reward points per ₹100 on dining', '2 points', true),
  ('icici-coral', 'default', 1.00, 'points', null, null, '[]', '1 reward point per ₹100 on other spends', '1 point', true),
  ('icici-coral', 'lounge', 0.00, 'none', 2.00, 'yearly', '["Complimentary access"]', '2 complimentary airport lounge visits per year', '2 visits', true),
  ('icici-coral', 'fuel', 1.00, 'cashback', null, null, '["Surcharge waiver"]', '1% fuel surcharge waiver', '1% waiver', true);

-- Insert benefits for ICICI Manchester United Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('icici-manchester-united', 'default', 2.00, 'points', null, null, '[]', '2 reward points per ₹100 spent', '2 points', true),
  ('icici-manchester-united', 'merchandise', 0.00, 'none', null, null, '["Exclusive merchandise"]', 'Exclusive Manchester United merchandise', 'Merchandise', true),
  ('icici-manchester-united', 'fuel', 1.00, 'cashback', null, null, '["Surcharge waiver"]', '1% fuel surcharge waiver', '1% waiver', true);

-- Insert benefits for SBI SimplyCLICK Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('sbi-simplyclick', 'dining', 10.00, 'points', null, null, '[]', '10X reward points on dining and movies', '10X points', true),
  ('sbi-simplyclick', 'movies', 10.00, 'points', null, null, '[]', '10X reward points on dining and movies', '10X points', true),
  ('sbi-simplyclick', 'shopping', 5.00, 'points', null, null, '["Online shopping only"]', '5X reward points on online shopping', '5X points', true),
  ('sbi-simplyclick', 'default', 1.00, 'points', null, null, '[]', '1X reward points on other spends', '1X points', true),
  ('sbi-simplyclick', 'fuel', 1.00, 'cashback', null, null, '["Surcharge waiver"]', '1% fuel surcharge waiver', '1% waiver', true);

-- Insert benefits for SBI SimplySAVE Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('sbi-simplysave', 'dining', 10.00, 'cashback', null, null, '[]', '10% cashback on dining', '10% cashback', true),
  ('sbi-simplysave', 'groceries', 5.00, 'cashback', null, null, '[]', '5% cashback on grocery shopping', '5% cashback', true),
  ('sbi-simplysave', 'default', 1.00, 'cashback', null, null, '[]', '1% cashback on other spends', '1% cashback', true),
  ('sbi-simplysave', 'fuel', 1.00, 'cashback', null, null, '["Surcharge waiver"]', '1% fuel surcharge waiver', '1% waiver', true);

-- Insert benefits for SBI Card PRIME
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('sbi-prime', 'default', 10.00, 'points', null, null, '[]', '10X reward points on all spends', '10X points', true),
  ('sbi-prime', 'lounge', 0.00, 'none', null, null, '["Unlimited domestic access"]', 'Unlimited domestic airport lounge access', 'Unlimited', true),
  ('sbi-prime', 'lounge', 0.00, 'none', 2.00, 'yearly', '["International access"]', '2 international lounge visits per year', '2 visits', true),
  ('sbi-prime', 'golf', 0.00, 'none', null, null, '["Complimentary lessons"]', 'Complimentary golf lessons', 'Lessons', true);

-- Insert benefits for SBI Card Aurum
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('sbi-aurum', 'default', 15.00, 'points', null, null, '[]', '15X reward points on all spends', '15X points', true),
  ('sbi-aurum', 'lounge', 0.00, 'none', null, null, '["Unlimited domestic access"]', 'Unlimited domestic airport lounge access', 'Unlimited', true),
  ('sbi-aurum', 'lounge', 0.00, 'none', 6.00, 'yearly', '["International access"]', '6 international lounge visits per year', '6 visits', true),
  ('sbi-aurum', 'golf', 0.00, 'none', null, null, '["Golf privileges"]', 'Golf privileges', 'Privileges', true),
  ('sbi-aurum', 'movies', 0.00, 'none', null, null, '["Movie ticket discounts"]', 'Movie ticket discounts', 'Discounts', true);

-- Insert benefits for Axis Bank Magnus Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('axis-magnus', 'travel', 25.00, 'points', null, null, '[]', '25 EDGE reward points per ₹200 on travel', '25 points', true),
  ('axis-magnus', 'default', 12.00, 'points', null, null, '[]', '12 EDGE reward points per ₹200 on other spends', '12 points', true),
  ('axis-magnus', 'lounge', 0.00, 'none', null, null, '["Unlimited access"]', 'Unlimited domestic and international lounge access', 'Unlimited', true),
  ('axis-magnus', 'golf', 0.00, 'none', null, null, '["Golf privileges"]', 'Golf privileges', 'Privileges', true),
  ('axis-magnus', 'movies', 0.00, 'none', null, null, '["Buy One Get One"]', 'Buy One Get One movie tickets', 'BOGO', true);

-- Insert benefits for Axis Vistara Infinite Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('axis-vistara', 'travel', 10.00, 'miles', null, null, '[]', '10 CV Points per ₹100 on travel bookings', '10 CV Points', true),
  ('axis-vistara', 'default', 4.00, 'miles', null, null, '[]', '4 CV Points per ₹100 on other spends', '4 CV Points', true),
  ('axis-vistara', 'tickets', 0.00, 'none', 2.00, 'yearly', '["Complimentary tickets"]', '2 complimentary Vistara tickets per year', '2 tickets', true),
  ('axis-vistara', 'lounge', 0.00, 'none', null, null, '["Unlimited access"]', 'Unlimited airport lounge access', 'Unlimited', true),
  ('axis-vistara', 'priority', 0.00, 'none', null, null, '["Priority services"]', 'Priority check-in and boarding', 'Priority', true);

-- Insert benefits for Flipkart Axis Bank Credit Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('axis-flipkart', 'flipkart', 5.00, 'cashback', null, null, '["Flipkart, Myntra, 2GUD purchases"]', '5% cashback on Flipkart, Myntra, 2GUD', '5% cashback', true),
  ('axis-flipkart', 'dining', 4.00, 'cashback', null, null, '["Dining and Swiggy/Zomato"]', '4% cashback on dining and Swiggy/Zomato', '4% cashback', true),
  ('axis-flipkart', 'default', 1.50, 'cashback', null, null, '[]', '1.5% cashback on other spends', '1.5% cashback', true),
  ('axis-flipkart', 'bills', 1.00, 'cashback', null, null, '["Bill payments"]', 'Unlimited 1% cashback on bill payments', '1% cashback', true);

-- Insert benefits for American Express Gold Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('amex-gold', 'travel', 4.00, 'points', null, null, '[]', '4 reward points per ₹50 on travel and dining', '4 points', true),
  ('amex-gold', 'dining', 4.00, 'points', null, null, '[]', '4 reward points per ₹50 on travel and dining', '4 points', true),
  ('amex-gold', 'default', 1.00, 'points', null, null, '[]', '1 reward point per ₹50 on other spends', '1 point', true),
  ('amex-gold', 'lounge', 0.00, 'none', 8.00, 'yearly', '["Complimentary access"]', '8 complimentary airport lounge visits per year', '8 visits', true),
  ('amex-gold', 'membership', 0.00, 'none', null, null, '["Taj Epicure"]', 'Taj Epicure membership', 'Membership', true),
  ('amex-gold', 'hotel', 0.00, 'none', 5000.00, 'yearly', '["Taj hotel voucher"]', 'Annual Taj hotel voucher worth ₹5000', '₹5000 voucher', true);

-- Insert benefits for American Express Platinum Travel Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('amex-platinum-travel', 'travel', 10.00, 'points', null, null, '[]', '10 reward points per ₹50 on travel bookings', '10 points', true),
  ('amex-platinum-travel', 'default', 1.00, 'points', null, null, '[]', '1 reward point per ₹50 on other spends', '1 point', true),
  ('amex-platinum-travel', 'membership', 0.00, 'none', null, null, '["Priority Pass"]', 'Complimentary Priority Pass membership', 'Membership', true),
  ('amex-platinum-travel', 'lounge', 0.00, 'none', null, null, '["Unlimited access"]', 'Unlimited lounge access', 'Unlimited', true),
  ('amex-platinum-travel', 'insurance', 0.00, 'none', 5000000.00, null, '["Travel insurance"]', 'Travel insurance up to ₹50 lakhs', '₹50 lakhs', true);

-- Insert benefits for American Express Membership Rewards Card
INSERT INTO public.card_benefits (card_metadata_id, category, reward_rate, reward_type, reward_cap, cap_period, conditions, description, value, is_active)
VALUES 
  ('amex-mrcc', 'default', 1.00, 'points', null, null, '[]', '1 reward point per ₹50 on all spends', '1 point', true),
  ('amex-mrcc', 'bonus', 999.99, 'points', 4.00, 'yearly', '["Spend ₹6000 in a month"]', '1000 bonus points on spending ₹6000 in a month (4 times per year)', '1000 bonus points', true),
  ('amex-mrcc', 'conversion', 0.00, 'none', null, null, '["Convert to miles"]', 'Convert points to frequent flyer miles', 'Conversion', true);

-- ============================================
-- 3. Create indexes for better performance
-- ============================================

-- Index for card_metadata_id lookups
CREATE INDEX IF NOT EXISTS idx_card_benefits_metadata_id ON public.card_benefits(card_metadata_id) WHERE is_active = TRUE;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_card_benefits_category ON public.card_benefits(category) WHERE is_active = TRUE;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_card_benefits_metadata_category ON public.card_benefits(card_metadata_id, category) WHERE is_active = TRUE;

-- ============================================
-- 4. Add comments for documentation
-- ============================================

COMMENT ON TABLE public.card_benefits IS 'Card benefits populated from CARD_DATABASE - read-only benefits for each card type';
COMMENT ON COLUMN public.card_benefits.card_metadata_id IS 'References the card ID from CARD_DATABASE (e.g., hdfc-millennia)';
COMMENT ON COLUMN public.card_benefits.reward_rate IS 'Reward rate (e.g., 5.00 for 5%, or 10.00 for 10X points)';
COMMENT ON COLUMN public.card_benefits.reward_type IS 'Type of reward: cashback, points, miles, or none';
COMMENT ON COLUMN public.card_benefits.reward_cap IS 'Monthly or yearly cap on rewards (null if unlimited)';
COMMENT ON COLUMN public.card_benefits.cap_period IS 'Period for reward cap: monthly or yearly';
COMMENT ON COLUMN public.card_benefits.conditions IS 'JSON array of conditions for the benefit';
COMMENT ON COLUMN public.card_benefits.description IS 'Human-readable description of the benefit';
COMMENT ON COLUMN public.card_benefits.value IS 'Short value description (e.g., "5% cashback", "10X points")';

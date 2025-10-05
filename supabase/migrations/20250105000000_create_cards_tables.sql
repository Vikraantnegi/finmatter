-- Create cards and card_benefits tables for FinMatter
-- Migration: 20250105000000_create_cards_tables.sql

-- Create cards table
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  card_name TEXT NOT NULL,
  last_four_digits TEXT NOT NULL, -- Will be encrypted
  card_type TEXT NOT NULL CHECK (card_type IN ('credit', 'debit', 'prepaid')),
  network TEXT NOT NULL CHECK (network IN ('visa', 'mastercard', 'rupay', 'amex', 'discover')),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('cashback', 'points', 'miles', 'none')),
  annual_fee NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked', 'expired')),
  issue_date DATE,
  expiry_date DATE,
  credit_limit NUMERIC(15,2),
  available_credit NUMERIC(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_benefits table
CREATE TABLE IF NOT EXISTS public.card_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- e.g., 'dining', 'shopping', 'fuel', 'travel'
  reward_rate NUMERIC(5,2) NOT NULL, -- e.g., 5.00 for 5%
  reward_cap NUMERIC(10,2), -- e.g., 500.00 for ₹500 cap
  conditions JSONB, -- Additional conditions as JSON
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_status ON public.cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_bank_name ON public.cards(bank_name);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON public.cards(created_at);

CREATE INDEX IF NOT EXISTS idx_card_benefits_card_id ON public.card_benefits(card_id);
CREATE INDEX IF NOT EXISTS idx_card_benefits_category ON public.card_benefits(category);
CREATE INDEX IF NOT EXISTS idx_card_benefits_is_active ON public.card_benefits(is_active);

-- Enable Row Level Security
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_benefits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cards table
-- Policy 1: Service role can do everything (for API operations)
CREATE POLICY "Service role full access cards" ON public.cards
  FOR ALL USING (auth.role() = 'service_role');

-- Policy 2: Users can only access their own cards
CREATE POLICY "Users own cards access" ON public.cards
  FOR ALL USING (
    auth.jwt() ->> 'sub'::text = user_id::text
  ) WITH CHECK (
    auth.jwt() ->> 'sub'::text = user_id::text
  );

-- Create RLS policies for card_benefits table
-- Policy 1: Service role can do everything (for API operations)
CREATE POLICY "Service role full access card_benefits" ON public.card_benefits
  FOR ALL USING (auth.role() = 'service_role');

-- Policy 2: Users can only access benefits of their own cards
CREATE POLICY "Users own card benefits access" ON public.card_benefits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.cards 
      WHERE cards.id = card_benefits.card_id 
      AND cards.user_id::text = auth.jwt() ->> 'sub'::text
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cards 
      WHERE cards.id = card_benefits.card_id 
      AND cards.user_id::text = auth.jwt() ->> 'sub'::text
    )
  );

-- Create updated_at triggers
CREATE TRIGGER update_cards_updated_at 
  BEFORE UPDATE ON public.cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_benefits_updated_at 
  BEFORE UPDATE ON public.card_benefits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.cards IS 'User credit/debit cards portfolio';
COMMENT ON COLUMN public.cards.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN public.cards.last_four_digits IS 'Last 4 digits of card number (encrypted)';
COMMENT ON COLUMN public.cards.card_type IS 'Type of card: credit, debit, or prepaid';
COMMENT ON COLUMN public.cards.network IS 'Card network: visa, mastercard, rupay, amex, discover';
COMMENT ON COLUMN public.cards.reward_type IS 'Reward type: cashback, points, miles, or none';
COMMENT ON COLUMN public.cards.annual_fee IS 'Annual fee in currency units';
COMMENT ON COLUMN public.cards.status IS 'Card status: active, inactive, blocked, or expired';

COMMENT ON TABLE public.card_benefits IS 'Reward benefits for each card by category';
COMMENT ON COLUMN public.card_benefits.card_id IS 'Foreign key to cards table';
COMMENT ON COLUMN public.card_benefits.category IS 'Spending category (e.g., dining, shopping, fuel)';
COMMENT ON COLUMN public.card_benefits.reward_rate IS 'Reward rate as percentage (e.g., 5.00 for 5%)';
COMMENT ON COLUMN public.card_benefits.reward_cap IS 'Maximum reward amount per period';
COMMENT ON COLUMN public.card_benefits.conditions IS 'Additional conditions as JSON';

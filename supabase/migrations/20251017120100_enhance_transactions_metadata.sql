-- Enhance transactions table with additional metadata
-- Migration: 20251017120100_enhance_transactions_metadata.sql

-- Add transaction location (domestic/international)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS location TEXT CHECK (location IN ('domestic', 'international'));

-- Add reward points for this transaction
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0;

-- Add transaction reference number
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- Add EMI flag
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS is_emi BOOLEAN DEFAULT FALSE;

-- Add GST/tax amount
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(15,2) DEFAULT 0;

-- Add EMI details as JSONB for flexibility
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS emi_details JSONB;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_location ON public.transactions(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_is_emi ON public.transactions(is_emi) WHERE is_emi = TRUE;
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(reference_number);
CREATE INDEX IF NOT EXISTS idx_transactions_reward_points ON public.transactions(reward_points) WHERE reward_points > 0;

-- Add comments
COMMENT ON COLUMN public.transactions.location IS 'Transaction location: domestic or international';
COMMENT ON COLUMN public.transactions.reward_points IS 'Reward points earned for this transaction';
COMMENT ON COLUMN public.transactions.reference_number IS 'Bank transaction reference number';
COMMENT ON COLUMN public.transactions.is_emi IS 'Flag indicating if this is an EMI transaction';
COMMENT ON COLUMN public.transactions.gst_amount IS 'GST/tax amount for this transaction';
COMMENT ON COLUMN public.transactions.emi_details IS 'EMI details: {"tenure": 12, "principalAmount": 10000, "interestRate": 15.5}';


-- Enhance statements table with additional metadata
-- Migration: 20251017120000_enhance_statements_metadata.sql

-- Add statement date and reward points tracking
ALTER TABLE public.statements 
  ADD COLUMN IF NOT EXISTS statement_date DATE,
  ADD COLUMN IF NOT EXISTS reward_points_opening INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_points_earned INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_points_redeemed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_points_expired INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_points_closing INTEGER DEFAULT 0;

-- Add EMI tracking
ALTER TABLE public.statements
  ADD COLUMN IF NOT EXISTS emi_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_emi_amount NUMERIC(15,2) DEFAULT 0;

-- Add financial indicators
ALTER TABLE public.statements
  ADD COLUMN IF NOT EXISTS cash_advance_limit NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS late_payment_fee NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interest_charges NUMERIC(15,2) DEFAULT 0;

-- Add spending overview
ALTER TABLE public.statements
  ADD COLUMN IF NOT EXISTS total_spends NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS domestic_spends NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS international_spends NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS atm_withdrawals NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS number_of_transactions INTEGER DEFAULT 0;

-- Add category-wise spending as JSONB
ALTER TABLE public.statements
  ADD COLUMN IF NOT EXISTS category_wise_spends JSONB DEFAULT '{}'::jsonb;

-- Add reward points earned by category as JSONB
ALTER TABLE public.statements
  ADD COLUMN IF NOT EXISTS reward_points_by_category JSONB DEFAULT '{}'::jsonb;

-- Add billing cycle information
ALTER TABLE public.statements
  ADD COLUMN IF NOT EXISTS billing_day INTEGER,
  ADD COLUMN IF NOT EXISTS statement_day INTEGER;

-- Add statement summary fields
ALTER TABLE public.statements
  ADD COLUMN IF NOT EXISTS previous_balance NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS purchases_charges NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS cash_advances NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS payments_credits NUMERIC(15,2);

-- Add validation warnings
ALTER TABLE public.statements
  ADD COLUMN IF NOT EXISTS validation_warnings TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_statements_statement_date ON public.statements(statement_date DESC);
CREATE INDEX IF NOT EXISTS idx_statements_reward_points ON public.statements(reward_points_closing);
CREATE INDEX IF NOT EXISTS idx_statements_emi_count ON public.statements(emi_count) WHERE emi_count > 0;

-- Add comments
COMMENT ON COLUMN public.statements.statement_date IS 'Date when the statement was generated';
COMMENT ON COLUMN public.statements.reward_points_opening IS 'Opening reward points balance';
COMMENT ON COLUMN public.statements.reward_points_earned IS 'Reward points earned during this period';
COMMENT ON COLUMN public.statements.reward_points_redeemed IS 'Reward points redeemed during this period';
COMMENT ON COLUMN public.statements.reward_points_expired IS 'Reward points that expired';
COMMENT ON COLUMN public.statements.reward_points_closing IS 'Closing reward points balance';
COMMENT ON COLUMN public.statements.emi_count IS 'Number of active EMI loans';
COMMENT ON COLUMN public.statements.total_emi_amount IS 'Total EMI amount for the period';
COMMENT ON COLUMN public.statements.cash_advance_limit IS 'Cash advance limit on the card';
COMMENT ON COLUMN public.statements.late_payment_fee IS 'Late payment fee charged (if any)';
COMMENT ON COLUMN public.statements.interest_charges IS 'Interest charges for the period';
COMMENT ON COLUMN public.statements.category_wise_spends IS 'JSON object with category-wise spending breakdown';
COMMENT ON COLUMN public.statements.reward_points_by_category IS 'JSON object with reward points earned by category';
COMMENT ON COLUMN public.statements.billing_day IS 'Day of month when billing cycle starts (e.g., 17th)';
COMMENT ON COLUMN public.statements.statement_day IS 'Day of month when statement is generated (e.g., 18th)';
COMMENT ON COLUMN public.statements.previous_balance IS 'Previous statement balance';
COMMENT ON COLUMN public.statements.purchases_charges IS 'Total purchases and charges for the period';
COMMENT ON COLUMN public.statements.cash_advances IS 'Total cash advances for the period';
COMMENT ON COLUMN public.statements.payments_credits IS 'Total payments and credits for the period';
COMMENT ON COLUMN public.statements.validation_warnings IS 'Validation warnings from mathematical checks (reward points equation, balance equation, etc.)';


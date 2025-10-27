-- Create table to track user category corrections for ML learning
-- Migration: 20251015120200_create_category_corrections_table.sql

CREATE TABLE IF NOT EXISTS public.category_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  
  -- Correction details
  merchant_name TEXT NOT NULL,
  original_category TEXT NOT NULL,
  corrected_category TEXT NOT NULL,
  
  -- Pattern matching
  merchant_pattern TEXT, -- Normalized pattern for future matching
  
  -- Timestamps
  corrected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_category_corrections_user_id ON public.category_corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_category_corrections_merchant_name ON public.category_corrections(merchant_name);
CREATE INDEX IF NOT EXISTS idx_category_corrections_merchant_pattern ON public.category_corrections(merchant_pattern);
CREATE INDEX IF NOT EXISTS idx_category_corrections_user_merchant ON public.category_corrections(user_id, merchant_name);

-- Enable Row Level Security
ALTER TABLE public.category_corrections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role full access
CREATE POLICY "Service role full access category_corrections" ON public.category_corrections
  FOR ALL USING (auth.role() = 'service_role');

-- Users can only access their own corrections
CREATE POLICY "Users own corrections access" ON public.category_corrections
  FOR ALL USING (
    auth.jwt() ->> 'sub'::text = user_id::text
  ) WITH CHECK (
    auth.jwt() ->> 'sub'::text = user_id::text
  );

-- Add comments
COMMENT ON TABLE public.category_corrections IS 'User corrections for transaction categorization to improve ML accuracy';
COMMENT ON COLUMN public.category_corrections.merchant_pattern IS 'Normalized merchant name pattern for matching similar transactions';


-- Create transactions table for storing credit card transactions
-- Migration: 20251015120100_create_transactions_table.sql

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL, -- Nullable for manual entries
  statement_id UUID REFERENCES public.statements(id) ON DELETE SET NULL, -- Nullable if from email/manual
  
  -- Transaction details
  transaction_date DATE NOT NULL,
  merchant_name TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  
  -- Transaction type and status
  transaction_type TEXT NOT NULL DEFAULT 'debit' CHECK (transaction_type IN ('debit', 'credit', 'refund', 'fee', 'interest')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'cancelled')),
  
  -- Categorization
  category TEXT NOT NULL DEFAULT 'others' CHECK (category IN (
    'dining', 'shopping', 'groceries', 'fuel', 'travel', 
    'entertainment', 'bills', 'healthcare', 'education', 
    'transport', 'utilities', 'insurance', 'investment', 'others'
  )),
  subcategory TEXT,
  
  -- Additional information
  description TEXT,
  reference TEXT, -- Bank transaction reference
  raw_text TEXT, -- Original text from PDF for debugging
  
  -- User annotations
  notes TEXT,
  tags TEXT[], -- Array of user-defined tags
  
  -- Source tracking
  source TEXT NOT NULL DEFAULT 'pdf' CHECK (source IN ('pdf', 'email', 'manual', 'aa')), -- aa = Account Aggregator
  email_id TEXT, -- If imported from email
  
  -- Recurring transaction tracking
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern JSONB, -- Store recurring pattern details
  
  -- Location data (optional)
  location JSONB, -- Store location as JSON: {city, state, country, etc}
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON public.transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_statement_id ON public.transactions(statement_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON public.transactions(merchant_name);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_card_date ON public.transactions(user_id, card_id, transaction_date DESC);

-- GIN index for tags array search
CREATE INDEX IF NOT EXISTS idx_transactions_tags ON public.transactions USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role full access
CREATE POLICY "Service role full access transactions" ON public.transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Users can only access their own transactions
CREATE POLICY "Users own transactions access" ON public.transactions
  FOR ALL USING (
    auth.jwt() ->> 'sub'::text = user_id::text
  ) WITH CHECK (
    auth.jwt() ->> 'sub'::text = user_id::text
  );

-- Create updated_at trigger
CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON public.transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.transactions IS 'Credit card transactions from statements, emails, or manual entry';
COMMENT ON COLUMN public.transactions.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN public.transactions.card_id IS 'Foreign key to cards table (nullable for manual entries)';
COMMENT ON COLUMN public.transactions.statement_id IS 'Foreign key to statements table (nullable if from email/manual)';
COMMENT ON COLUMN public.transactions.transaction_date IS 'Date of the transaction';
COMMENT ON COLUMN public.transactions.merchant_name IS 'Name of merchant/vendor';
COMMENT ON COLUMN public.transactions.amount IS 'Transaction amount (positive for debit, negative for credit/refund)';
COMMENT ON COLUMN public.transactions.transaction_type IS 'Type: debit, credit, refund, fee, or interest';
COMMENT ON COLUMN public.transactions.category IS 'Transaction category for analytics';
COMMENT ON COLUMN public.transactions.raw_text IS 'Original text from PDF for debugging';
COMMENT ON COLUMN public.transactions.source IS 'Source of transaction: pdf, email, manual, or aa (Account Aggregator)';
COMMENT ON COLUMN public.transactions.tags IS 'User-defined tags for filtering';


-- Create statements table for tracking uploaded PDF statements
-- Migration: 20251015120000_create_statements_table.sql

CREATE TABLE IF NOT EXISTS public.statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  
  -- File information
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- Size in bytes
  
  -- Statement period
  statement_period_start DATE,
  statement_period_end DATE,
  
  -- Parsing information
  parsing_status TEXT NOT NULL DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'success', 'failed')),
  transaction_count INTEGER DEFAULT 0,
  parsing_error TEXT, -- Error message if parsing failed
  
  -- Metadata extracted from statement
  due_date DATE,
  minimum_payment NUMERIC(15,2),
  total_amount_due NUMERIC(15,2),
  credit_limit NUMERIC(15,2),
  available_credit NUMERIC(15,2),
  
  -- Timestamps
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parsed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_statements_user_id ON public.statements(user_id);
CREATE INDEX IF NOT EXISTS idx_statements_card_id ON public.statements(card_id);
CREATE INDEX IF NOT EXISTS idx_statements_parsing_status ON public.statements(parsing_status);
CREATE INDEX IF NOT EXISTS idx_statements_uploaded_at ON public.statements(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_statements_user_card ON public.statements(user_id, card_id);

-- Enable Row Level Security
ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role full access
CREATE POLICY "Service role full access statements" ON public.statements
  FOR ALL USING (auth.role() = 'service_role');

-- Users can only access their own statements
CREATE POLICY "Users own statements access" ON public.statements
  FOR ALL USING (
    auth.jwt() ->> 'sub'::text = user_id::text
  ) WITH CHECK (
    auth.jwt() ->> 'sub'::text = user_id::text
  );

-- Create updated_at trigger
CREATE TRIGGER update_statements_updated_at 
  BEFORE UPDATE ON public.statements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.statements IS 'Credit card statements uploaded by users';
COMMENT ON COLUMN public.statements.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN public.statements.card_id IS 'Foreign key to cards table';
COMMENT ON COLUMN public.statements.file_path IS 'Path to PDF file in Supabase Storage';
COMMENT ON COLUMN public.statements.parsing_status IS 'Status of PDF parsing: pending, processing, success, failed';
COMMENT ON COLUMN public.statements.transaction_count IS 'Number of transactions parsed from statement';


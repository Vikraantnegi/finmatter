-- Create table for tracking individual EMI loans in statements
-- Migration: 20251017120200_create_statement_emi_loans_table.sql

CREATE TABLE IF NOT EXISTS public.statement_emi_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id UUID NOT NULL REFERENCES public.statements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  
  -- Loan identification
  loan_number TEXT NOT NULL,
  
  -- Loan details
  principal_amount NUMERIC(15,2) NOT NULL,
  emi_amount NUMERIC(15,2) NOT NULL,
  remaining_tenure INTEGER NOT NULL, -- Months remaining
  interest_rate NUMERIC(5,2), -- Annual interest rate in percentage
  
  -- Loan status
  start_date DATE,
  end_date DATE,
  
  -- Additional details
  product_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_statement_emi_loans_statement_id ON public.statement_emi_loans(statement_id);
CREATE INDEX IF NOT EXISTS idx_statement_emi_loans_user_id ON public.statement_emi_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_statement_emi_loans_card_id ON public.statement_emi_loans(card_id);
CREATE INDEX IF NOT EXISTS idx_statement_emi_loans_loan_number ON public.statement_emi_loans(loan_number);

-- Enable Row Level Security
ALTER TABLE public.statement_emi_loans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role full access
CREATE POLICY "Service role full access statement_emi_loans" ON public.statement_emi_loans
  FOR ALL USING (auth.role() = 'service_role');

-- Users can only access their own EMI loans
CREATE POLICY "Users own EMI loans access" ON public.statement_emi_loans
  FOR ALL USING (
    auth.jwt() ->> 'sub'::text = user_id::text
  ) WITH CHECK (
    auth.jwt() ->> 'sub'::text = user_id::text
  );

-- Create updated_at trigger
CREATE TRIGGER update_statement_emi_loans_updated_at 
  BEFORE UPDATE ON public.statement_emi_loans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.statement_emi_loans IS 'Individual EMI loans extracted from credit card statements';
COMMENT ON COLUMN public.statement_emi_loans.loan_number IS 'Bank-provided loan reference number';
COMMENT ON COLUMN public.statement_emi_loans.principal_amount IS 'Original principal amount of the loan';
COMMENT ON COLUMN public.statement_emi_loans.emi_amount IS 'Monthly EMI amount';
COMMENT ON COLUMN public.statement_emi_loans.remaining_tenure IS 'Number of months remaining';
COMMENT ON COLUMN public.statement_emi_loans.interest_rate IS 'Annual interest rate in percentage';


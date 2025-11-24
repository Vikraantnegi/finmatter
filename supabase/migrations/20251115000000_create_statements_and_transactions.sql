-- Migration: Create statements and transactions tables
-- Date: 2025-11-15
-- Description: Tables for PDF statement uploads and parsed transactions

-- Statements table: Track uploaded PDF statements
CREATE TABLE IF NOT EXISTS statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL, -- Size in bytes
  bank_name TEXT NOT NULL, -- 'hdfc', 'icici', 'amex', etc.
  statement_period_start DATE,
  statement_period_end DATE,
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_count INTEGER DEFAULT 0,
  parsing_status TEXT NOT NULL DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'success', 'failed')),
  parsing_error TEXT, -- Error message if parsing failed
  parsed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions table: Store parsed transaction data
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  statement_id UUID NOT NULL REFERENCES statements(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  posting_date DATE, -- When transaction was posted (may differ from transaction_date)
  merchant_name TEXT NOT NULL,
  merchant_category TEXT, -- MCC or category from statement
  amount NUMERIC(12, 2) NOT NULL, -- Always positive, use type field for credit/debit
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit', 'refund')),
  currency TEXT NOT NULL DEFAULT 'INR',
  description TEXT, -- Full transaction description from statement
  raw_text TEXT, -- Original line from PDF for debugging
  category TEXT, -- Auto-categorized or user-assigned category
  notes TEXT, -- User-added notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_statements_user_id ON statements(user_id);
CREATE INDEX IF NOT EXISTS idx_statements_card_id ON statements(card_id);
CREATE INDEX IF NOT EXISTS idx_statements_parsing_status ON statements(parsing_status);
CREATE INDEX IF NOT EXISTS idx_statements_upload_date ON statements(upload_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_statement_id ON transactions(statement_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(user_id, category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(user_id, merchant_name);

-- Enable Row Level Security
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for statements
CREATE POLICY "Users can view their own statements"
  ON statements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own statements"
  ON statements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own statements"
  ON statements FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_statements_updated_at
  BEFORE UPDATE ON statements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update statement transaction count
CREATE OR REPLACE FUNCTION update_statement_transaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE statements
    SET transaction_count = transaction_count + 1
    WHERE id = NEW.statement_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE statements
    SET transaction_count = GREATEST(transaction_count - 1, 0)
    WHERE id = OLD.statement_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain transaction count
CREATE TRIGGER update_statement_count_on_transaction
  AFTER INSERT OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_statement_transaction_count();


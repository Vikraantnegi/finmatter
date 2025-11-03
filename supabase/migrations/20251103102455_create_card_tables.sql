-- ============================================
-- Card Portfolio Management Schema
-- Migration: Create banks, cards_metadata, bin_lookup tables
-- Update cards table with new columns
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Step 1.1: Create banks table
-- ============================================
CREATE TABLE IF NOT EXISTS banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- e.g., 'hdfc', 'icici', 'sbi'
  display_name TEXT NOT NULL, -- e.g., 'HDFC Bank', 'ICICI Bank'
  logo_url TEXT, -- URL to bank logo icon only
  logo_with_name_url TEXT, -- URL to bank logo with name
  primary_color TEXT, -- Hex color code for primary brand color
  secondary_color TEXT, -- Hex color code for secondary brand color
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT banks_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
  CONSTRAINT banks_display_name_length CHECK (char_length(display_name) >= 2 AND char_length(display_name) <= 100),
  CONSTRAINT banks_color_format CHECK (
    primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  CONSTRAINT banks_secondary_color_format CHECK (
    secondary_color IS NULL OR secondary_color ~ '^#[0-9A-Fa-f]{6}$'
  )
);

-- Indexes for banks table
CREATE INDEX idx_banks_name ON banks(name);
CREATE INDEX idx_banks_active ON banks(is_active) WHERE is_active = true;
CREATE INDEX idx_banks_display_name ON banks(display_name);

-- ============================================
-- Step 1.2: Create cards_metadata table
-- ============================================
CREATE TABLE IF NOT EXISTS cards_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE RESTRICT,
  card_name TEXT NOT NULL, -- e.g., 'millennia', 'regalia'
  display_name TEXT NOT NULL, -- e.g., 'HDFC Millennia', 'ICICI Amazon Pay'
  card_type TEXT NOT NULL CHECK (card_type IN ('credit', 'debit', 'prepaid')),
  network TEXT NOT NULL CHECK (network IN ('visa', 'mastercard', 'rupay', 'amex', 'discover', 'diners')),
  reward_type TEXT CHECK (reward_type IN ('cashback', 'points', 'miles', 'none')),
  annual_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  joining_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  
  -- Color scheme (can override bank colors)
  primary_color TEXT,
  secondary_color TEXT,
  card_logo_url TEXT,
  
  -- Structured JSONB fields for card features
  benefits JSONB DEFAULT '[]'::jsonb, -- Array of benefit objects
  offers JSONB DEFAULT '[]'::jsonb, -- Array of offer objects
  rewards JSONB DEFAULT '{}'::jsonb, -- Structured reward details
  milestones JSONB DEFAULT '[]'::jsonb, -- Array of milestone objects
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- For any other unstructured data
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT cards_metadata_unique_bank_card UNIQUE(bank_id, card_name),
  CONSTRAINT cards_metadata_card_name_length CHECK (char_length(card_name) >= 2 AND char_length(card_name) <= 100),
  CONSTRAINT cards_metadata_display_name_length CHECK (char_length(display_name) >= 2 AND char_length(display_name) <= 150),
  CONSTRAINT cards_metadata_color_format CHECK (
    primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  CONSTRAINT cards_metadata_secondary_color_format CHECK (
    secondary_color IS NULL OR secondary_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  CONSTRAINT cards_metadata_annual_fee_positive CHECK (annual_fee >= 0),
  CONSTRAINT cards_metadata_joining_fee_positive CHECK (joining_fee >= 0),
  
  -- JSONB structure validation (PostgreSQL 12+)
  CONSTRAINT cards_metadata_benefits_is_array CHECK (jsonb_typeof(benefits) = 'array'),
  CONSTRAINT cards_metadata_offers_is_array CHECK (jsonb_typeof(offers) = 'array'),
  CONSTRAINT cards_metadata_rewards_is_object CHECK (jsonb_typeof(rewards) = 'object'),
  CONSTRAINT cards_metadata_milestones_is_array CHECK (jsonb_typeof(milestones) = 'array')
);

-- Indexes for cards_metadata table
CREATE INDEX idx_cards_metadata_bank ON cards_metadata(bank_id);
CREATE INDEX idx_cards_metadata_active ON cards_metadata(is_active) WHERE is_active = true;
CREATE INDEX idx_cards_metadata_card_type ON cards_metadata(card_type);
CREATE INDEX idx_cards_metadata_network ON cards_metadata(network);
CREATE INDEX idx_cards_metadata_reward_type ON cards_metadata(reward_type);
CREATE INDEX idx_cards_metadata_benefits ON cards_metadata USING GIN(benefits);
CREATE INDEX idx_cards_metadata_offers ON cards_metadata USING GIN(offers);
CREATE INDEX idx_cards_metadata_rewards ON cards_metadata USING GIN(rewards);
CREATE INDEX idx_cards_metadata_milestones ON cards_metadata USING GIN(milestones);

-- ============================================
-- Step 1.3: Create bin_lookup table
-- ============================================
CREATE TABLE IF NOT EXISTS bin_lookup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_start TEXT NOT NULL, -- First 6 digits (or range start)
  bin_end TEXT, -- For ranges, can be same as bin_start for exact match
  bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE RESTRICT,
  card_metadata_id UUID REFERENCES cards_metadata(id) ON DELETE SET NULL, -- Optional: specific card if known
  card_type TEXT NOT NULL CHECK (card_type IN ('credit', 'debit', 'prepaid')),
  network TEXT NOT NULL CHECK (network IN ('visa', 'mastercard', 'rupay', 'amex', 'discover', 'diners')),
  country TEXT DEFAULT 'IN', -- ISO country code
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT bin_lookup_start_length CHECK (char_length(bin_start) = 6),
  CONSTRAINT bin_lookup_end_length CHECK (bin_end IS NULL OR char_length(bin_end) = 6),
  CONSTRAINT bin_lookup_start_numeric CHECK (bin_start ~ '^[0-9]{6}$'),
  CONSTRAINT bin_lookup_end_numeric CHECK (bin_end IS NULL OR bin_end ~ '^[0-9]{6}$'),
  CONSTRAINT bin_lookup_range_valid CHECK (
    bin_end IS NULL OR 
    bin_end = bin_start OR 
    bin_end >= bin_start
  )
);

-- Indexes for bin_lookup table (critical for fast lookups)
-- Note: Multiple BIN entries are allowed for the same range (different card products)
-- Lookup logic will prioritize entries with card_metadata_id
CREATE INDEX idx_bin_lookup_start ON bin_lookup(bin_start);
CREATE INDEX idx_bin_lookup_range ON bin_lookup(bin_start, COALESCE(bin_end, bin_start)) WHERE is_active = true;
CREATE INDEX idx_bin_lookup_bank ON bin_lookup(bank_id);
CREATE INDEX idx_bin_lookup_card_metadata ON bin_lookup(card_metadata_id) WHERE card_metadata_id IS NOT NULL;
CREATE INDEX idx_bin_lookup_active ON bin_lookup(is_active) WHERE is_active = true;
CREATE INDEX idx_bin_lookup_network ON bin_lookup(network);
CREATE INDEX idx_bin_lookup_composite ON bin_lookup(bin_start, bank_id, card_type, network) WHERE is_active = true;

-- ============================================
-- Step 1.4: Create or update cards table
-- ============================================
-- First, check if cards table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Will reference auth.users (Supabase handles this)
  bank_name TEXT, -- Keep for backward compatibility, prefer bank_id
  card_name TEXT,
  last_four_digits TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN ('credit', 'debit', 'prepaid')),
  network TEXT NOT NULL CHECK (network IN ('visa', 'mastercard', 'rupay', 'amex', 'discover', 'diners')),
  reward_type TEXT CHECK (reward_type IN ('cashback', 'points', 'miles', 'none')),
  annual_fee NUMERIC(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'blocked', 'expired')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add new columns to cards table (if they don't exist)
-- Note: PostgreSQL doesn't support IF NOT EXISTS for ALTER TABLE, so we'll check and add conditionally

-- Add bank_id reference
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'bank_id'
  ) THEN
    ALTER TABLE cards ADD COLUMN bank_id UUID REFERENCES banks(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add card_metadata_id reference
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'card_metadata_id'
  ) THEN
    ALTER TABLE cards ADD COLUMN card_metadata_id UUID REFERENCES cards_metadata(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add card holder name
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'card_holder_name'
  ) THEN
    ALTER TABLE cards ADD COLUMN card_holder_name TEXT;
  END IF;
END $$;

-- Add expiry fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'expiry_month'
  ) THEN
    ALTER TABLE cards ADD COLUMN expiry_month INTEGER CHECK (expiry_month >= 1 AND expiry_month <= 12);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'expiry_year'
  ) THEN
    ALTER TABLE cards ADD COLUMN expiry_year INTEGER CHECK (expiry_year >= 2000 AND expiry_year <= 9999);
  END IF;
END $$;

-- Add encrypted CVV (stored as TEXT for encrypted value)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'cvv_encrypted'
  ) THEN
    ALTER TABLE cards ADD COLUMN cvv_encrypted TEXT; -- Encrypted CVV for display purposes only
  END IF;
END $$;

-- Add BIN detection fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'detected_from_bin'
  ) THEN
    ALTER TABLE cards ADD COLUMN detected_from_bin BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'bin_lookup_source'
  ) THEN
    ALTER TABLE cards ADD COLUMN bin_lookup_source TEXT CHECK (bin_lookup_source IN ('internal', 'binlist_api', 'manual')) DEFAULT 'manual';
  END IF;
END $$;

-- Add additional card fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'issue_date'
  ) THEN
    ALTER TABLE cards ADD COLUMN issue_date DATE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'billing_day'
  ) THEN
    ALTER TABLE cards ADD COLUMN billing_day INTEGER CHECK (billing_day >= 1 AND billing_day <= 31);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'credit_limit'
  ) THEN
    ALTER TABLE cards ADD COLUMN credit_limit NUMERIC(10, 2) CHECK (credit_limit >= 0);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'available_credit'
  ) THEN
    ALTER TABLE cards ADD COLUMN available_credit NUMERIC(10, 2) CHECK (available_credit >= 0);
  END IF;
END $$;

-- Add constraints to cards table
DO $$ 
BEGIN
  -- Add foreign key constraint for user_id if cards table exists but constraint doesn't
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'cards' AND constraint_name = 'cards_user_id_fkey'
  ) THEN
    -- Note: This assumes auth.users table exists (handled by Supabase)
    -- We'll add the constraint with a warning if auth.users doesn't exist
    BEGIN
      ALTER TABLE cards ADD CONSTRAINT cards_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add user_id foreign key constraint. This is normal if auth.users table does not exist yet.';
    END;
  END IF;
END $$;

-- Add constraint for last_four_digits format
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'cards' AND constraint_name = 'cards_last_four_digits_format'
  ) THEN
    ALTER TABLE cards ADD CONSTRAINT cards_last_four_digits_format 
      CHECK (char_length(last_four_digits) = 4 AND last_four_digits ~ '^[0-9]{4}$');
  END IF;
END $$;

-- ============================================
-- Step 1.5: Create indexes for cards table
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_bank_id ON cards(bank_id) WHERE bank_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_card_metadata_id ON cards(card_metadata_id) WHERE card_metadata_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_card_type ON cards(card_type);
CREATE INDEX IF NOT EXISTS idx_cards_network ON cards(network);
CREATE INDEX IF NOT EXISTS idx_cards_last_four_digits ON cards(last_four_digits);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);

-- ============================================
-- Step 1.6: Create update triggers for updated_at
-- ============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables
DROP TRIGGER IF EXISTS update_banks_updated_at ON banks;
CREATE TRIGGER update_banks_updated_at
  BEFORE UPDATE ON banks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cards_metadata_updated_at ON cards_metadata;
CREATE TRIGGER update_cards_metadata_updated_at
  BEFORE UPDATE ON cards_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bin_lookup_updated_at ON bin_lookup;
CREATE TRIGGER update_bin_lookup_updated_at
  BEFORE UPDATE ON bin_lookup
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE banks IS 'Stores bank information including logos and brand colors';
COMMENT ON TABLE cards_metadata IS 'Metadata for credit cards including benefits, offers, rewards, and milestones';
COMMENT ON TABLE bin_lookup IS 'BIN (Bank Identification Number) ranges for card detection';
COMMENT ON TABLE cards IS 'User-specific credit cards linked to their account';

COMMENT ON COLUMN banks.name IS 'Internal bank identifier (lowercase, no spaces)';
COMMENT ON COLUMN banks.display_name IS 'User-friendly bank name for display';
COMMENT ON COLUMN cards_metadata.benefits IS 'JSONB array of benefit objects with category, rewardRate, etc.';
COMMENT ON COLUMN cards_metadata.offers IS 'JSONB array of offer objects with title, validity, etc.';
COMMENT ON COLUMN cards_metadata.rewards IS 'JSONB object with baseRate, acceleratedRates, redemption options';
COMMENT ON COLUMN cards_metadata.milestones IS 'JSONB array of milestone objects with spending thresholds';
COMMENT ON COLUMN bin_lookup.bin_start IS 'First 6 digits of card number (range start)';
COMMENT ON COLUMN bin_lookup.bin_end IS 'Last 6 digits of card number range (or same as bin_start for exact match)';
COMMENT ON COLUMN cards.cvv_encrypted IS 'Encrypted CVV for display purposes only. Consider not storing CVV in production.';
COMMENT ON COLUMN cards.last_four_digits IS 'Last 4 digits of card number (plain text for display purposes)';
COMMENT ON COLUMN cards.detected_from_bin IS 'Whether card details were auto-detected from BIN lookup';
COMMENT ON COLUMN cards.bin_lookup_source IS 'Source of BIN lookup: internal (our DB), binlist_api, or manual entry';


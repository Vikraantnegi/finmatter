-- Create BIN (Bank Identification Number) ranges table
-- This helps identify card issuer and network from card number

CREATE TABLE IF NOT EXISTS bin_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_start VARCHAR(8) NOT NULL,
  bin_end VARCHAR(8) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  card_network VARCHAR(50) NOT NULL CHECK (card_network IN ('Visa', 'Mastercard', 'RuPay', 'Amex', 'Discover', 'Diners')),
  card_type VARCHAR(50) DEFAULT 'credit' CHECK (card_type IN ('credit', 'debit', 'prepaid')),
  card_brand VARCHAR(255), -- e.g., "HDFC Regalia", "SBI SimplyCLICK"
  card_metadata_id TEXT, -- Optional reference to cards_metadata
  country_code VARCHAR(3) DEFAULT 'IN',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast BIN lookup
CREATE INDEX idx_bin_ranges_lookup ON bin_ranges(bin_start, bin_end) WHERE is_active = true;
CREATE INDEX idx_bin_ranges_bank ON bin_ranges(bank_name) WHERE is_active = true;
CREATE INDEX idx_bin_ranges_network ON bin_ranges(card_network);

-- Add RLS policies
ALTER TABLE bin_ranges ENABLE ROW LEVEL SECURITY;

-- Public read access for BIN lookup
CREATE POLICY "BIN ranges are publicly readable" ON bin_ranges
  FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Only admins can modify BIN ranges" ON bin_ranges
  FOR ALL USING (false);

-- Add comment
COMMENT ON TABLE bin_ranges IS 'Bank Identification Number ranges for card network and issuer detection';


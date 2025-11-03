-- ============================================
-- Networks Table Migration
-- Stores payment network information (Visa, Mastercard, RuPay, Amex, Discover)
-- ============================================

CREATE TABLE IF NOT EXISTS networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- e.g., 'visa', 'mastercard', 'rupay', 'amex', 'discover'
  display_name TEXT NOT NULL, -- e.g., 'Visa', 'Mastercard', 'RuPay'
  icon_url TEXT, -- URL to network icon (square/icon format)
  logo_url TEXT, -- URL to network logo (full logo with name)
  primary_color TEXT, -- Hex color code for primary brand color
  secondary_color TEXT, -- Hex color code for secondary brand color
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT networks_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
  CONSTRAINT networks_display_name_length CHECK (char_length(display_name) >= 2 AND char_length(display_name) <= 100),
  CONSTRAINT networks_color_format CHECK (
    primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  CONSTRAINT networks_secondary_color_format CHECK (
    secondary_color IS NULL OR secondary_color ~ '^#[0-9A-Fa-f]{6}$'
  )
);

-- Indexes for networks table
CREATE INDEX idx_networks_name ON networks(name);
CREATE INDEX idx_networks_active ON networks(is_active) WHERE is_active = true;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_networks_updated_at ON networks;
CREATE TRIGGER update_networks_updated_at
  BEFORE UPDATE ON networks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE networks IS 'Stores payment network information (Visa, Mastercard, RuPay, Amex, Discover)';
COMMENT ON COLUMN networks.name IS 'Internal network identifier (lowercase, no spaces)';
COMMENT ON COLUMN networks.display_name IS 'User-friendly network name for display';


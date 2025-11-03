-- ============================================
-- Row Level Security (RLS) Policies
-- Migration: Add RLS policies for banks, cards_metadata, bin_lookup, networks, and cards tables
-- ============================================

-- Enable RLS on all tables
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE bin_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Banks Table Policies
-- ============================================
-- Policy: Read-only for authenticated users
CREATE POLICY "Banks are viewable by authenticated users"
  ON banks
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Allow service role to manage banks
CREATE POLICY "Service role can manage banks"
  ON banks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Networks Table Policies
-- ============================================
-- Policy: Read-only for authenticated users
CREATE POLICY "Networks are viewable by authenticated users"
  ON networks
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Allow service role to manage networks
CREATE POLICY "Service role can manage networks"
  ON networks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Cards Metadata Table Policies
-- ============================================
-- Policy: Read-only for authenticated users
CREATE POLICY "Cards metadata are viewable by authenticated users"
  ON cards_metadata
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Allow service role to manage cards metadata
CREATE POLICY "Service role can manage cards metadata"
  ON cards_metadata
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- BIN Lookup Table Policies
-- ============================================
-- Policy: Read-only for authenticated users
CREATE POLICY "BIN lookup is viewable by authenticated users"
  ON bin_lookup
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Allow service role to manage BIN lookup
CREATE POLICY "Service role can manage BIN lookup"
  ON bin_lookup
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Cards Table Policies (User-specific)
-- ============================================
-- Policy: Users can view their own cards
CREATE POLICY "Users can view their own cards"
  ON cards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own cards
CREATE POLICY "Users can insert their own cards"
  ON cards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own cards
CREATE POLICY "Users can update their own cards"
  ON cards
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own cards (soft delete)
CREATE POLICY "Users can delete their own cards"
  ON cards
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Allow service role to manage all cards
CREATE POLICY "Service role can manage all cards"
  ON cards
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


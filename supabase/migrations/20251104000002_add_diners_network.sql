-- ============================================
-- Add Diners Club to network constraints
-- ============================================

-- Update cards_metadata table to include 'diners' in network constraint
ALTER TABLE cards_metadata 
  DROP CONSTRAINT IF EXISTS cards_metadata_network_check;

ALTER TABLE cards_metadata
  ADD CONSTRAINT cards_metadata_network_check 
  CHECK (network IN ('visa', 'mastercard', 'rupay', 'amex', 'discover', 'diners'));

-- Update bin_lookup table to include 'diners' in network constraint
ALTER TABLE bin_lookup 
  DROP CONSTRAINT IF EXISTS bin_lookup_network_check;

ALTER TABLE bin_lookup
  ADD CONSTRAINT bin_lookup_network_check 
  CHECK (network IN ('visa', 'mastercard', 'rupay', 'amex', 'discover', 'diners'));

-- Update cards table to include 'diners' in network constraint
ALTER TABLE cards 
  DROP CONSTRAINT IF EXISTS cards_network_check;

ALTER TABLE cards
  ADD CONSTRAINT cards_network_check 
  CHECK (network IN ('visa', 'mastercard', 'rupay', 'amex', 'discover', 'diners'));


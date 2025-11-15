-- Drop deprecated cvv_encrypted column (no longer storing CVV data)
ALTER TABLE cards DROP COLUMN IF EXISTS cvv_encrypted;

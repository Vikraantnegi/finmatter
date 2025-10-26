-- Fix location column type in transactions table
-- Migration: 20251026000000_fix_location_column_type.sql

-- Drop the old location column if it exists
ALTER TABLE public.transactions DROP COLUMN IF EXISTS location;

-- Add the new location column as TEXT with proper constraint
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS location TEXT CHECK (location IN ('domestic', 'international'));

-- Recreate index for TEXT location
DROP INDEX IF EXISTS idx_transactions_location;

CREATE INDEX IF NOT EXISTS idx_transactions_location ON public.transactions(location) WHERE location IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.transactions.location IS 'Transaction location: domestic or international';

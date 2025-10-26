-- Fix location column type in transactions table
-- Migration: 20251026000000_fix_location_column_type.sql

-- First, check if we need to change the column type
-- The original table created location as JSONB, but we need it as TEXT

DO $$
BEGIN
  -- If location column exists as JSONB, we need to convert it
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'transactions' 
      AND column_name = 'location' 
      AND data_type = 'jsonb'
  ) THEN
    -- Convert all existing location values to TEXT
    -- Extract 'domestic' or 'international' from JSONB
    UPDATE public.transactions 
    SET location = (
      CASE 
        WHEN location::text LIKE '%domestic%' THEN 'domestic'
        WHEN location::text LIKE '%international%' THEN 'international'
        ELSE NULL
      END
    )::text
    WHERE location IS NOT NULL;

    -- Drop the old JSONB column
    ALTER TABLE public.transactions DROP COLUMN IF EXISTS location;

    -- Add the new TEXT column with proper constraint
    ALTER TABLE public.transactions 
      ADD COLUMN location TEXT CHECK (location IN ('domestic', 'international'));
  END IF;
END $$;

-- If the column doesn't exist or isn't JSONB, ensure it's TEXT
ALTER TABLE public.transactions 
  DROP COLUMN IF EXISTS location;

ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS location TEXT CHECK (location IN ('domestic', 'international'));

-- Drop old index if exists
DROP INDEX IF EXISTS idx_transactions_location;

-- Recreate index for TEXT location
CREATE INDEX IF NOT EXISTS idx_transactions_location ON public.transactions(location) WHERE location IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.transactions.location IS 'Transaction location: domestic or international';


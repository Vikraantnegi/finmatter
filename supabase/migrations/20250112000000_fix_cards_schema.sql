-- Migration: 20250112000000_fix_cards_schema.sql
-- Fix critical schema issues in cards and card_benefits tables

-- ============================================
-- 1. Add missing columns to card_benefits
-- ============================================

-- Add reward_type column (was in TypeScript but not in DB)
ALTER TABLE public.card_benefits
ADD COLUMN IF NOT EXISTS reward_type TEXT CHECK (reward_type IN ('cashback', 'points', 'miles'));

-- Add validity period columns
ALTER TABLE public.card_benefits
ADD COLUMN IF NOT EXISTS valid_from TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;

-- Add description column for custom benefits
ALTER TABLE public.card_benefits
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS value TEXT;

-- Update comments
COMMENT ON COLUMN public.card_benefits.reward_type IS 'Type of reward: cashback, points, or miles';
COMMENT ON COLUMN public.card_benefits.valid_from IS 'Start date for benefit validity period';
COMMENT ON COLUMN public.card_benefits.valid_until IS 'End date for benefit validity period';
COMMENT ON COLUMN public.card_benefits.description IS 'Custom benefit description';
COMMENT ON COLUMN public.card_benefits.value IS 'Benefit value (e.g., "5% cashback", "1000 points")';

-- ============================================
-- 2. Add missing columns to cards
-- ============================================

-- Add billing_day column (nullable - can be extracted from statements later)
ALTER TABLE public.cards
ADD COLUMN IF NOT EXISTS billing_day INTEGER CHECK (billing_day BETWEEN 1 AND 31);

-- Add deleted_at for soft delete functionality
ALTER TABLE public.cards
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add metadata reference columns
ALTER TABLE public.cards
ADD COLUMN IF NOT EXISTS card_metadata_id TEXT,
ADD COLUMN IF NOT EXISTS bank_id TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT,
ADD COLUMN IF NOT EXISTS secondary_color TEXT,
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;

-- Update comments
COMMENT ON COLUMN public.cards.billing_day IS 'Day of month when statement is generated (1-31). Optional - can be extracted from statements.';
COMMENT ON COLUMN public.cards.deleted_at IS 'Timestamp when card was soft deleted. NULL means active.';
COMMENT ON COLUMN public.cards.card_metadata_id IS 'Reference to card metadata from CC Engine';
COMMENT ON COLUMN public.cards.bank_id IS 'Reference to bank metadata from CC Engine';
COMMENT ON COLUMN public.cards.primary_color IS 'Card primary color for visual representation';
COMMENT ON COLUMN public.cards.secondary_color IS 'Card secondary color for visual representation';
COMMENT ON COLUMN public.cards.is_custom IS 'Whether this is a custom card (true) or from metadata (false)';

-- ============================================
-- 3. Create indexes for better performance
-- ============================================

-- Index for card_type filtering
CREATE INDEX IF NOT EXISTS idx_cards_card_type ON public.cards(card_type) WHERE deleted_at IS NULL;

-- Index for last_four_digits search
CREATE INDEX IF NOT EXISTS idx_cards_last_four_digits ON public.cards(last_four_digits) WHERE deleted_at IS NULL;

-- Composite index for common query pattern (user + active cards)
CREATE INDEX IF NOT EXISTS idx_cards_user_status_active ON public.cards(user_id, status) WHERE deleted_at IS NULL;

-- Index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_cards_deleted_at ON public.cards(deleted_at);

-- Index for billing day queries
CREATE INDEX IF NOT EXISTS idx_cards_billing_day ON public.cards(billing_day) WHERE deleted_at IS NULL;

-- Index for benefits validity period
CREATE INDEX IF NOT EXISTS idx_card_benefits_validity ON public.card_benefits(valid_from, valid_until) WHERE is_active = TRUE;

-- ============================================
-- 4. Create unique constraint for duplicate detection
-- ============================================

-- Prevent duplicate cards (same user, bank, last 4 digits)
-- Only check active cards (not deleted)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_unique_active 
ON public.cards(user_id, bank_name, last_four_digits) 
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_cards_unique_active IS 'Prevents duplicate active cards with same bank and last 4 digits for same user';

-- ============================================
-- 5. Update RLS policies to respect soft delete
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users own cards access" ON public.cards;

-- Recreate with soft delete filter
CREATE POLICY "Users own cards access" ON public.cards
  FOR ALL USING (
    auth.jwt() ->> 'sub'::text = user_id::text
    AND deleted_at IS NULL  -- Only show non-deleted cards
  ) WITH CHECK (
    auth.jwt() ->> 'sub'::text = user_id::text
  );

-- Add policy for accessing deleted cards (for recovery/audit)
CREATE POLICY "Users can view their deleted cards" ON public.cards
  FOR SELECT USING (
    auth.jwt() ->> 'sub'::text = user_id::text
    AND deleted_at IS NOT NULL
  );

-- ============================================
-- 6. Data migration (if needed)
-- ============================================

-- Set default reward_type for existing benefits (assume cashback if not set)
UPDATE public.card_benefits
SET reward_type = 'cashback'
WHERE reward_type IS NULL;

-- ============================================
-- 7. Add constraints after data migration
-- ============================================

-- Make reward_type NOT NULL (after setting defaults above)
ALTER TABLE public.card_benefits
ALTER COLUMN reward_type SET NOT NULL;

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- To rollback this migration, run:
/*
ALTER TABLE public.card_benefits DROP COLUMN IF EXISTS reward_type;
ALTER TABLE public.card_benefits DROP COLUMN IF EXISTS valid_from;
ALTER TABLE public.card_benefits DROP COLUMN IF EXISTS valid_until;
ALTER TABLE public.card_benefits DROP COLUMN IF EXISTS description;
ALTER TABLE public.card_benefits DROP COLUMN IF EXISTS value;

ALTER TABLE public.cards DROP COLUMN IF EXISTS billing_day;
ALTER TABLE public.cards DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE public.cards DROP COLUMN IF EXISTS card_metadata_id;
ALTER TABLE public.cards DROP COLUMN IF EXISTS bank_id;
ALTER TABLE public.cards DROP COLUMN IF EXISTS primary_color;
ALTER TABLE public.cards DROP COLUMN IF EXISTS secondary_color;
ALTER TABLE public.cards DROP COLUMN IF EXISTS is_custom;

DROP INDEX IF EXISTS idx_cards_card_type;
DROP INDEX IF EXISTS idx_cards_last_four_digits;
DROP INDEX IF EXISTS idx_cards_user_status_active;
DROP INDEX IF EXISTS idx_cards_deleted_at;
DROP INDEX IF EXISTS idx_cards_billing_day;
DROP INDEX IF EXISTS idx_card_benefits_validity;
DROP INDEX IF EXISTS idx_cards_unique_active;
*/


-- Migration: Make network column nullable in cards table
-- Date: 2025-11-24
-- Description: Allow null network when BIN lookup fails

-- Make network column nullable
ALTER TABLE cards ALTER COLUMN network DROP NOT NULL;


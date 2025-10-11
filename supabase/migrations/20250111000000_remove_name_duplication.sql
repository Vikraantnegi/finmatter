-- Remove name duplication and clean up unused fields
-- Migration: 20250111000000_remove_name_duplication.sql
-- 
-- Changes:
-- 1. Drop 'name' column (data duplicated in profile_data.firstName/lastName)
-- 2. Drop 'sms_permission_granted' (legacy from mobile app, unused in web-pwa)
-- 3. Add comment to email column (reserved for future use)

-- Drop name column - profile_data is now the single source of truth
ALTER TABLE public.users DROP COLUMN IF EXISTS name;

-- Drop index for name column
DROP INDEX IF EXISTS idx_users_name;

-- Drop sms_permission_granted - not applicable for web-pwa
ALTER TABLE public.users DROP COLUMN IF EXISTS sms_permission_granted;

-- Add comment to email column indicating future use
COMMENT ON COLUMN public.users.email IS 'User email address (optional) - Reserved for future implementation';

-- Add constraint to ensure profile_data has firstName (required field)
-- This ensures data integrity after removing name column
ALTER TABLE public.users 
ADD CONSTRAINT profile_data_has_firstname 
CHECK (
  profile_data ? 'firstName' AND 
  jsonb_typeof(profile_data->'firstName') = 'string' AND
  length(profile_data->>'firstName') > 0
);

-- Update comment on profile_data to reflect it's now the primary name storage
COMMENT ON COLUMN public.users.profile_data IS 'User profile information including firstName (required) and lastName (optional). Source of truth for user name.';


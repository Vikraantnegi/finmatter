-- Fix profile_data constraint to allow empty firstName during initial user creation
-- Migration: 20251011164106_fix_profile_data_constraint.sql
--
-- Issue: The current constraint requires firstName to have length > 0, but during
-- initial user creation (verify-otp), we need to create users with empty firstName
-- that will be populated during onboarding.

-- Drop the existing constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS profile_data_has_firstname;

-- Add a new constraint that allows empty firstName during initial creation
-- but requires firstName to be present and non-empty after onboarding
ALTER TABLE public.users 
ADD CONSTRAINT profile_data_has_firstname 
CHECK (
  profile_data ? 'firstName' AND 
  jsonb_typeof(profile_data->'firstName') = 'string' AND
  (
    -- Allow empty firstName if onboarding is not completed
    (profile_data->>'firstName' = '' AND onboarding_completed = false) OR
    -- Require non-empty firstName if onboarding is completed
    (length(profile_data->>'firstName') > 0 AND onboarding_completed = true) OR
    -- Allow non-empty firstName regardless of onboarding status
    (length(profile_data->>'firstName') > 0)
  )
);

-- Update comment to reflect the new constraint logic
COMMENT ON COLUMN public.users.profile_data IS 'User profile information including firstName (required after onboarding) and lastName (optional). Source of truth for user name.';

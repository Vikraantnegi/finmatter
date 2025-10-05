-- Add user profile fields to users table
-- Migration: 20250104180000_add_user_profile_fields.sql

-- Add new columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_permission_granted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users(name);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON public.users(onboarding_completed);

-- Add comments for documentation
COMMENT ON COLUMN public.users.name IS 'User display name';
COMMENT ON COLUMN public.users.email IS 'User email address (optional)';
COMMENT ON COLUMN public.users.notifications_enabled IS 'Whether user has enabled notifications';
COMMENT ON COLUMN public.users.sms_permission_granted IS 'Whether user has granted SMS read permission';
COMMENT ON COLUMN public.users.onboarding_completed IS 'Whether user has completed onboarding flow';

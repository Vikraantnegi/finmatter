-- Create users table for FinMatter app
-- This table stores user information with phone authentication

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  biometric_enabled BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  profile_data JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON public.users(phone_number);

-- Create index for created_at for analytics
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only access their own data
CREATE POLICY "Users can access own data" ON public.users
  FOR ALL USING (auth.jwt() ->> 'sub'::text = id::text);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.users IS 'FinMatter users table with phone authentication';
COMMENT ON COLUMN public.users.phone_number IS 'User phone number for authentication';
COMMENT ON COLUMN public.users.biometric_enabled IS 'Whether user has enabled biometric authentication';
COMMENT ON COLUMN public.users.profile_data IS 'Additional user profile information as JSON';

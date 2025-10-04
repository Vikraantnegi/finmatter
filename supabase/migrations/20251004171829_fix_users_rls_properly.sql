-- Fix RLS policies for users table properly
-- Enable RLS with correct policies for production

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Service role can delete users" ON public.users;

-- Create proper policies for authentication flow

-- Policy 1: Service role can do everything (for API operations)
CREATE POLICY "Service role full access" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- Policy 2: Authenticated users can read/update their own data
CREATE POLICY "Users own data access" ON public.users
  FOR ALL USING (
    auth.jwt() ->> 'sub'::text = id::text
  ) WITH CHECK (
    auth.jwt() ->> 'sub'::text = id::text
  );

-- Policy 3: Allow anonymous users to insert (for signup flow)
-- This is needed during phone auth when user doesn't have JWT yet
CREATE POLICY "Allow signup" ON public.users
  FOR INSERT WITH CHECK (true);

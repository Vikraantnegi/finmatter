/**
 * Supabase Server Client
 * Configured for server-side operations with service role key
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase configuration
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY environment variable');
}

/**
 * Server-side Supabase client with service role key
 * This client bypasses RLS and has full database access
 * Use only on the server side, never expose to client
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Public Supabase client for client-side operations
 * This client respects RLS policies
 */
export const supabase = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
);

// Type exports for use in API routes
export type { User, Session } from '@supabase/supabase-js';

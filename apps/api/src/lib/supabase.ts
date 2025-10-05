import { createClient } from '@supabase/supabase-js';
import type { Database } from '@finmatter/types';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Client for browser/client-side usage
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client for server-side usage with service key
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

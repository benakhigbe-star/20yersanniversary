import { createClient } from '@supabase/supabase-js';

/**
 * Anon-key Supabase client, safe to use in the browser. Given the RLS
 * policies deny all anon/authenticated access (see migration 0002), this
 * client can only ever read/write through Supabase Storage's public
 * buckets (if configured) — it is not used for any guest/admin data table.
 * Kept here so the "future magic-link" migration path has a ready-made
 * browser client to switch guest data calls onto.
 */
export function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

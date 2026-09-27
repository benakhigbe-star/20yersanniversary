import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client. SERVER-ONLY — importing this from a client
 * component will fail the build (see the `server-only` package import
 * above). This is the sole place in the codebase that talks to Supabase
 * with elevated privileges; every API route scopes queries manually by
 * event_id / guest_id before returning data to a caller.
 */
// No generated `Database` type exists yet (see README — `supabase gen types`
// can produce one later). Typed as `any` schema so query builder methods
// don't collapse insert/update payloads to `never`; every call site already
// validates its input with zod and casts read results to the hand-written
// types in src/types/db.ts, so this doesn't weaken actual safety.
let cached: ReturnType<typeof createClient<any, 'public', any>> | null = null;

export function supabaseAdmin() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  cached = createClient<any, 'public', any>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

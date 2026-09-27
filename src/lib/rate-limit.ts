import 'server-only';
import { supabaseAdmin } from './supabase/admin';

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 8;

/**
 * DB-backed rate limiting (an in-memory counter would reset on every
 * serverless cold start, which is most of the time on Vercel). Cheap to
 * query at this guest-list scale (tens of rows per window).
 */
export async function checkRateLimit(
  identifier: string,
  kind: 'guest' | 'admin'
): Promise<{ allowed: boolean; retryAfterMinutes?: number }> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error } = await supabaseAdmin()
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .eq('kind', kind)
    .eq('succeeded', false)
    .gte('created_at', since);

  if (error) {
    // Fail open on infra errors rather than locking everyone out, but log it.
    console.error('rate limit check failed', error);
    return { allowed: true };
  }

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMinutes: WINDOW_MINUTES };
  }
  return { allowed: true };
}

export async function recordLoginAttempt(
  identifier: string,
  kind: 'guest' | 'admin',
  succeeded: boolean
) {
  await supabaseAdmin().from('login_attempts').insert({ identifier, kind, succeeded });
}

import 'server-only';
import { NextResponse } from 'next/server';
import { getGuestSession, type GuestSessionPayload } from './auth/guest';
import { getAdminSession, type AdminSessionPayload } from './auth/admin';
import { getCurrentEvent } from './event';
import type { Event } from '@/types/db';

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Every route that needs "the" event must call this instead of
 * `getCurrentEvent()` directly. Before the event is seeded (or if Supabase
 * env vars are wrong), `getCurrentEvent()` throws — left uncaught, that
 * produces a non-JSON error response, which client code trying to
 * `res.json()` it then misreports as a generic "Network error". This turns
 * that failure into a clean, catchable JSON response instead.
 */
export async function requireCurrentEvent(): Promise<{ event: Event } | { error: NextResponse }> {
  try {
    const event = await getCurrentEvent();
    return { event };
  } catch (err) {
    console.error('requireCurrentEvent failed', err);
    return {
      error: jsonError(
        503,
        'The event is not set up yet. Make sure the database migrations have run and NEXT_PUBLIC_EVENT_SLUG matches a seeded event.'
      ),
    };
  }
}

/**
 * Every guest-scoped API route must call this first and use the returned
 * `guestId` to filter every query. This — not RLS — is what stops guest A
 * from reading/writing guest B's data, since guests don't hold a Supabase
 * Auth session for RLS to key off. See supabase/migrations/0002_rls.sql.
 */
export async function requireGuestSession(): Promise<
  { session: GuestSessionPayload } | { error: NextResponse }
> {
  const session = await getGuestSession();
  if (!session) {
    return { error: jsonError(401, 'Not signed in.') };
  }
  return { session };
}

export async function requireAdminSession(): Promise<
  { session: AdminSessionPayload } | { error: NextResponse }
> {
  const session = await getAdminSession();
  if (!session) {
    return { error: jsonError(401, 'Admin authentication required.') };
  }
  return { session };
}

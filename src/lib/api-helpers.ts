import 'server-only';
import { NextResponse } from 'next/server';
import { getGuestSession, type GuestSessionPayload } from './auth/guest';
import { getAdminSession, type AdminSessionPayload } from './auth/admin';

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
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

import 'server-only';
import { cookies } from 'next/headers';
import { signToken, verifyToken } from './jwt';
import { GUEST_COOKIE_NAME } from './constants';

export { GUEST_COOKIE_NAME };
const GUEST_SESSION_TTL = '180d'; // "sessions should persist" — guests rarely re-enter their email
const GUEST_SESSION_MAX_AGE = 60 * 60 * 24 * 180;

export interface GuestSessionPayload {
  [key: string]: unknown;
  guestId: string;
  eventId: string;
  email: string;
}

function secret(): string {
  const s = process.env.GUEST_SESSION_SECRET;
  if (!s) throw new Error('GUEST_SESSION_SECRET is not set.');
  return s;
}

export async function createGuestSessionToken(payload: GuestSessionPayload) {
  return signToken(payload, secret(), GUEST_SESSION_TTL);
}

export async function verifyGuestSessionToken(token: string): Promise<GuestSessionPayload | null> {
  const payload = await verifyToken<GuestSessionPayload & { iat: number; exp: number }>(
    token,
    secret()
  );
  if (!payload?.guestId || !payload?.eventId || !payload?.email) return null;
  return { guestId: payload.guestId, eventId: payload.eventId, email: payload.email };
}

/** Call only from a Route Handler (sets the cookie on the response). */
export async function setGuestSessionCookie(token: string) {
  cookies().set(GUEST_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: GUEST_SESSION_MAX_AGE,
  });
}

export async function clearGuestSessionCookie() {
  cookies().set(GUEST_COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

/** Read + verify the current guest session from a Server Component, Route Handler, or Server Action. */
export async function getGuestSession(): Promise<GuestSessionPayload | null> {
  const token = cookies().get(GUEST_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyGuestSessionToken(token);
}

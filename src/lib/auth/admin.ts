import 'server-only';
import { cookies } from 'next/headers';
import { signToken, verifyToken } from './jwt';
import { ADMIN_COOKIE_NAME } from './constants';

export { ADMIN_COOKIE_NAME };
const ADMIN_SESSION_TTL = '12h'; // shorter-lived than guest sessions — this is the sensitive account
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

export interface AdminSessionPayload {
  [key: string]: unknown;
  adminId: string;
  eventId: string | null;
  email: string;
  name: string;
  role: 'owner' | 'admin';
}

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error('ADMIN_SESSION_SECRET is not set.');
  return s;
}

export async function createAdminSessionToken(payload: AdminSessionPayload) {
  return signToken(payload, secret(), ADMIN_SESSION_TTL);
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSessionPayload | null> {
  const payload = await verifyToken<AdminSessionPayload & { iat: number; exp: number }>(
    token,
    secret()
  );
  if (!payload?.adminId || !payload?.email) return null;
  return {
    adminId: payload.adminId,
    eventId: payload.eventId ?? null,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };
}

export async function setAdminSessionCookie(token: string) {
  cookies().set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export async function clearAdminSessionCookie() {
  cookies().set(ADMIN_COOKIE_NAME, '', { path: '/', maxAge: 0 });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

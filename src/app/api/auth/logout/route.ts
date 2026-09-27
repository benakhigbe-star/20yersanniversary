import { NextResponse } from 'next/server';
import { clearGuestSessionCookie } from '@/lib/auth/guest';

export async function POST() {
  await clearGuestSessionCookie();
  return NextResponse.json({ ok: true });
}

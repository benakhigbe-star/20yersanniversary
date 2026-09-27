import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { normalizeEmail } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentEvent } from '@/lib/event';
import { checkRateLimit, recordLoginAttempt } from '@/lib/rate-limit';
import { createGuestSessionToken, setGuestSessionCookie } from '@/lib/auth/guest';
import { logActivity } from '@/lib/activity-log';
import type { Guest } from '@/types/db';

const NOT_FOUND_MESSAGE =
  "We couldn't find this email on the guest list. Please check the email address or contact the organiser.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const emailNormalized = normalizeEmail(parsed.data.email);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const identifier = `${emailNormalized}`;

  const rate = await checkRateLimit(identifier, 'guest');
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Please try again in ${rate.retryAfterMinutes} minutes.` },
      { status: 429 }
    );
  }

  const event = await getCurrentEvent();

  const { data: guest } = await supabaseAdmin()
    .from('guests')
    .select('*')
    .eq('event_id', event.id)
    .eq('email_normalized', emailNormalized)
    .eq('is_active', true)
    .maybeSingle();

  if (!guest) {
    await recordLoginAttempt(identifier, 'guest', false);
    await logActivity({
      eventId: event.id,
      actionType: 'login_rejected',
      message: `Login attempt for unrecognised email (${ip}).`,
      metadata: { email_normalized: emailNormalized },
    });
    return NextResponse.json({ error: NOT_FOUND_MESSAGE }, { status: 404 });
  }

  const typedGuest = guest as unknown as Guest;
  await recordLoginAttempt(identifier, 'guest', true);

  const token = await createGuestSessionToken({
    guestId: typedGuest.id,
    eventId: event.id,
    email: typedGuest.email,
  });
  await setGuestSessionCookie(token);

  const isFirstLogin = !typedGuest.last_login_at;
  await supabaseAdmin()
    .from('guests')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', typedGuest.id);

  await logActivity({
    eventId: event.id,
    guestId: typedGuest.id,
    actionType: isFirstLogin ? 'first_login' : 'login',
    message: isFirstLogin
      ? `${typedGuest.preferred_name || typedGuest.first_name} logged in for the first time.`
      : `${typedGuest.preferred_name || typedGuest.first_name} logged in.`,
  });

  return NextResponse.json({ ok: true });
}

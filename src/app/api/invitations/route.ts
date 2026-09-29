import { NextRequest, NextResponse } from 'next/server';
import { invitationSubmitSchema } from '@/lib/validation';
import { normalizeEmail } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireCurrentEvent, jsonError } from '@/lib/api-helpers';
import { checkRateLimit, recordLoginAttempt } from '@/lib/rate-limit';
import { logActivity } from '@/lib/activity-log';

/**
 * Public, unauthenticated endpoint — the one sanctioned way for someone the
 * admin doesn't yet have an email for to get on the guest list. It never
 * creates a login-capable `guests` row itself; it only queues a request an
 * admin reviews (see /api/admin/invitations/[id]/approve|reject). Rate
 * limited by IP since, unlike login, there's no known identity yet to key
 * off until the submission itself.
 */
export async function POST(req: NextRequest) {
  const parsed = invitationSubmitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? 'Please check your details and try again.');
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rate = await checkRateLimit(ip, 'invitation');
  if (!rate.allowed) {
    return jsonError(429, `Too many requests. Please try again in ${rate.retryAfterMinutes} minutes.`);
  }

  const eventResult = await requireCurrentEvent();
  if ('error' in eventResult) return eventResult.error;
  const { event } = eventResult;

  const emailNormalized = normalizeEmail(parsed.data.email);

  const { data: existingGuest } = await supabaseAdmin()
    .from('guests')
    .select('id')
    .eq('event_id', event.id)
    .eq('email_normalized', emailNormalized)
    .eq('is_active', true)
    .maybeSingle();

  if (existingGuest) {
    await recordLoginAttempt(ip, 'invitation', true);
    return NextResponse.json({
      status: 'already_guest',
      message: "You're already on the guest list! Head back and log in with this email.",
    });
  }

  const { data: existingPending } = await supabaseAdmin()
    .from('signup_requests')
    .select('id')
    .eq('event_id', event.id)
    .eq('email_normalized', emailNormalized)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingPending) {
    await recordLoginAttempt(ip, 'invitation', true);
    return NextResponse.json({
      status: 'already_pending',
      message: "You've already got a request in — the organiser will review it soon.",
    });
  }

  const { error } = await supabaseAdmin().from('signup_requests').insert({
    event_id: event.id,
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    preferred_name: parsed.data.preferred_name || null,
    email: parsed.data.email.trim(),
    email_normalized: emailNormalized,
    note: parsed.data.note || null,
  });

  if (error) {
    await recordLoginAttempt(ip, 'invitation', false);
    // A unique-constraint race with a concurrent submission looks like "already pending" to the visitor.
    if (error.code === '23505') {
      return NextResponse.json({
        status: 'already_pending',
        message: "You've already got a request in — the organiser will review it soon.",
      });
    }
    console.error('failed to save invitation request', error);
    return jsonError(500, 'Could not submit your request. Please try again.');
  }

  await recordLoginAttempt(ip, 'invitation', true);

  await logActivity({
    eventId: event.id,
    actionType: 'invitation_requested',
    message: `${parsed.data.first_name} ${parsed.data.last_name} requested to be added to the guest list.`,
    metadata: { email_normalized: emailNormalized },
  });

  return NextResponse.json({
    status: 'submitted',
    message: "Thanks! The organiser will review your request — check back and try logging in once you're approved.",
  });
}

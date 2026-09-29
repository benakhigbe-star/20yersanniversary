import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity-log';
import type { SignupRequest } from '@/types/db';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const { session } = guard;

  const { data: request } = await supabaseAdmin()
    .from('signup_requests')
    .select('*')
    .eq('id', params.id)
    .eq('status', 'pending')
    .maybeSingle();

  const typedRequest = request as unknown as SignupRequest | null;
  if (!typedRequest) return jsonError(404, 'Request not found or already reviewed.');

  // If a guest with this email already exists (e.g. added manually in the
  // meantime, or previously disabled), reuse/reactivate it rather than
  // creating a duplicate.
  const { data: existingGuest } = await supabaseAdmin()
    .from('guests')
    .select('id')
    .eq('event_id', typedRequest.event_id)
    .eq('email_normalized', typedRequest.email_normalized)
    .maybeSingle();

  let guestId: string;

  if (existingGuest) {
    guestId = (existingGuest as { id: string }).id;
    await supabaseAdmin().from('guests').update({ is_active: true }).eq('id', guestId);
  } else {
    const { data: newGuest, error } = await supabaseAdmin()
      .from('guests')
      .insert({
        event_id: typedRequest.event_id,
        first_name: typedRequest.first_name,
        last_name: typedRequest.last_name,
        preferred_name: typedRequest.preferred_name,
        email: typedRequest.email,
        email_normalized: typedRequest.email_normalized,
        status: 'invited',
        is_active: true,
        notes: typedRequest.note ? `From invitation request: ${typedRequest.note}` : null,
      })
      .select('id')
      .single();

    if (error || !newGuest) {
      console.error('failed to create guest from invitation request', error);
      return jsonError(500, 'Could not approve this request. Please try again.');
    }
    guestId = (newGuest as { id: string }).id;
  }

  await supabaseAdmin()
    .from('signup_requests')
    .update({
      status: 'approved',
      guest_id: guestId,
      reviewed_by: session.adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', typedRequest.id);

  await logActivity({
    eventId: typedRequest.event_id,
    adminId: session.adminId,
    guestId,
    actionType: 'invitation_approved',
    message: `${typedRequest.first_name} ${typedRequest.last_name}'s invitation request was approved — they can now log in.`,
  });

  return NextResponse.json({ ok: true, guestId });
}

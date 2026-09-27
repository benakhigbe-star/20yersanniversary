import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { guestInputSchema } from '@/lib/validation';
import { normalizeEmail } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity-log';

const patchSchema = guestInputSchema.partial();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid guest data.');

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.email) update.email_normalized = normalizeEmail(parsed.data.email);

  const { data: guest, error } = await supabaseAdmin()
    .from('guests')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') return jsonError(409, 'Another guest already uses this email address.');
    return jsonError(404, 'Guest not found.');
  }
  if (!guest) return jsonError(404, 'Guest not found.');

  return NextResponse.json({ guest });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;

  const { data: guest } = await supabaseAdmin().from('guests').select('event_id, first_name, last_name').eq('id', params.id).single();
  if (!guest) return jsonError(404, 'Guest not found.');

  const { error } = await supabaseAdmin().from('guests').delete().eq('id', params.id);
  if (error) return jsonError(500, error.message);

  const g = guest as unknown as { event_id: string; first_name: string; last_name: string };
  await logActivity({
    eventId: g.event_id,
    actionType: 'guest_deleted',
    message: `${g.first_name} ${g.last_name} was removed from the guest list.`,
  });

  return NextResponse.json({ ok: true });
}

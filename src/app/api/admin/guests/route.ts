import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { guestInputSchema } from '@/lib/validation';
import { normalizeEmail } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentEvent } from '@/lib/event';
import { logActivity } from '@/lib/activity-log';

export async function GET(req: NextRequest) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;

  const event = await getCurrentEvent();
  const eventId = event.id;

  const search = req.nextUrl.searchParams.get('q')?.trim();
  const status = req.nextUrl.searchParams.get('status');
  const group = req.nextUrl.searchParams.get('group');

  let query = supabaseAdmin().from('guests').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
  if (status === 'active') query = query.eq('is_active', true);
  if (status === 'inactive') query = query.eq('is_active', false);
  if (group) query = query.eq('group_name', group);
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,preferred_name.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ guests: data });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;

  const body = await req.json().catch(() => null);
  const parsed = guestInputSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid guest data.');

  const event = await getCurrentEvent();
  const eventId = event.id;
  const emailNormalized = normalizeEmail(parsed.data.email);

  const { data: existing } = await supabaseAdmin()
    .from('guests')
    .select('id')
    .eq('event_id', eventId)
    .eq('email_normalized', emailNormalized)
    .maybeSingle();
  if (existing) return jsonError(409, 'A guest with this email already exists.');

  const { data: guest, error } = await supabaseAdmin()
    .from('guests')
    .insert({ ...parsed.data, event_id: eventId, email_normalized: emailNormalized })
    .select('*')
    .single();

  if (error) return jsonError(500, error.message);

  await logActivity({
    eventId,
    actionType: 'guest_added',
    message: `${parsed.data.first_name} ${parsed.data.last_name} was added to the guest list.`,
  });

  return NextResponse.json({ guest });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { activityInputSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';

const patchSchema = activityInputSchema.partial();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid activity.');
  const update = { ...parsed.data };
  if (update.image_url === '') update.image_url = null;
  if (update.booking_link === '') update.booking_link = null;
  const { data, error } = await supabaseAdmin().from('activities').update(update).eq('id', params.id).select('*').single();
  if (error || !data) return jsonError(404, 'Activity not found.');
  return NextResponse.json({ activity: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const { error } = await supabaseAdmin().from('activities').delete().eq('id', params.id);
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ ok: true });
}

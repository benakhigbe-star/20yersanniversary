import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { announcementInputSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';

const patchSchema = announcementInputSchema.partial();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid announcement.');

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.is_published !== undefined) {
    const { data: current } = await supabaseAdmin().from('announcements').select('published_at').eq('id', params.id).single();
    const alreadyPublished = !!(current as { published_at: string | null } | null)?.published_at;
    if (parsed.data.is_published && !alreadyPublished) update.published_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin().from('announcements').update(update).eq('id', params.id).select('*').single();
  if (error || !data) return jsonError(404, 'Announcement not found.');
  return NextResponse.json({ announcement: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const { error } = await supabaseAdmin().from('announcements').delete().eq('id', params.id);
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ ok: true });
}

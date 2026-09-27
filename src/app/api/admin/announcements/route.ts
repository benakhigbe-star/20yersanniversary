import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { announcementInputSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentEvent } from '@/lib/event';
import { logActivity } from '@/lib/activity-log';

export async function GET() {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const event = await getCurrentEvent();
  const { data } = await supabaseAdmin()
    .from('announcements')
    .select('*')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false });
  return NextResponse.json({ announcements: data ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const parsed = announcementInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid announcement.');
  const event = await getCurrentEvent();
  const { data, error } = await supabaseAdmin()
    .from('announcements')
    .insert({
      ...parsed.data,
      event_id: event.id,
      created_by: guard.session.adminId,
      published_at: parsed.data.is_published ? new Date().toISOString() : null,
    })
    .select('*')
    .single();
  if (error) return jsonError(500, error.message);

  if (parsed.data.is_published) {
    await logActivity({ eventId: event.id, adminId: guard.session.adminId, actionType: 'announcement_published', message: `Announcement published: "${parsed.data.title}".` });
  }

  return NextResponse.json({ announcement: data });
}

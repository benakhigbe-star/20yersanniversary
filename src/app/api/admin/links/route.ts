import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { usefulLinkInputSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentEvent } from '@/lib/event';

export async function GET() {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const event = await getCurrentEvent();
  const { data } = await supabaseAdmin().from('useful_links').select('*').eq('event_id', event.id).order('display_order');
  return NextResponse.json({ links: data ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const parsed = usefulLinkInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid link.');
  const event = await getCurrentEvent();
  const { data, error } = await supabaseAdmin()
    .from('useful_links')
    .insert({ ...parsed.data, event_id: event.id })
    .select('*')
    .single();
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ link: data });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError, requireCurrentEvent } from '@/lib/api-helpers';
import { scheduleItemInputSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const eventResult = await requireCurrentEvent();
  if ('error' in eventResult) return eventResult.error;
  const { event } = eventResult;
  const { data } = await supabaseAdmin()
    .from('schedule_items')
    .select('*')
    .eq('event_id', event.id)
    .order('day_number')
    .order('display_order');
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const parsed = scheduleItemInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid schedule item.');
  const eventResult = await requireCurrentEvent();
  if ('error' in eventResult) return eventResult.error;
  const { event } = eventResult;
  const { data, error } = await supabaseAdmin()
    .from('schedule_items')
    .insert({ ...parsed.data, event_id: event.id })
    .select('*')
    .single();
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ item: data });
}

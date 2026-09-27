import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError, requireCurrentEvent } from '@/lib/api-helpers';
import { itineraryDayInputSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const eventResult = await requireCurrentEvent();
  if ('error' in eventResult) return eventResult.error;
  const { event } = eventResult;
  const { data } = await supabaseAdmin().from('itinerary_days').select('*').eq('event_id', event.id).order('day_number');
  return NextResponse.json({ days: data ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const parsed = itineraryDayInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid itinerary day.');
  const eventResult = await requireCurrentEvent();
  if ('error' in eventResult) return eventResult.error;
  const { event } = eventResult;
  const payload = { ...parsed.data, date: parsed.data.date || null, event_id: event.id };
  const { data, error } = await supabaseAdmin()
    .from('itinerary_days')
    .upsert(payload, { onConflict: 'event_id,day_number' })
    .select('*')
    .single();
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ day: data });
}

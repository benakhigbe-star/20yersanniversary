import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, requireCurrentEvent, jsonError } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;

  const eventResult = await requireCurrentEvent();
  if ('error' in eventResult) return eventResult.error;
  const { event } = eventResult;

  const status = req.nextUrl.searchParams.get('status'); // pending | approved | rejected | null (all)

  let query = supabaseAdmin()
    .from('signup_requests')
    .select('*')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return jsonError(500, error.message);

  return NextResponse.json({ requests: data ?? [] });
}

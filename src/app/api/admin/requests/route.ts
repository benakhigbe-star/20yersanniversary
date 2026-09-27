import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError, requireCurrentEvent } from '@/lib/api-helpers';
import { informationRequestInputSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;

  const eventResult = await requireCurrentEvent();
  if ('error' in eventResult) return eventResult.error;
  const { event } = eventResult;
  const { data: requests } = await supabaseAdmin()
    .from('information_requests')
    .select('*')
    .eq('event_id', event.id)
    .order('display_order');

  const ids = (requests ?? []).map((r) => r.id);
  const { data: options } = ids.length
    ? await supabaseAdmin().from('request_options').select('*').in('request_id', ids).order('display_order')
    : { data: [] };

  return NextResponse.json({ requests: requests ?? [], options: options ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;

  const body = await req.json().catch(() => null);
  const parsed = informationRequestInputSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid request data.');

  const eventResult = await requireCurrentEvent();
  if ('error' in eventResult) return eventResult.error;
  const { event } = eventResult;
  const { options, deadline, ...rest } = parsed.data;

  const { data: request, error } = await supabaseAdmin()
    .from('information_requests')
    .insert({ ...rest, deadline: deadline || null, event_id: event.id })
    .select('*')
    .single();

  if (error || !request) return jsonError(500, error?.message ?? 'Could not create request.');

  if (options.length > 0) {
    await supabaseAdmin()
      .from('request_options')
      .insert(options.map((o, i) => ({ ...o, request_id: (request as { id: string }).id, display_order: o.display_order ?? i })));
  }

  return NextResponse.json({ request });
}

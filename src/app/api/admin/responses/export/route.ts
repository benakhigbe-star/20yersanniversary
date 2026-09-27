import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError, requireCurrentEvent } from '@/lib/api-helpers';
import { getResponseTracking } from '@/lib/admin-data';
import { rowsToCsv } from '@/lib/csv';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;

  const requestId = req.nextUrl.searchParams.get('request_id');
  if (!requestId) return jsonError(400, 'Missing request_id.');

  const eventResult = await requireCurrentEvent();
  if ('error' in eventResult) return eventResult.error;
  const { event } = eventResult;
  const rows = await getResponseTracking(event.id, requestId);
  const { data: request } = await supabaseAdmin().from('information_requests').select('title').eq('id', requestId).single();

  const csv = rowsToCsv(
    rows.map((r) => ({
      guest: r.name,
      email: r.email,
      group: r.group ?? '',
      answer: r.answer ?? '',
      status: r.submitted ? 'Submitted' : 'Outstanding',
      submitted_at: r.submittedAt ?? '',
    }))
  );

  const title = (request as { title?: string } | null)?.title ?? 'responses';
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-responses.csv"`,
    },
  });
}

import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentEvent } from '@/lib/event';
import { guestsToCsv } from '@/lib/csv';
import type { Guest } from '@/types/db';

export async function GET() {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;

  const event = await getCurrentEvent();
  const { data } = await supabaseAdmin().from('guests').select('*').eq('event_id', event.id).order('last_name');
  const csv = guestsToCsv((data ?? []) as unknown as Guest[]);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="guests-${event.slug}.csv"`,
    },
  });
}

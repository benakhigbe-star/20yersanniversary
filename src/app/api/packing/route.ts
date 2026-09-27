import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireGuestSession, jsonError } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase/admin';

const schema = z.object({
  packing_item_id: z.string().uuid(),
  is_checked: z.boolean(),
});

export async function POST(req: NextRequest) {
  const guard = await requireGuestSession();
  if ('error' in guard) return guard.error;
  const { session } = guard;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, 'Invalid request.');

  const { data: item } = await supabaseAdmin()
    .from('packing_items')
    .select('id')
    .eq('id', parsed.data.packing_item_id)
    .eq('event_id', session.eventId)
    .maybeSingle();
  if (!item) return jsonError(404, 'Packing item not found.');

  await supabaseAdmin().from('guest_packing_status').upsert(
    {
      guest_id: session.guestId,
      packing_item_id: parsed.data.packing_item_id,
      is_checked: parsed.data.is_checked,
      checked_at: parsed.data.is_checked ? new Date().toISOString() : null,
    },
    { onConflict: 'guest_id,packing_item_id' }
  );

  return NextResponse.json({ ok: true });
}

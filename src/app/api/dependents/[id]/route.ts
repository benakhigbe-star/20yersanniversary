import { NextRequest, NextResponse } from 'next/server';
import { requireGuestSession, jsonError } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireGuestSession();
  if ('error' in guard) return guard.error;
  const { session } = guard;

  // Ownership check: a guest can only delete their OWN dependents — the
  // dependent id in the URL is client-controlled, so it must be verified
  // against the session's guestId before any write, same pattern as every
  // other guest-scoped mutation in this app.
  const { data: dependent } = await supabaseAdmin()
    .from('guest_dependents')
    .select('id')
    .eq('id', params.id)
    .eq('guest_id', session.guestId)
    .maybeSingle();

  if (!dependent) return jsonError(404, 'Family member not found.');

  const { error } = await supabaseAdmin().from('guest_dependents').delete().eq('id', params.id);
  if (error) return jsonError(500, error.message);

  return NextResponse.json({ ok: true });
}

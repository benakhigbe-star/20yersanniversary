import { NextRequest, NextResponse } from 'next/server';
import { requireGuestSession, jsonError } from '@/lib/api-helpers';
import { dependentInputSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity-log';

export async function POST(req: NextRequest) {
  const guard = await requireGuestSession();
  if ('error' in guard) return guard.error;
  const { session } = guard;

  const parsed = dependentInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid details.');

  const { data: dependent, error } = await supabaseAdmin()
    .from('guest_dependents')
    .insert({ ...parsed.data, guest_id: session.guestId })
    .select('*')
    .single();

  if (error || !dependent) return jsonError(500, 'Could not add family member. Please try again.');

  const { data: guest } = await supabaseAdmin()
    .from('guests')
    .select('first_name, preferred_name')
    .eq('id', session.guestId)
    .single();
  const name = (guest as { first_name: string; preferred_name: string | null } | null)?.preferred_name
    ? (guest as { preferred_name: string }).preferred_name
    : (guest as { first_name: string } | null)?.first_name ?? 'A guest';

  await logActivity({
    eventId: session.eventId,
    guestId: session.guestId,
    actionType: 'dependent_added',
    message: `${name} added ${parsed.data.first_name} to their family.`,
  });

  return NextResponse.json({ dependent });
}

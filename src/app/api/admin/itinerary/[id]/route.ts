import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const { error } = await supabaseAdmin().from('itinerary_days').delete().eq('id', params.id);
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ ok: true });
}

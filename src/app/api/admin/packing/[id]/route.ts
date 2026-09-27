import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { packingItemInputSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';

const patchSchema = packingItemInputSchema.partial();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid packing item.');
  const { data, error } = await supabaseAdmin().from('packing_items').update(parsed.data).eq('id', params.id).select('*').single();
  if (error || !data) return jsonError(404, 'Packing item not found.');
  return NextResponse.json({ item: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const { error } = await supabaseAdmin().from('packing_items').delete().eq('id', params.id);
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { informationRequestInputSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';

const patchSchema = informationRequestInputSchema.partial();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid request data.');

  const { options, deadline, ...rest } = parsed.data;
  const update: Record<string, unknown> = { ...rest };
  if (deadline !== undefined) update.deadline = deadline || null;

  const { data: request, error } = await supabaseAdmin()
    .from('information_requests')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error || !request) return jsonError(404, 'Request not found.');

  if (options) {
    await supabaseAdmin().from('request_options').delete().eq('request_id', params.id);
    if (options.length > 0) {
      await supabaseAdmin()
        .from('request_options')
        .insert(options.map((o, i) => ({ ...o, request_id: params.id, display_order: o.display_order ?? i })));
    }
  }

  return NextResponse.json({ request });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;

  const { error } = await supabaseAdmin().from('information_requests').delete().eq('id', params.id);
  if (error) return jsonError(500, error.message);
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { appGuideInputSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentEvent } from '@/lib/event';

export async function GET() {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const event = await getCurrentEvent();
  const { data: guide } = await supabaseAdmin().from('app_guides').select('*').eq('event_id', event.id).maybeSingle();
  if (!guide) return NextResponse.json({ guide: null, steps: [], features: [], tips: [] });

  const id = (guide as { id: string }).id;
  const [{ data: steps }, { data: features }, { data: tips }] = await Promise.all([
    supabaseAdmin().from('app_guide_steps').select('*').eq('app_guide_id', id).order('display_order'),
    supabaseAdmin().from('app_guide_features').select('*').eq('app_guide_id', id).order('display_order'),
    supabaseAdmin().from('app_guide_tips').select('*').eq('app_guide_id', id).order('display_order'),
  ]);

  return NextResponse.json({ guide, steps: steps ?? [], features: features ?? [], tips: tips ?? [] });
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const parsed = appGuideInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid app guide.');

  const event = await getCurrentEvent();
  const { steps, features, tips, ...rest } = parsed.data;

  const { data: existing } = await supabaseAdmin().from('app_guides').select('id').eq('event_id', event.id).maybeSingle();

  const payload = {
    ...rest,
    app_store_url: rest.app_store_url || null,
    google_play_url: rest.google_play_url || null,
    event_id: event.id,
    updated_at: new Date().toISOString(),
  };

  const { data: guide, error } = existing
    ? await supabaseAdmin().from('app_guides').update(payload).eq('id', (existing as { id: string }).id).select('*').single()
    : await supabaseAdmin().from('app_guides').insert(payload).select('*').single();

  if (error || !guide) return jsonError(500, error?.message ?? 'Could not save app guide.');
  const guideId = (guide as { id: string }).id;

  await Promise.all([
    supabaseAdmin().from('app_guide_steps').delete().eq('app_guide_id', guideId),
    supabaseAdmin().from('app_guide_features').delete().eq('app_guide_id', guideId),
    supabaseAdmin().from('app_guide_tips').delete().eq('app_guide_id', guideId),
  ]);

  await Promise.all([
    steps.length
      ? supabaseAdmin().from('app_guide_steps').insert(steps.map((s) => ({ ...s, image_url: s.image_url || null, app_guide_id: guideId })))
      : Promise.resolve(),
    features.length
      ? supabaseAdmin().from('app_guide_features').insert(features.map((f) => ({ ...f, app_guide_id: guideId })))
      : Promise.resolve(),
    tips.length ? supabaseAdmin().from('app_guide_tips').insert(tips.map((t) => ({ ...t, app_guide_id: guideId }))) : Promise.resolve(),
  ]);

  return NextResponse.json({ ok: true, guideId });
}

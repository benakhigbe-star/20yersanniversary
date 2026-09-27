import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession, jsonError } from '@/lib/api-helpers';
import { eventSettingsInputSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCurrentEvent, getCurrentEventSettings } from '@/lib/event';

export async function GET() {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const event = await getCurrentEvent();
  const settings = await getCurrentEventSettings(event.id);
  return NextResponse.json({ event, settings });
}

const EVENT_FIELDS = [
  'name',
  'cruise_name',
  'cruise_line',
  'ship_name',
  'departure_port',
  'departure_date',
  'departure_time',
  'return_date',
  'return_port',
  'logo_url',
  'hero_image_url',
  'welcome_message',
  'theme_color',
] as const;

const SETTINGS_FIELDS = [
  'destinations',
  'boarding_info',
  'baggage_info',
  'dress_codes',
  'important_reminders',
  'documents_info',
] as const;

export async function PUT(req: NextRequest) {
  const guard = await requireAdminSession();
  if ('error' in guard) return guard.error;
  const parsed = eventSettingsInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid settings.');

  const event = await getCurrentEvent();
  const input = parsed.data;

  const eventUpdate: Record<string, unknown> = {};
  for (const key of EVENT_FIELDS) {
    if (input[key] !== undefined) eventUpdate[key] = input[key] || null;
  }
  const settingsUpdate: Record<string, unknown> = {};
  for (const key of SETTINGS_FIELDS) {
    if (input[key] !== undefined) settingsUpdate[key] = input[key] || null;
  }

  if (Object.keys(eventUpdate).length > 0) {
    const { error } = await supabaseAdmin().from('events').update(eventUpdate).eq('id', event.id);
    if (error) return jsonError(500, error.message);
  }
  if (Object.keys(settingsUpdate).length > 0) {
    const { error } = await supabaseAdmin()
      .from('event_settings')
      .upsert({ event_id: event.id, ...settingsUpdate }, { onConflict: 'event_id' });
    if (error) return jsonError(500, error.message);
  }

  return NextResponse.json({ ok: true });
}

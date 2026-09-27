import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import type { Event, EventSettings } from '@/types/db';

/**
 * Resolves the single active event this deployment serves, by slug
 * (NEXT_PUBLIC_EVENT_SLUG). Kept as a lookup (not a hardcoded id) so a
 * future multi-event deployment only needs to change how the slug is
 * chosen per-request (e.g. by subdomain) rather than touching every query.
 */
export async function getCurrentEvent(): Promise<Event> {
  const slug = process.env.NEXT_PUBLIC_EVENT_SLUG;
  if (!slug) throw new Error('NEXT_PUBLIC_EVENT_SLUG is not set.');

  const { data, error } = await supabaseAdmin()
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error(`Event with slug "${slug}" not found. Did you run the seed script?`);
  }
  return data as unknown as Event;
}

export async function getCurrentEventSettings(eventId: string): Promise<EventSettings | null> {
  const { data } = await supabaseAdmin()
    .from('event_settings')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle();
  return (data as unknown as EventSettings) ?? null;
}

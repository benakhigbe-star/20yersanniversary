import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from './supabase/admin';
import { getGuestSession } from './auth/guest';
import { getCurrentEvent, getCurrentEventSettings } from './event';
import type {
  Guest,
  Event,
  InformationRequest,
  RequestOption,
  GuestResponse,
  GuestDependent,
  DependentResponse,
  PackingItem,
  GuestPackingStatus,
  Announcement,
  Activity,
  ScheduleItem,
  UsefulLink,
  ItineraryDay,
  AppGuide,
  AppGuideStep,
  AppGuideFeature,
  AppGuideTip,
} from '@/types/db';

/**
 * Resolves + verifies the guest for the current request, redirecting to the
 * login page if there's no valid session or the guest record has since been
 * disabled. Wrapped in React's `cache()` so layout + page + nested server
 * components sharing a request only hit the DB once.
 */
export const getGuestContext = cache(async (): Promise<{ guest: Guest; event: Event }> => {
  const session = await getGuestSession();
  if (!session) redirect('/');

  const { data: guest } = await supabaseAdmin()
    .from('guests')
    .select('*')
    .eq('id', session.guestId)
    .eq('event_id', session.eventId)
    .eq('is_active', true)
    .maybeSingle();

  if (!guest) redirect('/');

  const event = await getCurrentEvent();
  return { guest: guest as unknown as Guest, event };
});

export const getEventSettingsCached = cache(async (eventId: string) => getCurrentEventSettings(eventId));

export async function getActiveRequestsWithOptions(eventId: string) {
  const { data: requests } = await supabaseAdmin()
    .from('information_requests')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const { data: options } = await supabaseAdmin()
    .from('request_options')
    .select('*')
    .in('request_id', (requests ?? []).map((r) => r.id).length ? (requests ?? []).map((r) => r.id) : ['00000000-0000-0000-0000-000000000000'])
    .order('display_order', { ascending: true });

  const optionsByRequest = new Map<string, RequestOption[]>();
  for (const opt of (options ?? []) as unknown as RequestOption[]) {
    const list = optionsByRequest.get(opt.request_id) ?? [];
    list.push(opt);
    optionsByRequest.set(opt.request_id, list);
  }

  return {
    requests: (requests ?? []) as unknown as InformationRequest[],
    optionsByRequest,
  };
}

export async function getGuestResponses(guestId: string): Promise<GuestResponse[]> {
  const { data } = await supabaseAdmin().from('guest_responses').select('*').eq('guest_id', guestId);
  return (data ?? []) as unknown as GuestResponse[];
}

export async function getGuestResponseOptionIds(responseIds: string[]): Promise<Map<string, string[]>> {
  if (responseIds.length === 0) return new Map();
  const { data } = await supabaseAdmin()
    .from('guest_response_options')
    .select('response_id, option_id')
    .in('response_id', responseIds);

  const map = new Map<string, string[]>();
  for (const row of (data ?? []) as { response_id: string; option_id: string }[]) {
    const list = map.get(row.response_id) ?? [];
    list.push(row.option_id);
    map.set(row.response_id, list);
  }
  return map;
}

export async function getPublishedAnnouncements(eventId: string): Promise<Announcement[]> {
  const { data } = await supabaseAdmin()
    .from('announcements')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_published', true)
    .order('published_at', { ascending: false });
  return (data ?? []) as unknown as Announcement[];
}

export async function getMasterPackingList(eventId: string): Promise<PackingItem[]> {
  const { data } = await supabaseAdmin()
    .from('packing_items')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  return (data ?? []) as unknown as PackingItem[];
}

export async function getGuestPackingStatus(guestId: string): Promise<GuestPackingStatus[]> {
  const { data } = await supabaseAdmin().from('guest_packing_status').select('*').eq('guest_id', guestId);
  return (data ?? []) as unknown as GuestPackingStatus[];
}

export async function getGuestDependents(guestId: string): Promise<GuestDependent[]> {
  const { data } = await supabaseAdmin()
    .from('guest_dependents')
    .select('*')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: true });
  return (data ?? []) as unknown as GuestDependent[];
}

export async function getDependentResponses(dependentIds: string[]): Promise<DependentResponse[]> {
  if (dependentIds.length === 0) return [];
  const { data } = await supabaseAdmin().from('dependent_responses').select('*').in('dependent_id', dependentIds);
  return (data ?? []) as unknown as DependentResponse[];
}

export async function getDependentResponseOptionIds(responseIds: string[]): Promise<Map<string, string[]>> {
  if (responseIds.length === 0) return new Map();
  const { data } = await supabaseAdmin()
    .from('dependent_response_options')
    .select('response_id, option_id')
    .in('response_id', responseIds);

  const map = new Map<string, string[]>();
  for (const row of (data ?? []) as { response_id: string; option_id: string }[]) {
    const list = map.get(row.response_id) ?? [];
    list.push(row.option_id);
    map.set(row.response_id, list);
  }
  return map;
}

export async function getActivities(eventId: string): Promise<Activity[]> {
  const { data } = await supabaseAdmin()
    .from('activities')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  return (data ?? []) as unknown as Activity[];
}

export async function getScheduleItems(eventId: string): Promise<ScheduleItem[]> {
  const { data } = await supabaseAdmin()
    .from('schedule_items')
    .select('*')
    .eq('event_id', eventId)
    .order('day_number', { ascending: true })
    .order('display_order', { ascending: true });
  return (data ?? []) as unknown as ScheduleItem[];
}

export async function getUsefulLinks(eventId: string): Promise<UsefulLink[]> {
  const { data } = await supabaseAdmin()
    .from('useful_links')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  return (data ?? []) as unknown as UsefulLink[];
}

export async function getItineraryDays(eventId: string): Promise<ItineraryDay[]> {
  const { data } = await supabaseAdmin()
    .from('itinerary_days')
    .select('*')
    .eq('event_id', eventId)
    .order('day_number', { ascending: true });
  return (data ?? []) as unknown as ItineraryDay[];
}

export async function getAppGuide(
  eventId: string
): Promise<{ guide: AppGuide; steps: AppGuideStep[]; features: AppGuideFeature[]; tips: AppGuideTip[] } | null> {
  const { data: guide } = await supabaseAdmin()
    .from('app_guides')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle();
  if (!guide) return null;

  const typedGuide = guide as unknown as AppGuide;
  const [{ data: steps }, { data: features }, { data: tips }] = await Promise.all([
    supabaseAdmin().from('app_guide_steps').select('*').eq('app_guide_id', typedGuide.id).order('display_order'),
    supabaseAdmin().from('app_guide_features').select('*').eq('app_guide_id', typedGuide.id).order('display_order'),
    supabaseAdmin().from('app_guide_tips').select('*').eq('app_guide_id', typedGuide.id).order('display_order'),
  ]);

  return {
    guide: typedGuide,
    steps: (steps ?? []) as unknown as AppGuideStep[],
    features: (features ?? []) as unknown as AppGuideFeature[],
    tips: (tips ?? []) as unknown as AppGuideTip[],
  };
}

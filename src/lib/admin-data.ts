import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from './supabase/admin';
import { getAdminSession, type AdminSessionPayload } from './auth/admin';
import { getCurrentEvent } from './event';
import type { Event, Guest, InformationRequest, GuestResponse, ActivityLogEntry } from '@/types/db';

export const getAdminContext = cache(async (): Promise<{ admin: AdminSessionPayload; event: Event }> => {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');
  const event = await getCurrentEvent();
  return { admin, event };
});

export interface DashboardStats {
  totalGuests: number;
  profileComplete: number;
  outstandingActions: number;
  requestStats: Array<{ request: InformationRequest; submitted: number; total: number }>;
}

export async function getDashboardStats(eventId: string): Promise<DashboardStats> {
  const { data: guests } = await supabaseAdmin().from('guests').select('*').eq('event_id', eventId).eq('is_active', true);
  const typedGuests = (guests ?? []) as unknown as Guest[];

  const { data: requests } = await supabaseAdmin()
    .from('information_requests')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .order('display_order');
  const typedRequests = (requests ?? []) as unknown as InformationRequest[];
  const requiredRequests = typedRequests.filter((r) => r.is_required);

  const { data: responses } = await supabaseAdmin().from('guest_responses').select('*').eq('event_id', eventId);
  const typedResponses = (responses ?? []) as unknown as GuestResponse[];

  const responsesByRequest = new Map<string, Set<string>>();
  for (const r of typedResponses) {
    const set = responsesByRequest.get(r.request_id) ?? new Set<string>();
    set.add(r.guest_id);
    responsesByRequest.set(r.request_id, set);
  }

  let profileComplete = 0;
  let outstandingActions = 0;
  for (const guest of typedGuests) {
    const answered = requiredRequests.filter((r) => responsesByRequest.get(r.id)?.has(guest.id)).length;
    if (requiredRequests.length === 0 || answered === requiredRequests.length) profileComplete++;
    outstandingActions += requiredRequests.length - answered;
  }

  const requestStats = typedRequests.map((request) => ({
    request,
    submitted: responsesByRequest.get(request.id)?.size ?? 0,
    total: typedGuests.length,
  }));

  return { totalGuests: typedGuests.length, profileComplete, outstandingActions, requestStats };
}

export interface TrackingRow {
  guestId: string;
  name: string;
  email: string;
  group: string | null;
  answer: string | null;
  submitted: boolean;
  submittedAt: string | null;
}

export async function getResponseTracking(eventId: string, requestId: string): Promise<TrackingRow[]> {
  const [{ data: guests }, { data: request }, { data: options }, { data: responses }] = await Promise.all([
    supabaseAdmin().from('guests').select('*').eq('event_id', eventId).eq('is_active', true),
    supabaseAdmin().from('information_requests').select('*').eq('id', requestId).single(),
    supabaseAdmin().from('request_options').select('*').eq('request_id', requestId),
    supabaseAdmin().from('guest_responses').select('*').eq('request_id', requestId),
  ]);

  const typedGuests = (guests ?? []) as unknown as Guest[];
  const typedOptions = (options ?? []) as unknown as { id: string; label: string }[];
  const typedResponses = (responses ?? []) as unknown as GuestResponse[];
  void request;

  const responseByGuest = new Map(typedResponses.map((r) => [r.guest_id, r]));
  const optionLabel = new Map(typedOptions.map((o) => [o.id, o.label]));

  const { data: multiSelect } = await supabaseAdmin()
    .from('guest_response_options')
    .select('response_id, option_id')
    .in('response_id', typedResponses.map((r) => r.id).length ? typedResponses.map((r) => r.id) : ['00000000-0000-0000-0000-000000000000']);
  const multiByResponse = new Map<string, string[]>();
  for (const row of (multiSelect ?? []) as { response_id: string; option_id: string }[]) {
    const list = multiByResponse.get(row.response_id) ?? [];
    list.push(row.option_id);
    multiByResponse.set(row.response_id, list);
  }

  return typedGuests
    .sort((a, b) => a.first_name.localeCompare(b.first_name))
    .map((guest) => {
      const response = responseByGuest.get(guest.id);
      let answer: string | null = null;
      if (response) {
        const multiIds = multiByResponse.get(response.id);
        if (multiIds?.length) answer = multiIds.map((id) => optionLabel.get(id)).filter(Boolean).join(', ');
        else if (response.selected_option_id) answer = optionLabel.get(response.selected_option_id) ?? response.answer_text;
        else answer = response.answer_text;
      }
      return {
        guestId: guest.id,
        name: `${guest.preferred_name || guest.first_name} ${guest.last_name}`,
        email: guest.email,
        group: guest.group_name,
        answer,
        submitted: !!response,
        submittedAt: response?.submitted_at ?? null,
      };
    });
}

export async function getRecentActivity(eventId: string, limit = 15): Promise<ActivityLogEntry[]> {
  const { data } = await supabaseAdmin()
    .from('activity_log')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as ActivityLogEntry[];
}

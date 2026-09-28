import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from './supabase/admin';
import { getAdminSession, type AdminSessionPayload } from './auth/admin';
import { getCurrentEvent } from './event';
import type { Event, Guest, InformationRequest, GuestResponse, GuestDependent, DependentResponse, ActivityLogEntry } from '@/types/db';

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

  // Dependents (kids/teens) count toward each request's submitted/total too,
  // so these numbers match what the Responses tracking page shows.
  const guestIds = typedGuests.map((g) => g.id);
  const { data: dependents } = guestIds.length
    ? await supabaseAdmin().from('guest_dependents').select('id').in('guest_id', guestIds)
    : { data: [] };
  const dependentIds = ((dependents ?? []) as { id: string }[]).map((d) => d.id);

  const dependentResponsesByRequest = new Map<string, Set<string>>();
  if (dependentIds.length > 0) {
    const { data: depResponses } = await supabaseAdmin()
      .from('dependent_responses')
      .select('request_id, dependent_id')
      .eq('event_id', eventId);
    for (const r of (depResponses ?? []) as { request_id: string; dependent_id: string }[]) {
      const set = dependentResponsesByRequest.get(r.request_id) ?? new Set<string>();
      set.add(r.dependent_id);
      dependentResponsesByRequest.set(r.request_id, set);
    }
  }

  const requestStats = typedRequests.map((request) => ({
    request,
    submitted: (responsesByRequest.get(request.id)?.size ?? 0) + (dependentResponsesByRequest.get(request.id)?.size ?? 0),
    total: typedGuests.length + dependentIds.length,
  }));

  return { totalGuests: typedGuests.length, profileComplete, outstandingActions, requestStats };
}

export interface TrackingRow {
  /** Unique per row — a guest's own id, or a dependent's id. Use this for React keys. */
  rowId: string;
  guestId: string;
  name: string;
  email: string;
  group: string | null;
  answer: string | null;
  submitted: boolean;
  submittedAt: string | null;
  isDependent: boolean;
}

export async function getResponseTracking(eventId: string, requestId: string): Promise<TrackingRow[]> {
  const [{ data: guests }, { data: options }, { data: responses }] = await Promise.all([
    supabaseAdmin().from('guests').select('*').eq('event_id', eventId).eq('is_active', true),
    supabaseAdmin().from('request_options').select('*').eq('request_id', requestId),
    supabaseAdmin().from('guest_responses').select('*').eq('request_id', requestId),
  ]);

  const typedGuests = (guests ?? []) as unknown as Guest[];
  const typedOptions = (options ?? []) as unknown as { id: string; label: string }[];
  const typedResponses = (responses ?? []) as unknown as GuestResponse[];

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

  function resolveAnswer(response: { id: string; selected_option_id: string | null; answer_text: string | null } | undefined) {
    if (!response) return null;
    const multiIds = multiByResponse.get(response.id);
    if (multiIds?.length) return multiIds.map((id) => optionLabel.get(id)).filter(Boolean).join(', ');
    if (response.selected_option_id) return optionLabel.get(response.selected_option_id) ?? response.answer_text;
    return response.answer_text;
  }

  const guestRows: TrackingRow[] = typedGuests.map((guest) => {
    const response = responseByGuest.get(guest.id);
    return {
      rowId: guest.id,
      guestId: guest.id,
      name: `${guest.preferred_name || guest.first_name} ${guest.last_name}`,
      email: guest.email,
      group: guest.group_name,
      answer: resolveAnswer(response),
      submitted: !!response,
      submittedAt: response?.submitted_at ?? null,
      isDependent: false,
    };
  });

  // --- Dependents (children/teens answering under their guardian's login) ---
  const guestIds = typedGuests.map((g) => g.id);
  const { data: dependents } = guestIds.length
    ? await supabaseAdmin().from('guest_dependents').select('*').in('guest_id', guestIds)
    : { data: [] };
  const typedDependents = (dependents ?? []) as unknown as GuestDependent[];
  const guestById = new Map(typedGuests.map((g) => [g.id, g]));

  let dependentRows: TrackingRow[] = [];
  if (typedDependents.length > 0) {
    const dependentIds = typedDependents.map((d) => d.id);
    const { data: depResponses } = await supabaseAdmin()
      .from('dependent_responses')
      .select('*')
      .eq('request_id', requestId)
      .in('dependent_id', dependentIds);
    const typedDepResponses = (depResponses ?? []) as unknown as DependentResponse[];
    const depResponseByDependent = new Map(typedDepResponses.map((r) => [r.dependent_id, r]));

    const { data: depMultiSelect } = await supabaseAdmin()
      .from('dependent_response_options')
      .select('response_id, option_id')
      .in(
        'response_id',
        typedDepResponses.map((r) => r.id).length ? typedDepResponses.map((r) => r.id) : ['00000000-0000-0000-0000-000000000000']
      );
    const depMultiByResponse = new Map<string, string[]>();
    for (const row of (depMultiSelect ?? []) as { response_id: string; option_id: string }[]) {
      const list = depMultiByResponse.get(row.response_id) ?? [];
      list.push(row.option_id);
      depMultiByResponse.set(row.response_id, list);
    }

    dependentRows = typedDependents.map((dep) => {
      const response = depResponseByDependent.get(dep.id);
      const guardian = guestById.get(dep.guest_id);
      let answer: string | null = null;
      if (response) {
        const multiIds = depMultiByResponse.get(response.id);
        if (multiIds?.length) answer = multiIds.map((id) => optionLabel.get(id)).filter(Boolean).join(', ');
        else if (response.selected_option_id) answer = optionLabel.get(response.selected_option_id) ?? response.answer_text;
        else answer = response.answer_text;
      }
      return {
        rowId: dep.id,
        guestId: dep.guest_id,
        name: `${dep.first_name} ${dep.last_name ?? ''} (${dep.age_category} of ${guardian?.first_name ?? 'guest'})`.trim(),
        email: guardian?.email ?? '',
        group: guardian?.group_name ?? null,
        answer,
        submitted: !!response,
        submittedAt: response?.submitted_at ?? null,
        isDependent: true,
      };
    });
  }

  return [...guestRows, ...dependentRows].sort((a, b) => a.name.localeCompare(b.name));
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

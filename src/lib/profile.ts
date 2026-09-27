import type { InformationRequest, GuestResponse } from '@/types/db';

export interface RequestWithStatus {
  request: InformationRequest;
  response: GuestResponse | null;
  isOutstanding: boolean;
  isOverdue: boolean;
}

/**
 * Profile completion is based on REQUIRED, active information requests
 * only — optional questions (e.g. "which excursion interests you") don't
 * block the guest's progress bar, but do still show up as an action card.
 */
export function buildRequestStatuses(
  requests: InformationRequest[],
  responses: GuestResponse[]
): RequestWithStatus[] {
  const responseByRequest = new Map(responses.map((r) => [r.request_id, r]));
  const now = Date.now();

  return requests
    .filter((r) => r.is_active)
    .sort((a, b) => a.display_order - b.display_order)
    .map((request) => {
      const response = responseByRequest.get(request.id) ?? null;
      const isOutstanding = request.is_required && !response;
      const isOverdue = !!request.deadline && new Date(request.deadline).getTime() < now && isOutstanding;
      return { request, response, isOutstanding, isOverdue };
    });
}

export function computeProfileCompletion(statuses: RequestWithStatus[]): number {
  const required = statuses.filter((s) => s.request.is_required);
  if (required.length === 0) return 100;
  const done = required.filter((s) => s.response !== null).length;
  return Math.round((done / required.length) * 100);
}

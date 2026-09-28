import { NextRequest, NextResponse } from 'next/server';
import { requireGuestSession, jsonError } from '@/lib/api-helpers';
import { dependentResponseSubmitSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity-log';
import type { InformationRequest, RequestOption, GuestDependent } from '@/types/db';

export async function POST(req: NextRequest) {
  const guard = await requireGuestSession();
  if ('error' in guard) return guard.error;
  const { session } = guard;

  const parsed = dependentResponseSubmitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid submission.');
  }
  const input = parsed.data;

  // Ownership check: the dependent must belong to THIS guest's session,
  // never trust the client-supplied dependent_id on its own.
  const { data: dependent } = await supabaseAdmin()
    .from('guest_dependents')
    .select('*')
    .eq('id', input.dependent_id)
    .eq('guest_id', session.guestId)
    .maybeSingle();
  const typedDependent = dependent as unknown as GuestDependent | null;
  if (!typedDependent) return jsonError(404, 'Family member not found.');

  const { data: request } = await supabaseAdmin()
    .from('information_requests')
    .select('*')
    .eq('id', input.request_id)
    .eq('event_id', session.eventId)
    .eq('is_active', true)
    .maybeSingle();

  const typedRequest = request as unknown as InformationRequest | null;
  if (!typedRequest) return jsonError(404, 'This request is no longer available.');

  const { data: existing } = await supabaseAdmin()
    .from('dependent_responses')
    .select('id')
    .eq('request_id', typedRequest.id)
    .eq('dependent_id', typedDependent.id)
    .maybeSingle();

  if (existing && !typedRequest.allow_edit_after_submit) {
    return jsonError(403, 'This answer can no longer be changed.');
  }

  const isMultiSelect = typedRequest.question_type === 'checkboxes' || typedRequest.question_type === 'multiple_choice';
  const isSingleOption = typedRequest.question_type === 'dropdown' || typedRequest.question_type === 'radio';

  let optionIds: string[] = [];
  if (isMultiSelect) {
    optionIds = input.selected_option_ids ?? [];
  } else if (isSingleOption && input.selected_option_id) {
    optionIds = [input.selected_option_id];
  }

  if (optionIds.length > 0) {
    const { data: validOptions } = await supabaseAdmin()
      .from('request_options')
      .select('id')
      .eq('request_id', typedRequest.id)
      .in('id', optionIds);
    const validIds = new Set(((validOptions ?? []) as unknown as RequestOption[]).map((o) => o.id));
    if (optionIds.some((id) => !validIds.has(id))) {
      return jsonError(400, 'One or more selected options are invalid.');
    }
  }

  const hasAnswer = isMultiSelect
    ? optionIds.length > 0
    : isSingleOption
      ? !!input.selected_option_id
      : !!input.answer_text?.trim();

  if (typedRequest.is_required && !hasAnswer) {
    return jsonError(400, 'This field is required.');
  }

  const payload = {
    event_id: session.eventId,
    request_id: typedRequest.id,
    dependent_id: typedDependent.id,
    answer_text: isMultiSelect || isSingleOption ? null : input.answer_text?.trim() || null,
    selected_option_id: isSingleOption ? input.selected_option_id ?? null : null,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await supabaseAdmin()
    .from('dependent_responses')
    .upsert(payload, { onConflict: 'request_id,dependent_id' })
    .select('id')
    .single();

  if (error || !saved) {
    console.error('failed to save dependent response', error);
    return jsonError(500, 'Could not save this answer. Please try again.');
  }

  const responseId = (saved as { id: string }).id;

  if (isMultiSelect) {
    await supabaseAdmin().from('dependent_response_options').delete().eq('response_id', responseId);
    if (optionIds.length > 0) {
      await supabaseAdmin()
        .from('dependent_response_options')
        .insert(optionIds.map((option_id) => ({ response_id: responseId, option_id })));
    }
  }

  await logActivity({
    eventId: session.eventId,
    guestId: session.guestId,
    actionType: existing ? 'dependent_response_updated' : 'dependent_response_submitted',
    message: `${existing ? 'Updated' : 'Submitted'} ${typedDependent.first_name}'s ${typedRequest.title.toLowerCase()}.`,
    metadata: { request_id: typedRequest.id, dependent_id: typedDependent.id },
  });

  return NextResponse.json({ ok: true });
}

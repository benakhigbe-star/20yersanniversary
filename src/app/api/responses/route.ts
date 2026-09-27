import { NextRequest, NextResponse } from 'next/server';
import { requireGuestSession, jsonError } from '@/lib/api-helpers';
import { responseSubmitSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity-log';
import type { InformationRequest, RequestOption, Guest } from '@/types/db';

export async function POST(req: NextRequest) {
  const guard = await requireGuestSession();
  if ('error' in guard) return guard.error;
  const { session } = guard;

  const body = await req.json().catch(() => null);
  const parsed = responseSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? 'Invalid submission.');
  }
  const input = parsed.data;

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
    .from('guest_responses')
    .select('id')
    .eq('request_id', typedRequest.id)
    .eq('guest_id', session.guestId)
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
    guest_id: session.guestId,
    answer_text: isMultiSelect || isSingleOption ? null : input.answer_text?.trim() || null,
    selected_option_id: isSingleOption ? input.selected_option_id ?? null : null,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await supabaseAdmin()
    .from('guest_responses')
    .upsert(payload, { onConflict: 'request_id,guest_id' })
    .select('id')
    .single();

  if (error || !saved) {
    console.error('failed to save response', error);
    return jsonError(500, 'Could not save your answer. Please try again.');
  }

  const responseId = (saved as { id: string }).id;

  if (isMultiSelect) {
    await supabaseAdmin().from('guest_response_options').delete().eq('response_id', responseId);
    if (optionIds.length > 0) {
      await supabaseAdmin()
        .from('guest_response_options')
        .insert(optionIds.map((option_id) => ({ response_id: responseId, option_id })));
    }
  }

  const { data: guest } = await supabaseAdmin()
    .from('guests')
    .select('first_name, preferred_name')
    .eq('id', session.guestId)
    .single();
  const typedGuest = guest as unknown as Pick<Guest, 'first_name' | 'preferred_name'> | null;
  const name = typedGuest?.preferred_name || typedGuest?.first_name || 'A guest';

  await logActivity({
    eventId: session.eventId,
    guestId: session.guestId,
    actionType: existing ? 'response_updated' : 'response_submitted',
    message: `${name} ${existing ? 'updated their' : 'submitted their'} ${typedRequest.title.toLowerCase()}.`,
    metadata: { request_id: typedRequest.id },
  });

  return NextResponse.json({ ok: true });
}

import type { InformationRequest, RequestOption, GuestResponse } from '@/types/db';

const DEFAULT_ICONS: Record<InformationRequest['question_type'], string> = {
  short_text: '📝',
  long_text: '📝',
  number: '🔢',
  dropdown: '📋',
  radio: '🔘',
  checkboxes: '☑️',
  yes_no: '❓',
  date: '📅',
  multiple_choice: '🗳️',
};

export function requestIcon(request: InformationRequest): string {
  return request.icon || DEFAULT_ICONS[request.question_type] || '📌';
}

export function answerSummary(
  request: InformationRequest,
  response: GuestResponse | null,
  options: RequestOption[],
  selectedOptionIds: string[]
): string | null {
  if (!response) return null;

  if (request.question_type === 'checkboxes' || request.question_type === 'multiple_choice') {
    const labels = options.filter((o) => selectedOptionIds.includes(o.id)).map((o) => o.label);
    return labels.length ? labels.join(', ') : response.answer_text;
  }

  if (response.selected_option_id) {
    const opt = options.find((o) => o.id === response.selected_option_id);
    return opt?.label ?? response.answer_text;
  }

  if (request.question_type === 'yes_no') {
    return response.answer_text === 'true' ? 'Yes' : response.answer_text === 'false' ? 'No' : response.answer_text;
  }

  return response.answer_text;
}

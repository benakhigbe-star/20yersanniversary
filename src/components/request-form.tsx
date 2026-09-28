'use client';

import { useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { requestIcon, answerSummary, type AnswerLike } from '@/lib/request-display';
import type { InformationRequest, RequestOption } from '@/types/db';

type ResponseLike = AnswerLike & { id: string; submitted_at: string; updated_at: string };

interface Props {
  request: InformationRequest;
  options: RequestOption[];
  initialResponse: ResponseLike | null;
  initialSelectedOptionIds: string[];
  /** When set, this form answers on behalf of a dependent (child/teen)
   * rather than the logged-in guest — posts to a different endpoint. */
  dependentId?: string;
}

export function RequestForm({ request, options, initialResponse, initialSelectedOptionIds, dependentId }: Props) {
  const [response, setResponse] = useState(initialResponse);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(initialSelectedOptionIds);
  const [text, setText] = useState(initialResponse?.answer_text ?? '');
  const [singleOption, setSingleOption] = useState(initialResponse?.selected_option_id ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const locked = !!response && !request.allow_edit_after_submit;
  const isMultiSelect = request.question_type === 'checkboxes' || request.question_type === 'multiple_choice';
  const isSingleOption = request.question_type === 'dropdown' || request.question_type === 'radio';
  const sizingSystem = typeof request.config?.sizing_system === 'string' ? (request.config.sizing_system as string) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setError(null);

    const body: Record<string, unknown> = { request_id: request.id };
    if (dependentId) body.dependent_id = dependentId;
    if (isMultiSelect) body.selected_option_ids = selectedOptionIds;
    else if (isSingleOption) body.selected_option_id = singleOption || null;
    else body.answer_text = text;

    try {
      const res = await fetch(dependentId ? '/api/dependent-responses' : '/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setError(data.error ?? 'Could not save. Please try again.');
        return;
      }
      setStatus('idle');
      setResponse({
        id: response?.id ?? 'saved',
        answer_text: isMultiSelect || isSingleOption ? null : text,
        selected_option_id: isSingleOption ? singleOption : null,
        submitted_at: response?.submitted_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch {
      setStatus('error');
      setError('Network error — please try again.');
    }
  }

  const deadlinePassed = !!request.deadline && new Date(request.deadline).getTime() < Date.now();

  return (
    <div className="glass-card rounded-xl2 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
          {requestIcon(request)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white">{request.title}</p>
            {request.is_required && (
              <span className="rounded-full bg-sunset-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-sunset-200">
                Required
              </span>
            )}
          </div>
          {request.description && <p className="mt-0.5 text-sm text-white/60">{request.description}</p>}
          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-white/40">
            {sizingSystem && <span className="rounded bg-white/10 px-1.5 py-0.5">{sizingSystem} sizing</span>}
            {request.deadline && (
              <span className={cn(deadlinePassed && !response && 'text-sunset-300')}>
                Deadline: {formatDate(request.deadline)}
              </span>
            )}
          </div>
        </div>
      </div>

      {locked ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 p-3 text-sm text-white/70">
          <Lock size={15} />
          <span>
            Locked in: <strong className="text-white">{answerSummary(request, response, options, selectedOptionIds)}</strong>
          </span>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <FieldInput
            request={request}
            options={options}
            text={text}
            setText={setText}
            singleOption={singleOption}
            setSingleOption={setSingleOption}
            selectedOptionIds={selectedOptionIds}
            setSelectedOptionIds={setSelectedOptionIds}
          />

          {error && <p className="text-sm text-sunset-300">{error}</p>}

          <button
            type="submit"
            disabled={status === 'saving'}
            className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-500 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {response ? <CheckCircle2 size={16} /> : null}
            {status === 'saving' ? 'Saving…' : response ? 'Update Answer' : 'Submit'}
          </button>
        </form>
      )}
    </div>
  );
}

function FieldInput({
  request,
  options,
  text,
  setText,
  singleOption,
  setSingleOption,
  selectedOptionIds,
  setSelectedOptionIds,
}: {
  request: InformationRequest;
  options: RequestOption[];
  text: string;
  setText: (v: string) => void;
  singleOption: string;
  setSingleOption: (v: string) => void;
  selectedOptionIds: string[];
  setSelectedOptionIds: (v: string[]) => void;
}) {
  const inputClass =
    'tap-target w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-ocean-300';

  switch (request.question_type) {
    case 'short_text':
      return (
        <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your answer" />
      );
    case 'long_text':
      return (
        <textarea
          className={cn(inputClass, 'min-h-[100px] resize-y')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your answer"
        />
      );
    case 'number':
      return (
        <input
          type="number"
          className={inputClass}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="0"
        />
      );
    case 'date':
      return <input type="date" className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />;
    case 'yes_no':
      return (
        <div className="grid grid-cols-2 gap-2">
          {(['true', 'false'] as const).map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => setText(v)}
              className={cn(
                'tap-target rounded-xl border py-2.5 font-medium transition',
                text === v ? 'border-ocean-400 bg-ocean-500/30 text-white' : 'border-white/15 bg-white/5 text-white/70'
              )}
            >
              {v === 'true' ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      );
    case 'dropdown':
      return (
        <select className={inputClass} value={singleOption} onChange={(e) => setSingleOption(e.target.value)}>
          <option value="" className="bg-midnight-900">
            Select…
          </option>
          {options.map((o) => (
            <option key={o.id} value={o.id} className="bg-midnight-900">
              {o.label}
            </option>
          ))}
        </select>
      );
    case 'radio':
      return (
        <div className="grid grid-cols-2 gap-2">
          {options.map((o) => (
            <button
              type="button"
              key={o.id}
              onClick={() => setSingleOption(o.id)}
              className={cn(
                'tap-target rounded-xl border py-2.5 text-sm font-medium transition',
                singleOption === o.id
                  ? 'border-ocean-400 bg-ocean-500/30 text-white'
                  : 'border-white/15 bg-white/5 text-white/70'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      );
    case 'checkboxes':
    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {options.map((o) => {
            const checked = selectedOptionIds.includes(o.id);
            return (
              <label
                key={o.id}
                className={cn(
                  'tap-target flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition',
                  checked ? 'border-ocean-400 bg-ocean-500/20 text-white' : 'border-white/15 bg-white/5 text-white/70'
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-ocean-500"
                  checked={checked}
                  onChange={() =>
                    setSelectedOptionIds(
                      checked ? selectedOptionIds.filter((id) => id !== o.id) : [...selectedOptionIds, o.id]
                    )
                  }
                />
                {o.label}
              </label>
            );
          })}
        </div>
      );
    default:
      return null;
  }
}

'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { InformationRequest, QuestionType, RequestOption } from '@/types/db';

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkboxes', label: 'Checkboxes' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'date', label: 'Date' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
];

const NEEDS_OPTIONS: QuestionType[] = ['dropdown', 'radio', 'checkboxes', 'multiple_choice'];

interface OptionDraft {
  id?: string;
  label: string;
  value: string;
}

export interface RequestFormValues {
  title: string;
  description: string;
  question_type: QuestionType;
  is_required: boolean;
  deadline: string;
  display_order: number;
  is_active: boolean;
  allow_edit_after_submit: boolean;
  icon: string;
  sizing_system: string;
  category: string;
  options: OptionDraft[];
}

function toDraftOptions(options: RequestOption[]): OptionDraft[] {
  return options.map((o) => ({ id: o.id, label: o.label, value: o.value }));
}

export function RequestFormModal({
  request,
  options,
  onClose,
  onSave,
}: {
  request: InformationRequest | null;
  options: RequestOption[];
  onClose: () => void;
  onSave: (values: RequestFormValues) => Promise<string | null>;
}) {
  const [values, setValues] = useState<RequestFormValues>(
    request
      ? {
          title: request.title,
          description: request.description ?? '',
          question_type: request.question_type,
          is_required: request.is_required,
          deadline: request.deadline ? request.deadline.slice(0, 10) : '',
          display_order: request.display_order,
          is_active: request.is_active,
          allow_edit_after_submit: request.allow_edit_after_submit,
          icon: request.icon ?? '',
          sizing_system: typeof request.config?.sizing_system === 'string' ? (request.config.sizing_system as string) : '',
          category: typeof request.config?.category === 'string' ? (request.config.category as string) : '',
          options: toDraftOptions(options),
        }
      : {
          title: '',
          description: '',
          question_type: 'short_text',
          is_required: false,
          deadline: '',
          display_order: 0,
          is_active: true,
          allow_edit_after_submit: true,
          icon: '',
          sizing_system: '',
          category: '',
          options: [],
        }
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof RequestFormValues>(key: K, value: RequestFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const needsOptions = NEEDS_OPTIONS.includes(values.question_type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const err = await onSave(values);
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-slate-900 p-6 sm:rounded-2xl"
      >
        <h2 className="text-lg font-bold text-white">{request ? 'Edit Information Request' : 'New Information Request'}</h2>

        <div className="mt-4 space-y-3">
          <LabeledInput label="Title" value={values.title} onChange={(v) => set('title', v)} required />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Description</label>
            <textarea
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Question Type</label>
              <select
                value={values.question_type}
                onChange={(e) => set('question_type', e.target.value as QuestionType)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <LabeledInput label="Icon (emoji)" value={values.icon} onChange={(v) => set('icon', v)} />
            <LabeledInput label="Deadline" type="date" value={values.deadline} onChange={(v) => set('deadline', v)} />
            <LabeledInput
              label="Display Order"
              type="number"
              value={String(values.display_order)}
              onChange={(v) => set('display_order', Number(v) || 0)}
            />
            <LabeledInput
              label="Category tag (optional, e.g. clothing)"
              value={values.category}
              onChange={(v) => set('category', v)}
            />
            <LabeledInput
              label="Sizing system (optional, e.g. UK/EU/US)"
              value={values.sizing_system}
              onChange={(v) => set('sizing_system', v)}
            />
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <Toggle label="Required" checked={values.is_required} onChange={(v) => set('is_required', v)} />
            <Toggle label="Active" checked={values.is_active} onChange={(v) => set('is_active', v)} />
            <Toggle
              label="Guests can edit after submitting"
              checked={values.allow_edit_after_submit}
              onChange={(v) => set('allow_edit_after_submit', v)}
            />
          </div>

          {needsOptions && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-400">Options</label>
                <button
                  type="button"
                  onClick={() => set('options', [...values.options, { label: '', value: '' }])}
                  className="flex items-center gap-1 text-xs font-medium text-ocean-400"
                >
                  <Plus size={13} /> Add option
                </button>
              </div>
              <div className="space-y-2">
                {values.options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      value={opt.label}
                      placeholder="Label (e.g. XL)"
                      onChange={(e) => {
                        const next = [...values.options];
                        next[idx] = { ...opt, label: e.target.value, value: opt.value || e.target.value };
                        set('options', next);
                      }}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                    />
                    <button
                      type="button"
                      onClick={() => set('options', values.options.filter((_, i) => i !== idx))}
                      className="rounded-lg border border-slate-700 px-2 text-slate-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {values.options.length === 0 && <p className="text-xs text-slate-500">No options yet — add at least one.</p>}
              </div>
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-ocean-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-ocean-400"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-ocean-500" />
      {label}
    </label>
  );
}

'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Baby } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequestForm } from './request-form';
import type { InformationRequest, RequestOption, GuestDependent } from '@/types/db';

type ResponseLike = { id: string; answer_text: string | null; selected_option_id: string | null; submitted_at: string; updated_at: string };

interface Props {
  initialDependents: GuestDependent[];
  requests: InformationRequest[];
  optionsByRequestEntries: [string, RequestOption[]][];
  /** dependentId -> requestId -> { response, selectedOptionIds } */
  initialByDependent: Record<string, Record<string, { response: ResponseLike | null; selectedOptionIds: string[] }>>;
}

export function DependentsManager({ initialDependents, requests, optionsByRequestEntries, initialByDependent }: Props) {
  const [dependents, setDependents] = useState(initialDependents);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [ageCategory, setAgeCategory] = useState<'child' | 'teen'>('child');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optionsByRequest = new Map(optionsByRequestEntries);
  const sortedRequests = [...requests].sort((a, b) => a.display_order - b.display_order);

  async function addDependent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/dependents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName || null, age_category: ageCategory }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not add family member.');
        setSaving(false);
        return;
      }
      setDependents((d) => [...d, data.dependent]);
      setFirstName('');
      setLastName('');
      setAgeCategory('child');
      setAdding(false);
      setExpandedId(data.dependent.id);
    } catch {
      setError('Network error — please try again.');
    }
    setSaving(false);
  }

  async function removeDependent(id: string) {
    if (!confirm('Remove this family member? Their saved answers will be deleted too.')) return;
    setDependents((d) => d.filter((dep) => dep.id !== id));
    await fetch(`/api/dependents/${id}`, { method: 'DELETE' });
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <Baby size={18} />
          Kids & Teens
        </h2>
        <button onClick={() => setAdding((a) => !a)} className="text-xs font-medium text-ocean-300">
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>
      <p className="mb-3 text-xs text-white/50">
        No email needed for them — answer their sizes and info here, under your own login.
      </p>

      {adding && (
        <form onSubmit={addDependent} className="glass-card mb-3 space-y-2.5 rounded-xl2 p-4">
          <div className="flex gap-2">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
              className="flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-white placeholder-white/40 outline-none focus:border-white/30"
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name (optional)"
              className="flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-white placeholder-white/40 outline-none focus:border-white/30"
            />
          </div>
          <div className="flex gap-2">
            {(['child', 'teen'] as const).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setAgeCategory(c)}
                className={cn(
                  'flex-1 rounded-xl border py-2 text-sm font-medium capitalize transition',
                  ageCategory === c ? 'border-ocean-400 bg-ocean-500/30 text-white' : 'border-white/15 bg-white/5 text-white/70'
                )}
              >
                {c}
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-sunset-300">{error}</p>}
          <button
            type="submit"
            disabled={saving || !firstName.trim()}
            className="tap-target flex w-full items-center justify-center gap-1.5 rounded-xl bg-ocean-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Plus size={16} /> {saving ? 'Adding…' : 'Add Family Member'}
          </button>
        </form>
      )}

      <div className="space-y-2.5">
        {dependents.map((dep) => {
          const isOpen = expandedId === dep.id;
          const dependentData = initialByDependent[dep.id] ?? {};
          return (
            <div key={dep.id} className="glass-card overflow-hidden rounded-xl2">
              <button
                onClick={() => setExpandedId(isOpen ? null : dep.id)}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="text-left">
                  <p className="font-medium text-white">
                    {dep.first_name} {dep.last_name ?? ''}
                  </p>
                  <p className="text-xs capitalize text-white/50">{dep.age_category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDependent(dep.id);
                    }}
                    className="rounded-lg p-1.5 text-white/40 hover:text-sunset-300"
                  >
                    <Trash2 size={15} />
                  </span>
                  {isOpen ? <ChevronUp size={18} className="text-white/40" /> : <ChevronDown size={18} className="text-white/40" />}
                </div>
              </button>
              {isOpen && (
                <div className="space-y-2.5 border-t border-white/10 p-3">
                  {sortedRequests.map((request) => {
                    const entry = dependentData[request.id];
                    return (
                      <RequestForm
                        key={request.id}
                        request={request}
                        options={optionsByRequest.get(request.id) ?? []}
                        initialResponse={entry?.response ?? null}
                        initialSelectedOptionIds={entry?.selectedOptionIds ?? []}
                        dependentId={dep.id}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {dependents.length === 0 && !adding && (
          <p className="glass-card rounded-xl2 p-4 text-sm text-white/50">
            Add a child or teen here to fill in their sizes and info.
          </p>
        )}
      </div>
    </section>
  );
}

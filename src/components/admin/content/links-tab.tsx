'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import type { UsefulLink } from '@/types/db';

type Draft = Omit<UsefulLink, 'id' | 'event_id'>;
const empty: Draft = { title: '', description: '', icon: '🔗', url: '', category: 'general', display_order: 0, is_active: true };

export function LinksTab() {
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [editing, setEditing] = useState<UsefulLink | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/links');
    const data = await res.json();
    setLinks(data.links ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(link: UsefulLink | 'new') {
    setEditing(link);
    setDraft(
      link === 'new'
        ? empty
        : {
            title: link.title,
            description: link.description ?? '',
            icon: link.icon ?? '',
            url: link.url,
            category: link.category,
            display_order: link.display_order,
            is_active: link.is_active,
          }
    );
  }

  async function save() {
    const isNew = editing === 'new';
    const url = isNew ? '/api/admin/links' : `/api/admin/links/${(editing as UsefulLink).id}`;
    await fetch(url, { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
    setEditing(null);
    load();
  }

  async function remove(link: UsefulLink) {
    if (!confirm(`Delete "${link.title}"?`)) return;
    await fetch(`/api/admin/links/${link.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <button onClick={() => startEdit('new')} className="flex items-center gap-1.5 rounded-lg bg-ocean-500 px-3 py-2 text-sm font-semibold text-white">
        <Plus size={15} /> Add Link
      </button>

      <div className="mt-4 space-y-2">
        {links.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-sm text-white">
              {l.icon} {l.title} <span className="text-slate-500">· {l.category}</span>
            </p>
            <div className="flex gap-1">
              <button onClick={() => startEdit(l)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300">
                <Pencil size={14} />
              </button>
              <button onClick={() => remove(l)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {links.length === 0 && <p className="text-sm text-slate-500">No links yet.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6">
          <div className="w-full max-w-md rounded-t-2xl bg-slate-900 p-6 sm:rounded-2xl">
            <h2 className="text-lg font-bold text-white">{editing === 'new' ? 'Add Link' : 'Edit Link'}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <F label="Icon" value={draft.icon ?? ''} onChange={(v) => setDraft((d) => ({ ...d, icon: v }))} />
              <F label="Category" value={draft.category} onChange={(v) => setDraft((d) => ({ ...d, category: v }))} />
              <F label="Title" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} full />
              <F label="URL" value={draft.url} onChange={(v) => setDraft((d) => ({ ...d, url: v }))} full />
              <F label="Description" value={draft.description ?? ''} onChange={(v) => setDraft((d) => ({ ...d, description: v }))} full />
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm text-slate-300">
                Cancel
              </button>
              <button onClick={save} disabled={!draft.title || !draft.url} className="flex-1 rounded-lg bg-ocean-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, value, onChange, full }: { label: string; value: string; onChange: (v: string) => void; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
    </div>
  );
}

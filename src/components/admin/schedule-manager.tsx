'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { ScheduleItem } from '@/types/db';

type Draft = Omit<ScheduleItem, 'id' | 'event_id'>;

const empty: Draft = { day_number: 1, day_label: 'Day 1', icon: '🚢', title: '', item_time: '', description: '', display_order: 0 };

export function ScheduleManager() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [editing, setEditing] = useState<ScheduleItem | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/schedule');
    const data = await res.json();
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(item: ScheduleItem | 'new') {
    setEditing(item);
    setDraft(
      item === 'new'
        ? empty
        : {
            day_number: item.day_number,
            day_label: item.day_label ?? '',
            icon: item.icon ?? '',
            title: item.title,
            item_time: item.item_time ?? '',
            description: item.description ?? '',
            display_order: item.display_order,
          }
    );
  }

  async function save() {
    setSaving(true);
    const isNew = editing === 'new';
    const url = isNew ? '/api/admin/schedule' : `/api/admin/schedule/${(editing as ScheduleItem).id}`;
    await fetch(url, { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
    setSaving(false);
    setEditing(null);
    load();
  }

  async function remove(item: ScheduleItem) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await fetch(`/api/admin/schedule/${item.id}`, { method: 'DELETE' });
    load();
  }

  const byDay = new Map<number, ScheduleItem[]>();
  for (const item of items) {
    const list = byDay.get(item.day_number) ?? [];
    list.push(item);
    byDay.set(item.day_number, list);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Party Schedule</h1>
        <button onClick={() => startEdit('new')} className="flex items-center gap-1.5 rounded-lg bg-ocean-500 px-3 py-2 text-sm font-semibold text-white">
          <Plus size={15} /> Add Item
        </button>
      </div>

      <div className="mt-5 space-y-6">
        {Array.from(byDay.entries()).map(([day, list]) => (
          <div key={day}>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">{list[0]?.day_label || `Day ${day}`}</p>
            <div className="space-y-2">
              {list
                .sort((a, b) => a.display_order - b.display_order)
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-3.5">
                    <div>
                      <p className="text-white">
                        {item.icon} {item.title}
                      </p>
                      <p className="text-xs text-slate-500">{item.item_time}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(item)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(item)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-500">No schedule items yet.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6">
          <div className="w-full max-w-md rounded-t-2xl bg-slate-900 p-6 sm:rounded-2xl">
            <h2 className="text-lg font-bold text-white">{editing === 'new' ? 'Add Schedule Item' : 'Edit Schedule Item'}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Text label="Day Number" type="number" value={String(draft.day_number)} onChange={(v) => setDraft((d) => ({ ...d, day_number: Number(v) || 1 }))} />
              <Text label="Day Label" value={draft.day_label ?? ''} onChange={(v) => setDraft((d) => ({ ...d, day_label: v }))} />
              <Text label="Icon" value={draft.icon ?? ''} onChange={(v) => setDraft((d) => ({ ...d, icon: v }))} />
              <Text label="Time" value={draft.item_time ?? ''} onChange={(v) => setDraft((d) => ({ ...d, item_time: v }))} />
              <Text label="Title" value={draft.title} onChange={(v) => setDraft((d) => ({ ...d, title: v }))} full />
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-400">Description</label>
                <textarea
                  value={draft.description ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm text-slate-300">
                Cancel
              </button>
              <button onClick={save} disabled={saving || !draft.title} className="flex-1 rounded-lg bg-ocean-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Text({ label, value, onChange, type = 'text', full }: { label: string; value: string; onChange: (v: string) => void; type?: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
    </div>
  );
}

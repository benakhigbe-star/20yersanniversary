'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Activity, ActivityCategory } from '@/types/db';

const CATEGORIES: ActivityCategory[] = [
  'dining',
  'entertainment',
  'excursions',
  'nightlife',
  'spa',
  'shopping',
  'party_events',
  'group_activities',
];

type Draft = Omit<Activity, 'id' | 'event_id' | 'created_at'>;

const empty: Draft = {
  image_url: '',
  name: '',
  description: '',
  location: '',
  activity_date: '',
  activity_time: '',
  cost: '',
  booking_required: false,
  booking_link: '',
  category: 'group_activities',
  display_order: 0,
  is_active: true,
};

export function ActivitiesManager() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editing, setEditing] = useState<Activity | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/activities');
    const data = await res.json();
    setActivities(data.activities ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(activity: Activity | 'new') {
    setEditing(activity);
    setDraft(
      activity === 'new'
        ? empty
        : {
            image_url: activity.image_url ?? '',
            name: activity.name,
            description: activity.description ?? '',
            location: activity.location ?? '',
            activity_date: activity.activity_date ?? '',
            activity_time: activity.activity_time ?? '',
            cost: activity.cost ?? '',
            booking_required: activity.booking_required,
            booking_link: activity.booking_link ?? '',
            category: activity.category,
            display_order: activity.display_order,
            is_active: activity.is_active,
          }
    );
  }

  async function save() {
    setSaving(true);
    const isNew = editing === 'new';
    const url = isNew ? '/api/admin/activities' : `/api/admin/activities/${(editing as Activity).id}`;
    await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    setEditing(null);
    load();
  }

  async function remove(activity: Activity) {
    if (!confirm(`Delete "${activity.name}"?`)) return;
    await fetch(`/api/admin/activities/${activity.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Activities</h1>
        <button
          onClick={() => startEdit('new')}
          className="flex items-center gap-1.5 rounded-lg bg-ocean-500 px-3 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} /> Add Activity
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {activities.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div>
              <p className="font-medium text-white">{a.name}</p>
              <p className="text-xs text-slate-500">
                {a.category.replace('_', ' ')} {a.location ? `· ${a.location}` : ''} {!a.is_active ? '· inactive' : ''}
              </p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => startEdit(a)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300">
                <Pencil size={14} />
              </button>
              <button onClick={() => remove(a)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {activities.length === 0 && <p className="text-sm text-slate-500">No activities yet.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-slate-900 p-6 sm:rounded-2xl">
            <h2 className="text-lg font-bold text-white">{editing === 'new' ? 'Add Activity' : 'Edit Activity'}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Text label="Name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} full />
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-400">Description</label>
                <textarea
                  value={draft.description ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                  rows={2}
                />
              </div>
              <Text label="Image URL" value={draft.image_url ?? ''} onChange={(v) => setDraft((d) => ({ ...d, image_url: v }))} full />
              <Text label="Location" value={draft.location ?? ''} onChange={(v) => setDraft((d) => ({ ...d, location: v }))} />
              <Text label="Cost" value={draft.cost ?? ''} onChange={(v) => setDraft((d) => ({ ...d, cost: v }))} />
              <Text label="Date" type="date" value={draft.activity_date ?? ''} onChange={(v) => setDraft((d) => ({ ...d, activity_date: v }))} />
              <Text label="Time" type="time" value={draft.activity_time ?? ''} onChange={(v) => setDraft((d) => ({ ...d, activity_time: v }))} />
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Category</label>
                <select
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as ActivityCategory }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <Text label="Booking Link" value={draft.booking_link ?? ''} onChange={(v) => setDraft((d) => ({ ...d, booking_link: v }))} full />
              <label className="col-span-2 flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={draft.booking_required}
                  onChange={(e) => setDraft((d) => ({ ...d, booking_required: e.target.checked }))}
                  className="h-4 w-4 accent-ocean-500"
                />
                Booking required
              </label>
              <label className="col-span-2 flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))}
                  className="h-4 w-4 accent-ocean-500"
                />
                Active
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm text-slate-300">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !draft.name}
                className="flex-1 rounded-lg bg-ocean-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  type = 'text',
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
      />
    </div>
  );
}

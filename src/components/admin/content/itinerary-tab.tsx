'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ItineraryDay } from '@/types/db';

type Draft = Omit<ItineraryDay, 'id' | 'event_id'>;
const empty: Draft = { day_number: 1, date: '', port_name: '', arrival_time: '', departure_time: '', description: '', display_order: 0 };

export function ItineraryTab() {
  const [days, setDays] = useState<ItineraryDay[]>([]);
  const [draft, setDraft] = useState<Draft>(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/itinerary');
    const data = await res.json();
    setDays(data.days ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addDay() {
    setSaving(true);
    await fetch('/api/admin/itinerary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
    setSaving(false);
    setDraft({ ...empty, day_number: draft.day_number + 1 });
    load();
  }

  async function remove(day: ItineraryDay) {
    if (!confirm(`Remove Day ${day.day_number} (${day.port_name})?`)) return;
    await fetch(`/api/admin/itinerary/${day.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="space-y-2">
        {days.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-3">
            <p className="text-sm text-white">
              Day {d.day_number} · {d.port_name} {d.date ? `(${d.date})` : ''}
            </p>
            <button onClick={() => remove(d)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {days.length === 0 && <p className="text-sm text-slate-500">No itinerary days yet.</p>}
      </div>

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="mb-3 text-sm font-semibold text-white">Add / Update Day</p>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Day #" value={draft.day_number} onChange={(v) => setDraft((d) => ({ ...d, day_number: v }))} />
          <TextField label="Date" type="date" value={draft.date ?? ''} onChange={(v) => setDraft((d) => ({ ...d, date: v }))} />
          <TextField label="Port Name" value={draft.port_name} onChange={(v) => setDraft((d) => ({ ...d, port_name: v }))} full />
          <TextField label="Arrival" type="time" value={draft.arrival_time ?? ''} onChange={(v) => setDraft((d) => ({ ...d, arrival_time: v }))} />
          <TextField label="Departure" type="time" value={draft.departure_time ?? ''} onChange={(v) => setDraft((d) => ({ ...d, departure_time: v }))} />
        </div>
        <button
          onClick={addDay}
          disabled={saving || !draft.port_name}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-ocean-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Plus size={15} /> Save Day
        </button>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, type = 'text', full }: { label: string; value: string; onChange: (v: string) => void; type?: string; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
    </div>
  );
}
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 1)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
    </div>
  );
}

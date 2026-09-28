'use client';

import { useEffect, useState } from 'react';
import type { Event, EventSettings } from '@/types/db';

type Fields = Pick<EventSettings, 'destinations' | 'boarding_info' | 'baggage_info' | 'dress_codes' | 'important_reminders' | 'documents_info'>;

export function CruiseInfoTab() {
  const [values, setValues] = useState<Fields>({
    destinations: '',
    boarding_info: '',
    baggage_info: '',
    dress_codes: '',
    important_reminders: '',
    documents_info: '',
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: { event: Event; settings: EventSettings | null }) => {
        setValues({
          destinations: data.settings?.destinations ?? '',
          boarding_info: data.settings?.boarding_info ?? '',
          baggage_info: data.settings?.baggage_info ?? '',
          dress_codes: data.settings?.dress_codes ?? '',
          important_reminders: data.settings?.important_reminders ?? '',
          documents_info: data.settings?.documents_info ?? '',
        });
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaved(false);
    setError(null);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? 'Could not save. Please try again.');
      return;
    }
    setSaved(true);
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-4">
      {(
        [
          ['destinations', 'Destinations'],
          ['boarding_info', 'Boarding Information'],
          ['baggage_info', 'Baggage Information'],
          ['dress_codes', 'Dress Codes'],
          ['important_reminders', 'Important Reminders'],
          ['documents_info', "Documents You'll Need"],
        ] as [keyof Fields, string][]
      ).map(([key, label]) => (
        <div key={key}>
          <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
          <textarea
            value={values[key] ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button onClick={save} className="rounded-lg bg-ocean-500 px-4 py-2.5 text-sm font-semibold text-white">
          Save Cruise Info
        </button>
        {saved && <span className="text-sm text-green-400">Saved ✓</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import type { Event } from '@/types/db';

type Fields = Pick<
  Event,
  | 'name'
  | 'cruise_name'
  | 'cruise_line'
  | 'ship_name'
  | 'departure_port'
  | 'departure_date'
  | 'departure_time'
  | 'return_date'
  | 'return_port'
  | 'logo_url'
  | 'hero_image_url'
  | 'welcome_message'
  | 'theme_color'
>;

export function SettingsManager() {
  const [values, setValues] = useState<Fields | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: { event: Event }) => {
        const e = data.event;
        setValues({
          name: e.name,
          cruise_name: e.cruise_name,
          cruise_line: e.cruise_line,
          ship_name: e.ship_name,
          departure_port: e.departure_port,
          departure_date: e.departure_date,
          departure_time: e.departure_time,
          return_date: e.return_date,
          return_port: e.return_port,
          logo_url: e.logo_url,
          hero_image_url: e.hero_image_url,
          welcome_message: e.welcome_message,
          theme_color: e.theme_color,
        });
      });
  }, []);

  function set<K extends keyof Fields>(key: K, v: Fields[K]) {
    setValues((prev) => (prev ? { ...prev, [key]: v } : prev));
  }

  async function save() {
    if (!values) return;
    setSaved(false);
    await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    setSaved(true);
  }

  if (!values) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Event Settings</h1>
      <p className="mt-1 text-sm text-slate-400">Change any of this without touching code — it updates the whole app.</p>

      <div className="mt-5 grid max-w-2xl grid-cols-2 gap-3">
        <F label="Event Name" value={values.name} onChange={(v) => set('name', v)} full />
        <F label="Cruise Name" value={values.cruise_name ?? ''} onChange={(v) => set('cruise_name', v)} />
        <F label="Cruise Line" value={values.cruise_line ?? ''} onChange={(v) => set('cruise_line', v)} />
        <F label="Ship Name" value={values.ship_name ?? ''} onChange={(v) => set('ship_name', v)} />
        <F label="Departure Port" value={values.departure_port ?? ''} onChange={(v) => set('departure_port', v)} />
        <F label="Departure Date" type="date" value={values.departure_date ?? ''} onChange={(v) => set('departure_date', v)} />
        <F label="Departure Time" type="time" value={values.departure_time ?? ''} onChange={(v) => set('departure_time', v)} />
        <F label="Return Date" type="date" value={values.return_date ?? ''} onChange={(v) => set('return_date', v)} />
        <F label="Return Port" value={values.return_port ?? ''} onChange={(v) => set('return_port', v)} />
        <F label="Theme Color" type="color" value={values.theme_color ?? '#0ea5a4'} onChange={(v) => set('theme_color', v)} />
        <F label="Logo URL" value={values.logo_url ?? ''} onChange={(v) => set('logo_url', v)} full />
        <F label="Hero Image URL" value={values.hero_image_url ?? ''} onChange={(v) => set('hero_image_url', v)} full />
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-400">Welcome Message</label>
          <textarea
            value={values.welcome_message ?? ''}
            onChange={(e) => set('welcome_message', e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button onClick={save} className="rounded-lg bg-ocean-500 px-4 py-2.5 text-sm font-semibold text-white">
          Save Settings
        </button>
        {saved && <span className="text-sm text-green-400">Saved ✓</span>}
      </div>
    </div>
  );
}

function F({
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

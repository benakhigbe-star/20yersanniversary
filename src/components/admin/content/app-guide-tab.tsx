'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface StepDraft {
  step_number: number;
  title: string;
  description: string;
}
interface FeatureDraft {
  label: string;
}
interface TipDraft {
  tip: string;
}

export function AppGuideTab() {
  const [appName, setAppName] = useState('');
  const [appStoreUrl, setAppStoreUrl] = useState('');
  const [googlePlayUrl, setGooglePlayUrl] = useState('');
  const [intro, setIntro] = useState('');
  const [steps, setSteps] = useState<StepDraft[]>([]);
  const [features, setFeatures] = useState<FeatureDraft[]>([]);
  const [tips, setTips] = useState<TipDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/app-guide')
      .then((r) => r.json())
      .then((data) => {
        if (data.guide) {
          setAppName(data.guide.app_name ?? '');
          setAppStoreUrl(data.guide.app_store_url ?? '');
          setGooglePlayUrl(data.guide.google_play_url ?? '');
          setIntro(data.guide.intro_description ?? '');
        }
        setSteps((data.steps ?? []).map((s: { step_number: number; title: string; description: string | null }) => ({ step_number: s.step_number, title: s.title, description: s.description ?? '' })));
        setFeatures((data.features ?? []).map((f: { label: string }) => ({ label: f.label })));
        setTips((data.tips ?? []).map((t: { tip: string }) => ({ tip: t.tip })));
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaved(false);
    await fetch('/api/admin/app-guide', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_name: appName,
        app_store_url: appStoreUrl,
        google_play_url: googlePlayUrl,
        intro_description: intro,
        steps: steps.map((s, i) => ({ ...s, display_order: i })),
        features: features.filter((f) => f.label.trim()).map((f, i) => ({ ...f, display_order: i })),
        tips: tips.filter((t) => t.tip.trim()).map((t, i) => ({ ...t, display_order: i })),
      }),
    });
    setSaved(true);
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="App Name" value={appName} onChange={setAppName} full />
        <Field label="App Store URL" value={appStoreUrl} onChange={setAppStoreUrl} />
        <Field label="Google Play URL" value={googlePlayUrl} onChange={setGooglePlayUrl} />
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-400">Intro Description</label>
          <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
        </div>
      </div>

      <Section
        title="Steps"
        items={steps}
        onAdd={() => setSteps((s) => [...s, { step_number: s.length + 1, title: '', description: '' }])}
        onRemove={(i) => setSteps((s) => s.filter((_, idx) => idx !== i))}
        render={(step, i) => (
          <div className="grid flex-1 grid-cols-2 gap-2">
            <input
              value={step.title}
              placeholder={`Step ${i + 1} title`}
              onChange={(e) => setSteps((s) => s.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            />
            <input
              value={step.description}
              placeholder="Description"
              onChange={(e) => setSteps((s) => s.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)))}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
            />
          </div>
        )}
      />

      <Section
        title="Useful Features"
        items={features}
        onAdd={() => setFeatures((f) => [...f, { label: '' }])}
        onRemove={(i) => setFeatures((f) => f.filter((_, idx) => idx !== i))}
        render={(feature, i) => (
          <input
            value={feature.label}
            placeholder="Feature"
            onChange={(e) => setFeatures((f) => f.map((x, idx) => (idx === i ? { label: e.target.value } : x)))}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
          />
        )}
      />

      <Section
        title="Tips"
        items={tips}
        onAdd={() => setTips((t) => [...t, { tip: '' }])}
        onRemove={(i) => setTips((t) => t.filter((_, idx) => idx !== i))}
        render={(tip, i) => (
          <input
            value={tip.tip}
            placeholder="Tip"
            onChange={(e) => setTips((t) => t.map((x, idx) => (idx === i ? { tip: e.target.value } : x)))}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
          />
        )}
      />

      <div className="flex items-center gap-3">
        <button onClick={save} className="rounded-lg bg-ocean-500 px-4 py-2.5 text-sm font-semibold text-white">
          Save App Guide
        </button>
        {saved && <span className="text-sm text-green-400">Saved ✓</span>}
      </div>
    </div>
  );
}

function Section<T>({
  title,
  items,
  onAdd,
  onRemove,
  render,
}: {
  title: string;
  items: T[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  render: (item: T, i: number) => React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
        <button onClick={onAdd} className="flex items-center gap-1 text-xs font-medium text-ocean-400">
          <Plus size={13} /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            {render(item, i)}
            <button onClick={() => onRemove(i)} className="rounded-lg border border-slate-700 px-2 text-slate-400">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, full }: { label: string; value: string; onChange: (v: string) => void; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="mb-1 block text-xs font-medium text-slate-400">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
    </div>
  );
}

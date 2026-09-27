'use client';

import { useState } from 'react';
import { CruiseInfoTab } from './cruise-info-tab';
import { ItineraryTab } from './itinerary-tab';
import { AppGuideTab } from './app-guide-tab';
import { LinksTab } from './links-tab';
import { PackingTab } from './packing-tab';
import { AnnouncementsTab } from './announcements-tab';

const TABS = [
  { key: 'cruise-info', label: 'Cruise Info' },
  { key: 'itinerary', label: 'Itinerary' },
  { key: 'app-guide', label: 'App Guide' },
  { key: 'links', label: 'Useful Links' },
  { key: 'packing', label: 'Packing List' },
  { key: 'announcements', label: 'Announcements' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function ContentManager({ initialTab }: { initialTab?: string }) {
  const [tab, setTab] = useState<TabKey>((TABS.find((t) => t.key === initialTab)?.key ?? 'cruise-info') as TabKey);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Cruise Guide & Content</h1>
      <p className="mt-1 text-sm text-slate-400">Everything guests see under Cruise Info, App Guide, Links and more.</p>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              tab === t.key ? 'bg-ocean-500/20 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'cruise-info' && <CruiseInfoTab />}
        {tab === 'itinerary' && <ItineraryTab />}
        {tab === 'app-guide' && <AppGuideTab />}
        {tab === 'links' && <LinksTab />}
        {tab === 'packing' && <PackingTab />}
        {tab === 'announcements' && <AnnouncementsTab />}
      </div>
    </div>
  );
}

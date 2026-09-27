'use client';

import { useState } from 'react';
import { Share, PlusSquare, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export function InstallPwaGuide() {
  const [tab, setTab] = useState<'ios' | 'android'>('ios');

  return (
    <section className="glass-card rounded-xl2 p-5">
      <h2 className="font-display text-xl font-semibold text-white">Install Cruise Party App</h2>
      <p className="mt-1 text-sm text-white/60">
        Add this site to your home screen for one-tap access, just like a regular app.
      </p>

      <div className="mt-4 flex gap-2 rounded-xl bg-white/5 p-1">
        {(['ios', 'android'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'tap-target flex-1 rounded-lg py-2 text-sm font-medium transition',
              tab === t ? 'bg-white text-black' : 'text-white/60'
            )}
          >
            {t === 'ios' ? 'iPhone' : 'Android'}
          </button>
        ))}
      </div>

      {tab === 'ios' ? (
        <ol className="mt-4 space-y-3 text-sm text-white/80">
          <li className="flex items-center gap-3">
            <Share size={18} className="shrink-0 text-ocean-300" />
            Tap the <strong className="text-white">Share</strong> icon in Safari&apos;s toolbar.
          </li>
          <li className="flex items-center gap-3">
            <PlusSquare size={18} className="shrink-0 text-ocean-300" />
            Choose <strong className="text-white">Add to Home Screen</strong>.
          </li>
          <li className="flex items-center gap-3">✅ Tap <strong className="text-white">Add</strong> — you&apos;re done!</li>
        </ol>
      ) : (
        <ol className="mt-4 space-y-3 text-sm text-white/80">
          <li className="flex items-center gap-3">
            <MoreVertical size={18} className="shrink-0 text-ocean-300" />
            Tap the <strong className="text-white">⋮ menu</strong> in Chrome.
          </li>
          <li className="flex items-center gap-3">
            <PlusSquare size={18} className="shrink-0 text-ocean-300" />
            Choose <strong className="text-white">Install app</strong> (or Add to Home screen).
          </li>
          <li className="flex items-center gap-3">✅ Confirm — the app icon appears on your home screen!</li>
        </ol>
      )}
    </section>
  );
}

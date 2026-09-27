'use client';

import { useState, useTransition } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PackingItem } from '@/types/db';

export function PackingChecklist({
  items,
  initialChecked,
}: {
  items: PackingItem[];
  initialChecked: Record<string, boolean>;
}) {
  const [checked, setChecked] = useState(initialChecked);
  const [, startTransition] = useTransition();

  const byCategory = new Map<string, PackingItem[]>();
  for (const item of items) {
    const cat = item.category || 'General';
    const list = byCategory.get(cat) ?? [];
    list.push(item);
    byCategory.set(cat, list);
  }

  const total = items.length;
  const done = items.filter((i) => checked[i.id]).length;

  function toggle(item: PackingItem) {
    const next = !checked[item.id];
    setChecked((prev) => ({ ...prev, [item.id]: next }));
    startTransition(() => {
      fetch('/api/packing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packing_item_id: item.id, is_checked: next }),
      }).catch(() => {
        setChecked((prev) => ({ ...prev, [item.id]: !next }));
      });
    });
  }

  return (
    <div className="space-y-5">
      <div className="glass-card rounded-xl2 p-4">
        <p className="text-sm text-white/70">
          Packed <span className="font-semibold text-white">{done}</span> of {total}
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-champagne-400 transition-all"
            style={{ width: `${total ? (done / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {Array.from(byCategory.entries()).map(([category, list]) => (
        <div key={category}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">{category}</p>
          <div className="space-y-2">
            {list.map((item) => {
              const isChecked = !!checked[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => toggle(item)}
                  className={cn(
                    'tap-target flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
                    isChecked ? 'border-green-400/40 bg-green-500/10' : 'border-white/10 bg-white/5'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2',
                      isChecked ? 'border-green-400 bg-green-400 text-midnight-950' : 'border-white/30'
                    )}
                  >
                    {isChecked && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span className={cn('text-sm', isChecked ? 'text-white/50 line-through' : 'text-white')}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

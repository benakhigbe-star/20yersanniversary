'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { PackingItem } from '@/types/db';

export function PackingTab() {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/packing');
    const data = await res.json();
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!label.trim()) return;
    await fetch('/api/admin/packing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, category: category || 'General', display_order: items.length, is_active: true }),
    });
    setLabel('');
    load();
  }

  async function remove(item: PackingItem) {
    await fetch(`/api/admin/packing/${item.id}`, { method: 'DELETE' });
    load();
  }

  const byCategory = new Map<string, PackingItem[]>();
  for (const item of items) {
    const cat = item.category || 'General';
    const list = byCategory.get(cat) ?? [];
    list.push(item);
    byCategory.set(cat, list);
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (e.g. Documents)"
          className="w-40 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Item (e.g. Passport)"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
        />
        <button onClick={add} className="flex items-center gap-1 rounded-lg bg-ocean-500 px-3 py-2 text-sm font-semibold text-white">
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {Array.from(byCategory.entries()).map(([cat, list]) => (
          <div key={cat}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{cat}</p>
            <div className="space-y-1.5">
              {list.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
                  <p className="text-sm text-white">{item.label}</p>
                  <button onClick={() => remove(item)} className="rounded border border-slate-700 p-1 text-slate-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-500">No packing items yet.</p>}
      </div>
    </div>
  );
}

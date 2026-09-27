'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { Announcement } from '@/types/db';

export function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<Announcement['priority']>('normal');
  const [publishNow, setPublishNow] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/announcements');
    const data = await res.json();
    setAnnouncements(data.announcements ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function create() {
    if (!title.trim() || !body.trim()) return;
    await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body, priority, is_published: publishNow }),
    });
    setTitle('');
    setBody('');
    setPriority('normal');
    load();
  }

  async function togglePublish(a: Announcement) {
    await fetch(`/api/admin/announcements/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !a.is_published }),
    });
    load();
  }

  async function remove(a: Announcement) {
    if (!confirm(`Delete "${a.title}"?`)) return;
    await fetch(`/api/admin/announcements/${a.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="mb-3 text-sm font-semibold text-white">New Announcement</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          rows={2}
          className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Announcement['priority'])}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
          >
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} className="h-4 w-4 accent-ocean-500" />
            Publish immediately
          </label>
          <button onClick={create} className="ml-auto flex items-center gap-1.5 rounded-lg bg-ocean-500 px-3 py-2 text-sm font-semibold text-white">
            <Plus size={15} /> Create
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {announcements.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-3">
            <div>
              <p className="text-sm font-medium text-white">
                {a.title} <span className="text-xs uppercase text-slate-500">· {a.priority}</span>
              </p>
              <p className="text-xs text-slate-500">{a.is_published ? `Published ${formatDateTime(a.published_at)}` : 'Draft'}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => togglePublish(a)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300" title={a.is_published ? 'Unpublish' : 'Publish'}>
                {a.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button onClick={() => remove(a)} className="rounded-lg border border-slate-700 p-1.5 text-slate-300">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {announcements.length === 0 && <p className="text-sm text-slate-500">No announcements yet.</p>}
      </div>
    </div>
  );
}

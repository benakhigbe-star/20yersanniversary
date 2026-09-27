'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Upload, Download, Pencil, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { GuestFormModal, type GuestFormValues } from './guest-form-modal';
import { CsvImportModal } from './csv-import-modal';
import { formatDate } from '@/lib/utils';
import type { Guest } from '@/types/db';

export function GuestsManager() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editing, setEditing] = useState<Guest | null | 'new'>(null);
  const [importOpen, setImportOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const res = await fetch(`/api/admin/guests?${params.toString()}`);
    const data = await res.json();
    setGuests(data.guests ?? []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function handleSave(values: GuestFormValues): Promise<string | null> {
    const isNew = editing === 'new';
    const url = isNew ? '/api/admin/guests' : `/api/admin/guests/${(editing as Guest).id}`;
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? 'Could not save guest.';
    setEditing(null);
    load();
    return null;
  }

  async function toggleActive(guest: Guest) {
    await fetch(`/api/admin/guests/${guest.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !guest.is_active }),
    });
    load();
  }

  async function handleDelete(guest: Guest) {
    if (!confirm(`Delete ${guest.first_name} ${guest.last_name}? This cannot be undone.`)) return;
    await fetch(`/api/admin/guests/${guest.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Guests</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
          >
            <Upload size={15} /> Import CSV
          </button>
          <a
            href="/api/admin/guests/export"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
          >
            <Download size={15} /> Export CSV
          </a>
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-1.5 rounded-lg bg-ocean-500 px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus size={15} /> Add Guest
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Disabled</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-3 py-2.5 font-medium">Name</th>
              <th className="px-3 py-2.5 font-medium">Email</th>
              <th className="px-3 py-2.5 font-medium">Group</th>
              <th className="px-3 py-2.5 font-medium">Cabin</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Last Login</th>
              <th className="px-3 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && guests.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                  No guests found.
                </td>
              </tr>
            )}
            {guests.map((guest) => (
              <tr key={guest.id} className="text-slate-200">
                <td className="px-3 py-2.5">
                  {guest.preferred_name || guest.first_name} {guest.last_name}
                </td>
                <td className="px-3 py-2.5 text-slate-400">{guest.email}</td>
                <td className="px-3 py-2.5 text-slate-400">{guest.group_name || '—'}</td>
                <td className="px-3 py-2.5 text-slate-400">{guest.cabin_number || '—'}</td>
                <td className="px-3 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      guest.is_active ? 'bg-green-500/15 text-green-400' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {guest.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-slate-400">{formatDate(guest.last_login_at)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex justify-end gap-1">
                    <IconButton onClick={() => setEditing(guest)} title="Edit">
                      <Pencil size={14} />
                    </IconButton>
                    <IconButton onClick={() => toggleActive(guest)} title={guest.is_active ? 'Disable' : 'Enable'}>
                      {guest.is_active ? <Ban size={14} /> : <CheckCircle size={14} />}
                    </IconButton>
                    <IconButton onClick={() => handleDelete(guest)} title="Delete">
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <GuestFormModal
          guest={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
      {importOpen && (
        <CsvImportModal
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setImportOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function IconButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"
    >
      {children}
    </button>
  );
}

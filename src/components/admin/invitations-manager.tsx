'use client';

import { useEffect, useState, useCallback } from 'react';
import { Check, X, Mail } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { SignupRequest, SignupRequestStatus } from '@/types/db';

const TABS: { value: SignupRequestStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Declined' },
];

export function InvitationsManager() {
  const [tab, setTab] = useState<SignupRequestStatus>('pending');
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (status: SignupRequestStatus) => {
    setLoading(true);
    const res = await fetch(`/api/admin/invitations?status=${status}`);
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  async function approve(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/invitations/${id}/approve`, { method: 'POST' });
    setBusyId(null);
    load(tab);
  }

  async function reject(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/invitations/${id}/reject`, { method: 'POST' });
    setBusyId(null);
    load(tab);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Invitation Requests</h1>
      <p className="mt-1 text-sm text-slate-400">
        People who asked to be added because you didn&apos;t have their email — approve to create their guest login.
      </p>

      <div className="mt-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              tab === t.value ? 'bg-ocean-500/20 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {!loading && requests.length === 0 && (
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-500">
            {tab === 'pending' ? 'No pending requests right now.' : `No ${tab} requests.`}
          </p>
        )}
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-white">
                  {r.preferred_name || r.first_name} {r.last_name}
                  {r.preferred_name && <span className="ml-1.5 text-xs text-slate-500">({r.first_name})</span>}
                </p>
                <p className="flex items-center gap-1 text-sm text-slate-400">
                  <Mail size={12} /> {r.email}
                </p>
                {r.note && <p className="mt-1.5 text-sm text-slate-300">&ldquo;{r.note}&rdquo;</p>}
                <p className="mt-1.5 text-xs text-slate-500">Requested {formatDateTime(r.created_at)}</p>
              </div>
              {tab === 'pending' && (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => approve(r.id)}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1 rounded-lg bg-green-500/20 px-2.5 py-1.5 text-xs font-semibold text-green-300 disabled:opacity-50"
                    title="Approve — creates their guest login"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => reject(r.id)}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1 rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 disabled:opacity-50"
                    title="Decline"
                  >
                    <X size={14} /> Decline
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

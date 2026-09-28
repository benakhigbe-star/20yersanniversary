'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { RequestFormModal, type RequestFormValues } from './request-form-modal';
import { formatDate } from '@/lib/utils';
import type { InformationRequest, RequestOption } from '@/types/db';

export function RequestsManager() {
  const [requests, setRequests] = useState<InformationRequest[]>([]);
  const [optionsByRequest, setOptionsByRequest] = useState<Map<string, RequestOption[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<InformationRequest | null | 'new'>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/requests');
    const data = await res.json();
    setRequests(data.requests ?? []);
    const map = new Map<string, RequestOption[]>();
    for (const opt of (data.options ?? []) as RequestOption[]) {
      const list = map.get(opt.request_id) ?? [];
      list.push(opt);
      map.set(opt.request_id, list);
    }
    setOptionsByRequest(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(values: RequestFormValues): Promise<string | null> {
    const isNew = editing === 'new';
    const url = isNew ? '/api/admin/requests' : `/api/admin/requests/${(editing as InformationRequest).id}`;
    const payload = {
      title: values.title,
      description: values.description || null,
      question_type: values.question_type,
      is_required: values.is_required,
      deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
      display_order: values.display_order,
      is_active: values.is_active,
      allow_edit_after_submit: values.allow_edit_after_submit,
      icon: values.icon || null,
      config: {
        ...(values.sizing_system ? { sizing_system: values.sizing_system } : {}),
        ...(values.category ? { category: values.category } : {}),
      },
      options: values.options
        .filter((o) => o.label.trim())
        .map((o, i) => ({ id: o.id, label: o.label, value: o.value || o.label, display_order: i, image_url: o.image_url || null })),
    };
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? 'Could not save.';
    setEditing(null);
    load();
    return null;
  }

  async function handleDelete(request: InformationRequest) {
    if (!confirm(`Delete "${request.title}"? All guest responses to it will be removed.`)) return;
    await fetch(`/api/admin/requests/${request.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Information Requests</h1>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 rounded-lg bg-ocean-500 px-3 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} /> New Request
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-400">
        Create dynamic forms guests fill in from their dashboard — clothing sizes, dietary needs, anything.
      </p>

      <div className="mt-5 space-y-2">
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {!loading && requests.length === 0 && (
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-500">
            No requests yet — create your first one.
          </p>
        )}
        {requests
          .sort((a, b) => a.display_order - b.display_order)
          .map((request) => (
            <div key={request.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span>{request.icon || '📌'}</span>
                  <p className="font-medium text-white">{request.title}</p>
                  {request.is_required && (
                    <span className="rounded-full bg-sunset-500/15 px-2 py-0.5 text-[10px] font-semibold text-sunset-300">
                      Required
                    </span>
                  )}
                  {!request.is_active && (
                    <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {request.question_type.replace('_', ' ')}
                  {request.deadline ? ` · Deadline ${formatDate(request.deadline)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link
                  href={`/admin/responses?request=${request.id}`}
                  className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"
                  title="View responses"
                >
                  <LinkIcon size={14} />
                </Link>
                <button
                  onClick={() => setEditing(request)}
                  className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(request)}
                  className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
      </div>

      {editing && (
        <RequestFormModal
          request={editing === 'new' ? null : editing}
          options={editing === 'new' ? [] : optionsByRequest.get(editing.id) ?? []}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

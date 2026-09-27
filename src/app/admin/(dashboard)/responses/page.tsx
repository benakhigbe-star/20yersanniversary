import Link from 'next/link';
import { getAdminContext } from '@/lib/admin-data';
import { getResponseTracking } from '@/lib/admin-data';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/utils';
import { Download } from 'lucide-react';
import type { InformationRequest } from '@/types/db';

export const dynamic = 'force-dynamic';

export default async function AdminResponsesPage({
  searchParams,
}: {
  searchParams: { request?: string; status?: string; group?: string };
}) {
  const { event } = await getAdminContext();

  const { data: requests } = await supabaseAdmin()
    .from('information_requests')
    .select('*')
    .eq('event_id', event.id)
    .order('display_order');
  const typedRequests = (requests ?? []) as unknown as InformationRequest[];

  const activeRequestId = searchParams.request || typedRequests[0]?.id;
  const activeRequest = typedRequests.find((r) => r.id === activeRequestId);

  const rows = activeRequestId ? await getResponseTracking(event.id, activeRequestId) : [];

  const statusFilter = searchParams.status;
  const groupFilter = searchParams.group;
  const filteredRows = rows.filter((r) => {
    if (statusFilter === 'submitted' && !r.submitted) return false;
    if (statusFilter === 'outstanding' && r.submitted) return false;
    if (groupFilter && r.group !== groupFilter) return false;
    return true;
  });

  const submittedCount = rows.filter((r) => r.submitted).length;
  const groups = Array.from(new Set(rows.map((r) => r.group).filter(Boolean))) as string[];

  function urlWith(params: Record<string, string | undefined>) {
    const usp = new URLSearchParams();
    usp.set('request', activeRequestId ?? '');
    if (params.status ?? statusFilter) usp.set('status', params.status ?? statusFilter!);
    if (params.group ?? groupFilter) usp.set('group', params.group ?? groupFilter!);
    if ('status' in params && !params.status) usp.delete('status');
    if ('group' in params && !params.group) usp.delete('group');
    return `/admin/responses?${usp.toString()}`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Response Tracking</h1>
      <p className="mt-1 text-sm text-slate-400">Track completion for every information request.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {typedRequests.map((r) => (
          <Link
            key={r.id}
            href={`/admin/responses?request=${r.id}`}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              r.id === activeRequestId ? 'border-ocean-400 bg-ocean-500/20 text-white' : 'border-slate-700 text-slate-300'
            }`}
          >
            {r.icon ?? ''} {r.title}
          </Link>
        ))}
      </div>

      {activeRequest && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-white">
                Submitted: {submittedCount} / {rows.length}
              </p>
              <p className="text-sm text-sunset-400">Outstanding: {rows.length - submittedCount}</p>
            </div>
            <a
              href={`/api/admin/responses/export?request_id=${activeRequestId}`}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
            >
              <Download size={15} /> Export CSV
            </a>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href={urlWith({ status: undefined })} className={filterPill(!statusFilter)}>
              All
            </Link>
            <Link href={urlWith({ status: 'submitted' })} className={filterPill(statusFilter === 'submitted')}>
              Submitted
            </Link>
            <Link href={urlWith({ status: 'outstanding' })} className={filterPill(statusFilter === 'outstanding')}>
              Outstanding
            </Link>
            {groups.map((g) => (
              <Link key={g} href={urlWith({ group: groupFilter === g ? undefined : g })} className={filterPill(groupFilter === g)}>
                {g}
              </Link>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Guest</th>
                  <th className="px-3 py-2.5 font-medium">Email</th>
                  <th className="px-3 py-2.5 font-medium">Answer</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRows.map((r) => (
                  <tr key={r.guestId} className="text-slate-200">
                    <td className="px-3 py-2.5">{r.name}</td>
                    <td className="px-3 py-2.5 text-slate-400">{r.email}</td>
                    <td className="px-3 py-2.5">{r.answer ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      {r.submitted ? (
                        <span className="text-green-400">✓ Submitted</span>
                      ) : (
                        <span className="text-sunset-400">Outstanding</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">{formatDate(r.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {typedRequests.length === 0 && (
        <p className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-500">
          Create an information request first to see response tracking.
        </p>
      )}
    </div>
  );
}

function filterPill(active: boolean) {
  return `rounded-full border px-3 py-1 ${active ? 'border-ocean-400 bg-ocean-500/20 text-white' : 'border-slate-700 text-slate-300'}`;
}

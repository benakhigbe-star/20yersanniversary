import { getAdminContext, getDashboardStats, getRecentActivity } from '@/lib/admin-data';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const { event } = await getAdminContext();
  const stats = await getDashboardStats(event.id);
  const activity = await getRecentActivity(event.id);

  const cards = [
    { label: 'Total Guests', value: stats.totalGuests },
    { label: 'Profile Complete', value: stats.profileComplete },
    { label: 'Outstanding Actions', value: stats.outstandingActions },
    ...stats.requestStats.slice(0, 4).map((r) => ({
      label: `${r.request.title} Responses`,
      value: `${r.submitted}/${r.total}`,
    })),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-400">{event.name}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold text-white">Recent Activity</h2>
          <ul className="mt-3 space-y-3">
            {activity.length === 0 && <p className="text-sm text-slate-500">Nothing yet.</p>}
            {activity.map((a) => (
              <li key={a.id} className="border-l-2 border-ocean-500/50 pl-3 text-sm">
                <p className="text-slate-200">{a.message}</p>
                <p className="text-xs text-slate-500">{formatDateTime(a.created_at)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold text-white">Information Request Completion</h2>
          <div className="mt-3 space-y-3">
            {stats.requestStats.length === 0 && <p className="text-sm text-slate-500">No requests created yet.</p>}
            {stats.requestStats.map((r) => {
              const pct = r.total ? Math.round((r.submitted / r.total) * 100) : 0;
              return (
                <div key={r.request.id}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-200">{r.request.title}</span>
                    <span className="text-slate-400">
                      {r.submitted}/{r.total}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-ocean-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/admin/responses" className="mt-4 inline-block text-sm font-medium text-ocean-400">
            View full response tracking →
          </Link>
        </div>
      </div>
    </div>
  );
}

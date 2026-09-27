import { getGuestContext, getPublishedAnnouncements } from '@/lib/guest-data';
import { PageShell } from '@/components/page-shell';
import { GuestHeader } from '@/components/guest-header';
import { formatDateTime, cn } from '@/lib/utils';
import type { Announcement } from '@/types/db';

export const dynamic = 'force-dynamic';

const priorityDot: Record<Announcement['priority'], string> = {
  urgent: 'bg-red-400',
  important: 'bg-sunset-400',
  normal: 'bg-white/30',
};

export default async function AnnouncementsPage() {
  const { event } = await getGuestContext();
  const announcements = await getPublishedAnnouncements(event.id);

  return (
    <PageShell>
      <GuestHeader title="Announcements" subtitle="Stay in the loop" />
      <div className="space-y-3 px-5 pt-5">
        {announcements.length === 0 && (
          <p className="glass-card rounded-xl2 p-4 text-sm text-white/60">No announcements yet.</p>
        )}
        {announcements.map((a) => (
          <div key={a.id} className="glass-card rounded-xl2 p-4">
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', priorityDot[a.priority])} />
              <p className="text-xs uppercase tracking-wide text-white/50">
                {a.priority} · {formatDateTime(a.published_at)}
              </p>
            </div>
            <p className="mt-1 font-semibold text-white">{a.title}</p>
            <p className="mt-0.5 text-sm text-white/70">{a.body}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

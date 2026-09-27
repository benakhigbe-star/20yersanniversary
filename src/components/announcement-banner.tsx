import { cn, formatDateTime } from '@/lib/utils';
import type { Announcement } from '@/types/db';
import { Megaphone } from 'lucide-react';

const priorityStyles: Record<Announcement['priority'], string> = {
  urgent: 'bg-red-500/20 border-red-400/40 text-red-100',
  important: 'bg-sunset-500/20 border-sunset-400/40 text-sunset-100',
  normal: 'bg-white/10 border-white/15 text-white/85',
};

export function AnnouncementBanner({ announcements }: { announcements: Announcement[] }) {
  const prominent = announcements.filter((a) => a.priority !== 'normal').slice(0, 3);
  if (prominent.length === 0) return null;

  return (
    <div className="space-y-2">
      {prominent.map((a) => (
        <div key={a.id} className={cn('flex gap-3 rounded-xl2 border p-4', priorityStyles[a.priority])}>
          <Megaphone size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
              {a.priority} · {formatDateTime(a.published_at)}
            </p>
            <p className="font-semibold">{a.title}</p>
            <p className="mt-0.5 text-sm opacity-90">{a.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

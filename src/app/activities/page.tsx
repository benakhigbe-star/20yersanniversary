import Image from 'next/image';
import { getGuestContext, getActivities } from '@/lib/guest-data';
import { PageShell } from '@/components/page-shell';
import { GuestHeader } from '@/components/guest-header';
import { formatDate } from '@/lib/utils';
import { MapPin, Clock3, Ticket, ExternalLink } from 'lucide-react';
import type { ActivityCategory } from '@/types/db';

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  dining: '🍽 Dining',
  entertainment: '🎭 Entertainment',
  excursions: '🏝 Excursions',
  nightlife: '🌙 Nightlife',
  spa: '💆 Spa',
  shopping: '🛍 Shopping',
  party_events: '🎉 Party Events',
  group_activities: '🤝 Group Activities',
};

export default async function ActivitiesPage() {
  const { event } = await getGuestContext();
  const activities = await getActivities(event.id);

  const byCategory = new Map<ActivityCategory, typeof activities>();
  for (const activity of activities) {
    const list = byCategory.get(activity.category) ?? [];
    list.push(activity);
    byCategory.set(activity.category, list);
  }

  return (
    <PageShell>
      <GuestHeader title="Things To Do" subtitle="Everything to explore on this trip" />
      <div className="space-y-6 px-5 pt-5">
        {activities.length === 0 && (
          <p className="glass-card rounded-xl2 p-4 text-sm text-white/60">Activities will appear here soon.</p>
        )}
        {Array.from(byCategory.entries()).map(([category, list]) => (
          <section key={category}>
            <h2 className="mb-2 font-display text-lg font-semibold text-white">{CATEGORY_LABELS[category]}</h2>
            <div className="space-y-3">
              {list.map((activity) => (
                <article key={activity.id} className="glass-card overflow-hidden rounded-xl2">
                  {activity.image_url && (
                    <div className="relative h-36 w-full">
                      <Image src={activity.image_url} alt={activity.name} fill className="object-cover" unoptimized />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-white">{activity.name}</p>
                      {activity.cost && (
                        <span className="shrink-0 rounded-full bg-champagne-500/20 px-2 py-0.5 text-xs font-medium text-champagne-200">
                          {activity.cost}
                        </span>
                      )}
                    </div>
                    {activity.description && <p className="mt-1 text-sm text-white/60">{activity.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
                      {activity.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {activity.location}
                        </span>
                      )}
                      {(activity.activity_date || activity.activity_time) && (
                        <span className="flex items-center gap-1">
                          <Clock3 size={12} />
                          {activity.activity_date ? formatDate(activity.activity_date) : ''} {activity.activity_time ?? ''}
                        </span>
                      )}
                      {activity.booking_required && (
                        <span className="flex items-center gap-1 text-sunset-300">
                          <Ticket size={12} /> Booking required
                        </span>
                      )}
                    </div>
                    {activity.booking_link && (
                      <a
                        href={activity.booking_link}
                        target="_blank"
                        rel="noreferrer"
                        className="tap-target mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-white/10 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
                      >
                        Book now <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

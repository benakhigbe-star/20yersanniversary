import Link from 'next/link';
import {
  getGuestContext,
  getActiveRequestsWithOptions,
  getGuestResponses,
  getGuestResponseOptionIds,
  getPublishedAnnouncements,
} from '@/lib/guest-data';
import { buildRequestStatuses, computeProfileCompletion } from '@/lib/profile';
import { requestIcon } from '@/lib/request-display';
import { PageShell } from '@/components/page-shell';
import { GuestHeader } from '@/components/guest-header';
import { Countdown } from '@/components/countdown';
import { ProgressBar } from '@/components/progress-bar';
import { AnnouncementBanner } from '@/components/announcement-banner';
import { ActionCard } from '@/components/action-card';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { guest, event } = await getGuestContext();
  const { requests, optionsByRequest } = await getActiveRequestsWithOptions(event.id);
  const responses = await getGuestResponses(guest.id);
  await getGuestResponseOptionIds(responses.map((r) => r.id)); // warms cache for /actions
  const announcements = await getPublishedAnnouncements(event.id);

  const statuses = buildRequestStatuses(requests, responses);
  const completion = computeProfileCompletion(statuses);

  const departureIso =
    event.departure_date && event.departure_time
      ? `${event.departure_date}T${event.departure_time}`
      : event.departure_date
        ? `${event.departure_date}T00:00:00`
        : null;

  const displayName = guest.preferred_name || guest.first_name;

  return (
    <PageShell>
      <GuestHeader title={`Welcome, ${displayName}! 👋`} subtitle={event.name} />

      <div className="space-y-4 px-5 pt-5">
        <Countdown targetIso={departureIso} />
        <AnnouncementBanner announcements={announcements} />
        <ProgressBar percent={completion} label="Your Cruise Party Profile" />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Your To-Do List</h2>
            <Link href="/actions" className="text-xs font-medium text-ocean-300">
              See all
            </Link>
          </div>
          <div className="space-y-2.5">
            {statuses.length === 0 && (
              <p className="glass-card rounded-xl2 p-4 text-sm text-white/60">
                Nothing needed from you right now — enjoy the anticipation. 🥂
              </p>
            )}
            {statuses.slice(0, 5).map(({ request, response }) => (
              <ActionCard
                key={request.id}
                icon={requestIcon(request)}
                title={request.title}
                status={response ? 'completed' : request.is_required ? 'required' : 'optional-open'}
                href="/actions"
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/my-cruise" className="glass-card rounded-xl2 p-4">
            <p className="text-2xl">🛳️</p>
            <p className="mt-1 font-medium text-white">Cruise Information</p>
            <p className="text-xs text-white/50">View Details</p>
          </Link>
          <Link href="/activities" className="glass-card rounded-xl2 p-4">
            <p className="text-2xl">🎉</p>
            <p className="mt-1 font-medium text-white">Party Activities</p>
            <p className="text-xs text-white/50">Explore</p>
          </Link>
          <Link href="/guide" className="glass-card rounded-xl2 p-4">
            <p className="text-2xl">📱</p>
            <p className="mt-1 font-medium text-white">Cruise App</p>
            <p className="text-xs text-white/50">Setup Guide</p>
          </Link>
          <Link href="/packing" className="glass-card rounded-xl2 p-4">
            <p className="text-2xl">🧳</p>
            <p className="mt-1 font-medium text-white">Packing List</p>
            <p className="text-xs text-white/50">Check it off</p>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

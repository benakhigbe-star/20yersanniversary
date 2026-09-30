import Image from 'next/image';
import Link from 'next/link';
import { PartyPopper, CalendarDays, Luggage, Smartphone, MapPin } from 'lucide-react';
import { LoginForm } from '@/components/login-form';
import { Countdown } from '@/components/countdown';
import { getCurrentEvent } from '@/lib/event';
import { getItineraryDays, getActivities } from '@/lib/guest-data';

// Without this, Next.js prerenders this page once at build time and freezes
// whatever the event's name/cruise line were at that moment — admin edits
// via Settings would silently never appear until the next deploy.
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const event = await getCurrentEvent().catch(() => null);
  const itineraryDays = event ? await getItineraryDays(event.id).catch(() => []) : [];
  const activities = event ? await getActivities(event.id).catch(() => []) : [];

  const ports = itineraryDays.filter((d) => !/day at sea/i.test(d.port_name)).length;
  const stats = [
    { value: itineraryDays.length, label: itineraryDays.length === 1 ? 'Day' : 'Days' },
    { value: ports, label: ports === 1 ? 'Port of Call' : 'Ports of Call' },
    { value: activities.length, label: activities.length === 1 ? 'Activity' : 'Activities' },
  ].filter((s) => s.value > 0);

  const departureIso =
    event?.departure_date && event?.departure_time
      ? `${event.departure_date}T${event.departure_time}`
      : event?.departure_date
        ? `${event.departure_date}T00:00:00`
        : null;

  const previewItems = [
    { icon: PartyPopper, label: 'Party Activities' },
    { icon: CalendarDays, label: 'Full Schedule' },
    { icon: Luggage, label: 'Packing Checklist' },
    { icon: Smartphone, label: 'Cruise App Guide' },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-ocean-gradient">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {event?.hero_image_url && (
          <div className="absolute inset-0">
            <Image src={event.hero_image_url} alt="" fill priority className="object-cover opacity-30" unoptimized />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(253,100,20,0.25),transparent_50%)]" />

        <div className="relative mx-auto max-w-md px-6 pb-10 pt-14 text-center">
          <div className="animate-fade-up mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl backdrop-blur">
            🛳️
          </div>
          <p className="animate-fade-up text-sm uppercase tracking-[0.3em] text-white/70">You&apos;re invited to</p>
          <h1
            className="animate-fade-up mt-2 font-display text-4xl font-bold leading-tight text-white drop-shadow-sm"
            style={{ animationDelay: '60ms' }}
          >
            {event?.name ?? 'Our Cruise Party'}
          </h1>
          {event?.cruise_name && (
            <p className="animate-fade-up mt-3 text-white/80" style={{ animationDelay: '100ms' }}>
              {event.cruise_name}
              {event.ship_name ? ` · ${event.ship_name}` : ''}
            </p>
          )}

          {departureIso && (
            <div className="animate-fade-up mt-6" style={{ animationDelay: '140ms' }}>
              <Countdown targetIso={departureIso} />
            </div>
          )}
        </div>
      </section>

      {/* Stats strip — real numbers from this cruise, not filler copy */}
      {stats.length > 0 && (
        <section className="relative border-y border-white/15 bg-black/10">
          <div className="mx-auto grid max-w-md grid-cols-3 divide-x divide-white/15 px-6 py-5 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold text-white">{s.value}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="relative mx-auto max-w-md rounded-t-3xl bg-white px-6 py-10">
        {/* What's inside preview */}
        <div className="mb-3 flex items-center gap-2 text-slate-500">
          <MapPin size={14} />
          <p className="text-xs font-semibold uppercase tracking-wide">What&apos;s waiting for you inside</p>
        </div>
        <div className="mb-10 grid grid-cols-2 gap-3">
          {previewItems.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-xl2 border border-slate-200 bg-slate-50 p-3.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ocean-100 text-ocean-700">
                <Icon size={17} />
              </div>
              <p className="text-sm font-medium text-slate-900">{label}</p>
            </div>
          ))}
        </div>

        {/* Login */}
        <div id="login" className="animate-fade-up rounded-xl2 border border-slate-200 bg-slate-50 p-6">
          <h2 className="font-display text-xl font-semibold text-slate-900">Enter the party</h2>
          <p className="mt-1 text-sm text-slate-600">
            Use the email address your invite came from — no password needed.
          </p>
          <LoginForm />
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Not on the list yet?{' '}
          <Link href="/invitation" className="font-medium text-ocean-700 underline decoration-ocean-300 underline-offset-2">
            Request an invite
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

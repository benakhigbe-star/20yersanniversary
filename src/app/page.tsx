import { LoginForm } from '@/components/login-form';
import { getCurrentEvent } from '@/lib/event';

// Without this, Next.js prerenders this page once at build time and freezes
// whatever the event's name/cruise line were at that moment — admin edits
// via Settings would silently never appear until the next deploy.
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const event = await getCurrentEvent().catch(() => null);

  return (
    <main className="relative min-h-screen overflow-hidden bg-ocean-gradient">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(253,100,20,0.25),transparent_50%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-between px-6 py-12">
        <div className="animate-fade-up text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl backdrop-blur">
            🛳️
          </div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">You&apos;re invited to</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-white drop-shadow-sm">
            {event?.name ?? 'Our Cruise Party'}
          </h1>
          {event?.cruise_name && (
            <p className="mt-3 text-white/80">
              {event.cruise_name}
              {event.ship_name ? ` · ${event.ship_name}` : ''}
            </p>
          )}
        </div>

        <div className="animate-fade-up glass-card mt-10 rounded-xl2 p-6" style={{ animationDelay: '120ms' }}>
          <h2 className="font-display text-xl font-semibold text-white">Enter the party</h2>
          <p className="mt-1 text-sm text-white/70">
            Use the email address your invite came from — no password needed.
          </p>
          <LoginForm />
        </div>

        <p className="animate-fade-up mt-10 text-center text-xs text-white/50" style={{ animationDelay: '220ms' }}>
          Not on the list yet? Contact the organiser to get added.
        </p>
      </div>
    </main>
  );
}

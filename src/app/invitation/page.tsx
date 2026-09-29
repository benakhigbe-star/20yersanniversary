import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { InvitationForm } from '@/components/invitation-form';
import { getCurrentEvent } from '@/lib/event';

export const dynamic = 'force-dynamic';

export default async function InvitationPage() {
  const event = await getCurrentEvent().catch(() => null);

  return (
    <main className="relative min-h-screen overflow-hidden bg-ocean-gradient">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(253,100,20,0.25),transparent_50%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12">
        <Link href="/" className="animate-fade-up flex items-center gap-1.5 text-sm text-white/70">
          <ArrowLeft size={16} /> Back to login
        </Link>

        <div className="animate-fade-up mt-8 text-center" style={{ animationDelay: '40ms' }}>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl backdrop-blur">
            ✉️
          </div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">Not on the list yet?</p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-white drop-shadow-sm">
            Request an Invite
          </h1>
          <p className="mt-3 text-sm text-white/80">
            {event?.name ? `Let the organiser know you'd like to join ${event.name}.` : "Let the organiser know you'd like to join."}
          </p>
        </div>

        <div className="animate-fade-up glass-card mt-8 rounded-xl2 p-6" style={{ animationDelay: '100ms' }}>
          <InvitationForm />
        </div>

        <p className="animate-fade-up mt-10 text-center text-xs text-white/50" style={{ animationDelay: '160ms' }}>
          Already approved? Go back and log in with your email.
        </p>
      </div>
    </main>
  );
}

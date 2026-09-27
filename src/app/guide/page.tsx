import { getGuestContext, getAppGuide } from '@/lib/guest-data';
import { PageShell } from '@/components/page-shell';
import { GuestHeader } from '@/components/guest-header';
import { InstallPwaGuide } from '@/components/install-pwa-guide';
import { Apple, Smartphone } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GuidePage() {
  const { event } = await getGuestContext();
  const appGuide = await getAppGuide(event.id);

  return (
    <PageShell>
      <GuestHeader title="Cruise & App Guide" subtitle="Get set up before you sail" />
      <div className="space-y-6 px-5 pt-5">
        {appGuide && (
          <section className="glass-card rounded-xl2 p-5">
            <h2 className="font-display text-xl font-semibold text-white">{appGuide.guide.app_name}</h2>
            {appGuide.guide.intro_description && (
              <p className="mt-1 text-sm text-white/60">{appGuide.guide.intro_description}</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {appGuide.guide.app_store_url && (
                <a
                  href={appGuide.guide.app_store_url}
                  target="_blank"
                  rel="noreferrer"
                  className="tap-target flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-black"
                >
                  <Apple size={16} /> App Store
                </a>
              )}
              {appGuide.guide.google_play_url && (
                <a
                  href={appGuide.guide.google_play_url}
                  target="_blank"
                  rel="noreferrer"
                  className="tap-target flex items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white"
                >
                  <Smartphone size={16} /> Google Play
                </a>
              )}
            </div>

            {appGuide.steps.length > 0 && (
              <ol className="mt-5 space-y-3">
                {appGuide.steps.map((step) => (
                  <li key={step.id} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ocean-500/30 text-xs font-bold text-ocean-100">
                      {step.step_number}
                    </span>
                    <div>
                      <p className="font-medium text-white">{step.title}</p>
                      {step.description && <p className="text-sm text-white/60">{step.description}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {appGuide.features.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Useful Features</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {appGuide.features.map((f) => (
                    <li key={f.id} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {appGuide.tips.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Tips</p>
                {appGuide.tips.map((t) => (
                  <p key={t.id} className="text-sm text-white/70">
                    💡 {t.tip}
                  </p>
                ))}
              </div>
            )}
          </section>
        )}

        <InstallPwaGuide />
      </div>
    </PageShell>
  );
}

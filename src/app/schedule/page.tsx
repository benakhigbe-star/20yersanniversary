import { getGuestContext, getScheduleItems } from '@/lib/guest-data';
import { PageShell } from '@/components/page-shell';
import { GuestHeader } from '@/components/guest-header';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const { event } = await getGuestContext();
  const items = await getScheduleItems(event.id);

  const byDay = new Map<number, typeof items>();
  for (const item of items) {
    const list = byDay.get(item.day_number) ?? [];
    list.push(item);
    byDay.set(item.day_number, list);
  }

  return (
    <PageShell>
      <GuestHeader title="Our Party Schedule" subtitle="Where to be and when" />
      <div className="space-y-6 px-5 pt-5">
        {items.length === 0 && (
          <p className="glass-card rounded-xl2 p-4 text-sm text-white/60">The schedule will be published soon.</p>
        )}
        {Array.from(byDay.entries()).map(([day, list]) => (
          <section key={day}>
            <div className="mb-3 inline-block rounded-full bg-ocean-500/25 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ocean-200">
              {list[0]?.day_label || `Day ${day}`}
            </div>
            <ol className="relative space-y-4 border-l border-white/10 pl-5">
              {list
                .sort((a, b) => a.display_order - b.display_order)
                .map((item) => (
                  <li key={item.id} className="relative">
                    <span className="absolute -left-[27px] flex h-6 w-6 items-center justify-center rounded-full bg-midnight-900 text-sm ring-2 ring-ocean-400/60">
                      {item.icon ?? '•'}
                    </span>
                    <div className="glass-card rounded-xl2 p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-white">{item.title}</p>
                        {item.item_time && <p className="text-xs font-semibold text-ocean-300">{item.item_time}</p>}
                      </div>
                      {item.description && <p className="mt-1 text-sm text-white/60">{item.description}</p>}
                    </div>
                  </li>
                ))}
            </ol>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

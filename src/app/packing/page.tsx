import { getGuestContext, getMasterPackingList, getGuestPackingStatus } from '@/lib/guest-data';
import { PageShell } from '@/components/page-shell';
import { GuestHeader } from '@/components/guest-header';
import { PackingChecklist } from '@/components/packing-checklist';

export const dynamic = 'force-dynamic';

export default async function PackingPage() {
  const { guest, event } = await getGuestContext();
  const items = await getMasterPackingList(event.id);
  const statuses = await getGuestPackingStatus(guest.id);
  const initialChecked = Object.fromEntries(statuses.map((s) => [s.packing_item_id, s.is_checked]));

  return (
    <PageShell>
      <GuestHeader title="Packing Checklist" subtitle="Tick off as you pack" />
      <div className="px-5 pt-5">
        {items.length === 0 ? (
          <p className="glass-card rounded-xl2 p-4 text-sm text-white/60">The packing list will appear here soon.</p>
        ) : (
          <PackingChecklist items={items} initialChecked={initialChecked} />
        )}
      </div>
    </PageShell>
  );
}

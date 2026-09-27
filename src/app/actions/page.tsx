import {
  getGuestContext,
  getActiveRequestsWithOptions,
  getGuestResponses,
  getGuestResponseOptionIds,
} from '@/lib/guest-data';
import { PageShell } from '@/components/page-shell';
import { GuestHeader } from '@/components/guest-header';
import { RequestForm } from '@/components/request-form';

export const dynamic = 'force-dynamic';

export default async function ActionsPage() {
  const { guest, event } = await getGuestContext();
  const { requests, optionsByRequest } = await getActiveRequestsWithOptions(event.id);
  const responses = await getGuestResponses(guest.id);
  const responseOptionIds = await getGuestResponseOptionIds(responses.map((r) => r.id));
  const responseByRequest = new Map(responses.map((r) => [r.request_id, r]));

  const sorted = [...requests].sort((a, b) => a.display_order - b.display_order);
  const outstanding = sorted.filter((r) => r.is_required && !responseByRequest.get(r.id));

  return (
    <PageShell>
      <GuestHeader
        title="Your Actions"
        subtitle={
          outstanding.length > 0
            ? `${outstanding.length} thing${outstanding.length === 1 ? '' : 's'} still need your input`
            : 'All caught up ✓'
        }
      />
      <div className="space-y-3 px-5 pt-5">
        {sorted.length === 0 && (
          <p className="glass-card rounded-xl2 p-4 text-sm text-white/60">
            No information requests yet — check back soon.
          </p>
        )}
        {sorted.map((request) => {
          const response = responseByRequest.get(request.id) ?? null;
          return (
            <RequestForm
              key={request.id}
              request={request}
              options={optionsByRequest.get(request.id) ?? []}
              initialResponse={response}
              initialSelectedOptionIds={response ? responseOptionIds.get(response.id) ?? [] : []}
            />
          );
        })}
      </div>
    </PageShell>
  );
}

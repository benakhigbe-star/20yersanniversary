import Link from 'next/link';
import {
  getGuestContext,
  getEventSettingsCached,
  getItineraryDays,
  getUsefulLinks,
  getActiveRequestsWithOptions,
  getGuestResponses,
  getGuestResponseOptionIds,
  getMasterPackingList,
  getGuestPackingStatus,
} from '@/lib/guest-data';
import { buildRequestStatuses } from '@/lib/profile';
import { answerSummary } from '@/lib/request-display';
import { PageShell } from '@/components/page-shell';
import { GuestHeader } from '@/components/guest-header';
import { formatDate, initials } from '@/lib/utils';
import { MapPin, FileText, Luggage, Shirt, AlertTriangle, ExternalLink, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MyCruisePage() {
  const { guest, event } = await getGuestContext();
  const settings = await getEventSettingsCached(event.id);
  const itinerary = await getItineraryDays(event.id);
  const links = await getUsefulLinks(event.id);

  const { requests, optionsByRequest } = await getActiveRequestsWithOptions(event.id);
  const responses = await getGuestResponses(guest.id);
  const responseOptionIds = await getGuestResponseOptionIds(responses.map((r) => r.id));
  const statuses = buildRequestStatuses(requests, responses);

  const clothingStatuses = statuses.filter((s) => s.request.config?.category === 'clothing');
  const otherAnswered = statuses.filter((s) => s.request.config?.category !== 'clothing' && s.response);
  const outstanding = statuses.filter((s) => s.isOutstanding);

  const packingItems = await getMasterPackingList(event.id);
  const packingStatus = await getGuestPackingStatus(guest.id);
  const packedCount = packingStatus.filter((p) => p.is_checked).length;

  return (
    <PageShell>
      <GuestHeader title="My Cruise" subtitle="Everything about you, in one place" />

      <div className="space-y-6 px-5 pt-5">
        {/* My Details */}
        <section className="glass-card rounded-xl2 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ocean-500/30 font-display text-lg font-bold text-white">
              {initials(guest.first_name, guest.last_name)}
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-white">
                {guest.preferred_name || guest.first_name} {guest.last_name}
              </p>
              <p className="text-sm text-white/60">{guest.email}</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Detail label="Group" value={guest.group_name} />
            <Detail label="Cabin" value={guest.cabin_number} />
            <Detail label="Booking Ref" value={guest.booking_reference} />
            <Detail label="Phone" value={guest.phone} />
          </dl>
          <p className="mt-3 text-xs text-white/40">
            Spotted a mistake in these details? Contact the organiser to have it updated.
          </p>
        </section>

        {/* Outstanding actions */}
        {outstanding.length > 0 && (
          <section>
            <SectionTitle icon={<AlertTriangle size={16} />} title="My Outstanding Actions" href="/actions" />
            <div className="glass-card space-y-2 rounded-xl2 p-4">
              {outstanding.map((s) => (
                <p key={s.request.id} className="text-sm text-white/80">
                  • {s.request.title}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Clothing sizes */}
        <section>
          <SectionTitle icon={<Shirt size={16} />} title="My Clothing Sizes" href="/actions" />
          <div className="glass-card divide-y divide-white/10 rounded-xl2 px-4">
            {clothingStatuses.length === 0 && <p className="py-3 text-sm text-white/50">None configured yet.</p>}
            {clothingStatuses.map(({ request, response }) => (
              <div key={request.id} className="flex items-center justify-between py-3">
                <p className="text-sm text-white/80">{request.title}</p>
                <p className="text-sm font-medium text-white">
                  {response
                    ? answerSummary(request, response, optionsByRequest.get(request.id) ?? [], responseOptionIds.get(response.id) ?? [])
                    : '—'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {otherAnswered.length > 0 && (
          <section>
            <SectionTitle icon={<FileText size={16} />} title="My Other Info" href="/actions" />
            <div className="glass-card divide-y divide-white/10 rounded-xl2 px-4">
              {otherAnswered.map(({ request, response }) => (
                <div key={request.id} className="flex items-center justify-between gap-3 py-3">
                  <p className="text-sm text-white/80">{request.title}</p>
                  <p className="max-w-[55%] truncate text-right text-sm font-medium text-white">
                    {response
                      ? answerSummary(request, response, optionsByRequest.get(request.id) ?? [], responseOptionIds.get(response.id) ?? [])
                      : '—'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* My Checklist */}
        <section>
          <SectionTitle icon={<Luggage size={16} />} title="My Checklist" href="/packing" />
          <Link href="/packing" className="glass-card flex items-center justify-between rounded-xl2 p-4">
            <p className="text-sm text-white/80">
              Packed {packedCount} of {packingItems.length} items
            </p>
            <ChevronRight size={16} className="text-white/30" />
          </Link>
        </section>

        {/* Cruise info hub */}
        <section>
          <SectionTitle icon={<MapPin size={16} />} title="My Cruise Information" />
          <div className="glass-card space-y-3 rounded-xl2 p-5">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Ship" value={event.ship_name} />
              <Detail label="Cruise Line" value={event.cruise_line} />
              <Detail label="Departure Port" value={event.departure_port} />
              <Detail
                label="Departs"
                value={event.departure_date ? `${formatDate(event.departure_date)} ${event.departure_time ?? ''}` : null}
              />
              <Detail label="Returns" value={event.return_date ? formatDate(event.return_date) : null} />
              <Detail label="Return Port" value={event.return_port} />
            </dl>

            {settings?.destinations && <InfoBlock label="Destinations" text={settings.destinations} />}

            {itinerary.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Itinerary</p>
                <ul className="mt-1.5 space-y-1.5">
                  {itinerary.map((day) => (
                    <li key={day.id} className="flex justify-between text-sm text-white/80">
                      <span>
                        Day {day.day_number} · {day.port_name}
                      </span>
                      <span className="text-white/50">{day.date ? formatDate(day.date) : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {settings?.boarding_info && <InfoBlock label="Boarding Information" text={settings.boarding_info} />}
            {settings?.baggage_info && <InfoBlock label="Baggage Information" text={settings.baggage_info} />}
            {settings?.dress_codes && <InfoBlock label="Dress Codes" text={settings.dress_codes} />}
            {settings?.important_reminders && (
              <InfoBlock label="Important Reminders" text={settings.important_reminders} />
            )}
            {settings?.documents_info && <InfoBlock label="Documents You'll Need" text={settings.documents_info} />}
          </div>
        </section>

        {/* Useful links */}
        {links.length > 0 && (
          <section>
            <SectionTitle icon={<FileText size={16} />} title="Useful Links & Documents" />
            <div className="space-y-2">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-card flex items-center gap-3 rounded-xl2 p-3.5"
                >
                  <span className="text-xl">{link.icon ?? '🔗'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{link.title}</p>
                    {link.description && <p className="truncate text-xs text-white/50">{link.description}</p>}
                  </div>
                  <ExternalLink size={14} className="shrink-0 text-white/30" />
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-white/40">{label}</dt>
      <dd className="text-white/90">{value || '—'}</dd>
    </div>
  );
}

function InfoBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm text-white/80">{text}</p>
    </div>
  );
}

function SectionTitle({ icon, title, href }: { icon: React.ReactNode; title: string; href?: string }) {
  const content = (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
        {icon}
        {title}
      </h2>
      {href && <ChevronRight size={16} className="text-white/30" />}
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

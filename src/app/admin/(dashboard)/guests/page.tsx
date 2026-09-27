import { getAdminContext } from '@/lib/admin-data';
import { GuestsManager } from '@/components/admin/guests-manager';

export const dynamic = 'force-dynamic';

export default async function AdminGuestsPage() {
  await getAdminContext();
  return <GuestsManager />;
}

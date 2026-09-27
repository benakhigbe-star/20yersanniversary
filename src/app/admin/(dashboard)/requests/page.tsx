import { getAdminContext } from '@/lib/admin-data';
import { RequestsManager } from '@/components/admin/requests-manager';

export const dynamic = 'force-dynamic';

export default async function AdminRequestsPage() {
  await getAdminContext();
  return <RequestsManager />;
}

import { getAdminContext } from '@/lib/admin-data';
import { ActivitiesManager } from '@/components/admin/activities-manager';

export const dynamic = 'force-dynamic';

export default async function AdminActivitiesPage() {
  await getAdminContext();
  return <ActivitiesManager />;
}

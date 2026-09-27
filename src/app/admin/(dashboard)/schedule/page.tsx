import { getAdminContext } from '@/lib/admin-data';
import { ScheduleManager } from '@/components/admin/schedule-manager';

export const dynamic = 'force-dynamic';

export default async function AdminSchedulePage() {
  await getAdminContext();
  return <ScheduleManager />;
}

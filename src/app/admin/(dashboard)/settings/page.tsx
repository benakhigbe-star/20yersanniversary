import { getAdminContext } from '@/lib/admin-data';
import { SettingsManager } from '@/components/admin/settings-manager';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  await getAdminContext();
  return <SettingsManager />;
}

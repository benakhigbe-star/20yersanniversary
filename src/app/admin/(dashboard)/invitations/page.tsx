import { getAdminContext } from '@/lib/admin-data';
import { InvitationsManager } from '@/components/admin/invitations-manager';

export const dynamic = 'force-dynamic';

export default async function AdminInvitationsPage() {
  await getAdminContext();
  return <InvitationsManager />;
}

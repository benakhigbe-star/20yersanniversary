import { getAdminContext } from '@/lib/admin-data';
import { ContentManager } from '@/components/admin/content/content-manager';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage({ searchParams }: { searchParams: { tab?: string } }) {
  await getAdminContext();
  return <ContentManager initialTab={searchParams.tab} />;
}

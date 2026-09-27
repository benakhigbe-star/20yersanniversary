import { getAdminSession } from '@/lib/auth/admin';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 lg:flex">
      <AdminSidebar adminName={session?.name ?? 'Admin'} adminEmail={session?.email ?? ''} />
      <main className="flex-1 lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">{children}</div>
      </main>
    </div>
  );
}

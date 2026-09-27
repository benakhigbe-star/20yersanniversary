'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function GuestHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <header className="flex items-start justify-between px-5 pt-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-white/60">{subtitle}</p>}
      </div>
      <button
        onClick={handleLogout}
        className="tap-target flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/20"
      >
        <LogOut size={15} />
        Logout
      </button>
    </header>
  );
}

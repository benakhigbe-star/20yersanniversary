'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ListChecks,
  BarChart3,
  PartyPopper,
  CalendarDays,
  BookOpen,
  Megaphone,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/guests', label: 'Guests', icon: Users },
  { href: '/admin/invitations', label: 'Invitation Requests', icon: UserPlus },
  { href: '/admin/requests', label: 'Information Requests', icon: ListChecks },
  { href: '/admin/responses', label: 'Responses', icon: BarChart3 },
  { href: '/admin/activities', label: 'Activities', icon: PartyPopper },
  { href: '/admin/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/admin/content', label: 'Cruise Guide & Content', icon: BookOpen },
  { href: '/admin/content?tab=announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({ adminName, adminEmail }: { adminName: string; adminEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const content = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6">
        <p className="text-lg font-bold text-white">⚓ Admin Portal</p>
        <p className="mt-0.5 truncate text-xs text-slate-400">{adminEmail}</p>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href.split('?')[0];
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                active ? 'bg-ocean-500/20 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-3">
        <p className="px-2 text-xs text-slate-500">Signed in as</p>
        <p className="truncate px-2 text-sm font-medium text-white">{adminName}</p>
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 lg:hidden">
        <p className="font-bold text-white">⚓ Admin Portal</p>
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-300">
          <Menu size={22} />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-64 bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 p-2 text-slate-400">
              <X size={20} />
            </button>
            {content}
          </div>
        </div>
      )}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-slate-900 lg:block">
        {content}
      </aside>
    </>
  );
}

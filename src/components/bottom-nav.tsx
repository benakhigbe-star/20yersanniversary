'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListChecks, PartyPopper, CalendarDays, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/actions', label: 'To-Do', icon: ListChecks },
  { href: '/activities', label: 'Activities', icon: PartyPopper },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/my-cruise', label: 'More', icon: Menu },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-midnight-950/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'tap-target flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  active ? 'text-ocean-300' : 'text-white/50 hover:text-white/80'
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

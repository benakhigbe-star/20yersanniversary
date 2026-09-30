'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

function getParts(targetMs: number) {
  const diff = Math.max(0, targetMs - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, done: diff <= 0 };
}

export function Countdown({
  targetIso,
  label,
  variant = 'sunset',
}: {
  targetIso: string | null;
  label?: string;
  /** 'sunset' (default) is the orange gradient card used on dark backgrounds.
   * 'light' is a white/black card for use on light backgrounds. */
  variant?: 'sunset' | 'light';
}) {
  const targetMs = targetIso ? new Date(targetIso).getTime() : null;
  const [parts, setParts] = useState(() => (targetMs ? getParts(targetMs) : null));

  useEffect(() => {
    if (!targetMs) return;
    setParts(getParts(targetMs));
    const id = setInterval(() => setParts(getParts(targetMs)), 1000 * 30);
    return () => clearInterval(id);
  }, [targetMs]);

  if (!targetMs || !parts) return null;

  const cells = [
    { value: parts.days, unit: 'Days' },
    { value: parts.hours, unit: 'Hrs' },
    { value: parts.minutes, unit: 'Min' },
  ];

  const isLight = variant === 'light';

  return (
    <div
      className={cn(
        'animate-fade-up rounded-xl2 p-5 text-center',
        isLight ? 'border border-slate-200 bg-white shadow-sm' : 'bg-sunset-gradient shadow-glow'
      )}
    >
      <p
        className={cn(
          'text-xs font-semibold uppercase tracking-[0.25em]',
          isLight ? 'text-slate-500' : 'text-white/80'
        )}
      >
        {label ?? 'Our Cruise Starts In'}
      </p>
      {parts.done ? (
        <p className={cn('mt-3 font-display text-2xl font-bold', isLight ? 'text-slate-900' : 'text-white')}>
          Bon Voyage! 🎉
        </p>
      ) : (
        <div className="mt-3 flex justify-center gap-3">
          {cells.map((c) => (
            <div
              key={c.unit}
              className={cn(
                'min-w-[64px] rounded-xl px-3 py-2',
                isLight ? 'border border-slate-200 bg-slate-50' : 'bg-white/15 backdrop-blur'
              )}
            >
              <div
                className={cn(
                  'font-display text-2xl font-bold tabular-nums',
                  isLight ? 'text-slate-900' : 'text-white'
                )}
              >
                {String(c.value).padStart(2, '0')}
              </div>
              <div className={cn('text-[10px] uppercase tracking-wide', isLight ? 'text-slate-500' : 'text-white/70')}>
                {c.unit}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

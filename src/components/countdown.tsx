'use client';

import { useEffect, useState } from 'react';

function getParts(targetMs: number) {
  const diff = Math.max(0, targetMs - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, done: diff <= 0 };
}

export function Countdown({ targetIso, label }: { targetIso: string | null; label?: string }) {
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

  return (
    <div className="animate-fade-up rounded-xl2 bg-sunset-gradient p-5 text-center shadow-glow">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
        {label ?? 'Our Cruise Starts In'}
      </p>
      {parts.done ? (
        <p className="mt-3 font-display text-2xl font-bold text-white">Bon Voyage! 🎉</p>
      ) : (
        <div className="mt-3 flex justify-center gap-3">
          {cells.map((c) => (
            <div key={c.unit} className="min-w-[64px] rounded-xl bg-white/15 px-3 py-2 backdrop-blur">
              <div className="font-display text-2xl font-bold tabular-nums text-white">
                {String(c.value).padStart(2, '0')}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-white/70">{c.unit}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

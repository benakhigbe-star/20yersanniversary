export function ProgressBar({ percent, label }: { percent: number; label?: string }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="glass-card rounded-xl2 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-white/80">{label ?? 'Your Cruise Party Profile'}</p>
        <p className="font-display text-xl font-bold text-white">{clamped}%</p>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-ocean-400 to-champagne-400 transition-all duration-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-white/50">
        {clamped === 100 ? 'All set — see you onboard! 🥂' : 'Complete every action for full marks.'}
      </p>
    </div>
  );
}

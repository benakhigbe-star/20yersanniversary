import { BottomNav } from './bottom-nav';

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-midnight-950 bg-[radial-gradient(circle_at_50%_-10%,rgba(18,163,240,0.25),transparent_55%)] pb-28">
      <div className="mx-auto max-w-md">{children}</div>
      <BottomNav />
    </div>
  );
}

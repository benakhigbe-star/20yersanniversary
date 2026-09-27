import Link from 'next/link';
import { CheckCircle2, AlertCircle, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'completed' | 'required' | 'optional-open';

export function ActionCard({
  icon,
  title,
  status,
  detail,
  href,
}: {
  icon: string;
  title: string;
  status: Status;
  detail?: string;
  href: string;
}) {
  const config: Record<Status, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
    completed: { label: 'Completed', className: 'text-green-300', Icon: CheckCircle2 },
    required: { label: 'Action Required', className: 'text-sunset-300', Icon: AlertCircle },
    'optional-open': { label: 'Not Completed', className: 'text-white/50', Icon: Circle },
  };
  const { label, className, Icon } = config[status];

  return (
    <Link
      href={href}
      className="glass-card flex items-center gap-3 rounded-xl2 p-4 transition active:scale-[0.98]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">{title}</p>
        <p className={cn('flex items-center gap-1 text-xs', className)}>
          <Icon size={13} />
          {detail ?? label}
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-white/30" />
    </Link>
  );
}

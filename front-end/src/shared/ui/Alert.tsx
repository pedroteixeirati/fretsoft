import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

type AlertTone = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const toneMap = {
  info: {
    wrapper: 'border-primary/20 bg-primary/10 text-on-surface',
    icon: Info,
    iconClass: 'text-primary',
  },
  success: {
    wrapper: 'border-primary/20 bg-primary-fixed/45 text-on-surface',
    icon: CheckCircle2,
    iconClass: 'text-primary',
  },
  warning: {
    wrapper: 'border-secondary/20 bg-secondary-container/35 text-on-surface',
    icon: AlertTriangle,
    iconClass: 'text-secondary',
  },
  danger: {
    wrapper: 'border-error/20 bg-error/10 text-on-surface',
    icon: XCircle,
    iconClass: 'text-error',
  },
} satisfies Record<AlertTone, { wrapper: string; icon: React.ElementType; iconClass: string }>;

export default function Alert({ tone = 'info', title, children, className }: AlertProps) {
  const config = toneMap[tone];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-2xl border p-4', config.wrapper, className)}>
      <div className="flex gap-3">
        <Icon className={cn('mt-0.5 h-4.5 w-4.5 shrink-0', config.iconClass)} />
        <div className="min-w-0">
          {title ? <p className="text-xs font-black uppercase tracking-[0.16em]">{title}</p> : null}
          <div className={cn(title ? 'mt-1 text-sm leading-relaxed text-on-surface-variant' : 'text-sm leading-relaxed text-on-surface-variant')}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

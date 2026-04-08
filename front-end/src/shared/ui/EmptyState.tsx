import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('rounded-[2rem] border border-outline-variant bg-surface-container-lowest px-6 py-10 text-center', className)}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-on-surface">{title}</h3>
      {description ? <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{description}</p> : null}
    </div>
  );
}

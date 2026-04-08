import React from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">{title}</h1>
        {description ? <p className="mt-2 text-on-surface-variant">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}

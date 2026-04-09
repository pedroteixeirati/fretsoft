import React from 'react';
import { cn } from '../../lib/utils';

interface FieldLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export default function FieldLabel({
  children,
  htmlFor,
  required = false,
  className,
}: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'block pl-1 text-xs font-medium uppercase tracking-[0.18em] text-on-surface',
        className,
      )}
    >
      <span>{children}</span>
      {required ? <span className="ml-1 text-error">*</span> : null}
    </label>
  );
}

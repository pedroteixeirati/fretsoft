import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FormAlertProps {
  message?: string;
  variant?: 'error' | 'success' | 'info';
  className?: string;
}

export default function FormAlert({
  message,
  variant = 'error',
  className,
}: FormAlertProps) {
  if (!message) return null;

  const Icon = variant === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[1.6rem] border px-4 py-3.5 text-sm shadow-sm',
        variant === 'error' && 'border-error/15 bg-error/[0.06] text-error',
        variant === 'success' && 'border-primary/15 bg-primary/[0.06] text-primary',
        variant === 'info' && 'border-outline-variant/30 bg-surface-container-low text-on-surface',
        className,
      )}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="font-medium leading-6">{message}</p>
    </div>
  );
}

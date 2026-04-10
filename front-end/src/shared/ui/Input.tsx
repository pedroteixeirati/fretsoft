import React from 'react';
import { cn } from '../../lib/utils';
import FieldLabel from '../forms/FieldLabel';
import FormFieldError from '../forms/FormFieldError';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export default function Input({
  label,
  containerClassName,
  className,
  id,
  error,
  hint,
  leftIcon,
  ...props
}: InputProps) {
  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label ? (
        <FieldLabel htmlFor={id} required={Boolean(props.required)}>
          {label}
        </FieldLabel>
      ) : null}
      <div
        className={cn(
          'flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 ring-1 transition-all focus-within:ring-2 focus-within:ring-primary/20',
          error ? 'ring-error/35 focus-within:ring-error/20' : 'ring-primary/5',
        )}
      >
        {leftIcon ? <span className="shrink-0 text-on-surface-variant">{leftIcon}</span> : null}
        <input
          id={id}
          className={cn(
            'w-full bg-transparent text-on-surface outline-none placeholder:text-on-surface-variant/65',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </div>
      <FormFieldError message={error} />
      {!error && hint ? <p className="pl-1 text-xs text-on-surface-variant">{hint}</p> : null}
    </div>
  );
}

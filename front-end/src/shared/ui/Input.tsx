import React from 'react';
import { cn } from '../../lib/utils';
import FieldLabel from '../forms/FieldLabel';
import FormFieldError from '../forms/FormFieldError';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
  error?: string;
  hint?: string;
}

export default function Input({ label, containerClassName, className, id, error, hint, ...props }: InputProps) {
  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label ? (
        <FieldLabel htmlFor={id} required={Boolean(props.required)}>
          {label}
        </FieldLabel>
      ) : null}
      <input
        id={id}
        className={cn(
          'w-full rounded-2xl bg-surface px-4 py-3.5 text-on-surface outline-none ring-1 transition-all placeholder:text-on-surface-variant/65 focus:ring-2 focus:ring-primary/20',
          error ? 'ring-error/35 focus:ring-error/20' : 'ring-primary/5',
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      <FormFieldError message={error} />
      {!error && hint ? <p className="pl-1 text-xs text-on-surface-variant">{hint}</p> : null}
    </div>
  );
}

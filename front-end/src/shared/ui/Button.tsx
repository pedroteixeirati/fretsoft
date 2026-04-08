import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-on-primary shadow-[0_16px_26px_rgba(82,102,0,0.18)] hover:brightness-105',
  secondary: 'bg-surface-container text-on-surface border border-outline-variant hover:bg-surface-container-high',
  ghost: 'bg-transparent text-on-surface hover:bg-surface-container',
  danger: 'bg-error text-on-error hover:brightness-105',
};

export default function Button({
  type = 'button',
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

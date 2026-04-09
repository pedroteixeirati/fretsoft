import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import FormFieldError from '../shared/forms/FormFieldError';

export type CustomSelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  variant?: 'field' | 'inline';
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  error?: string;
  hint?: string;
};

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  disabled = false,
  variant = 'field',
  className,
  buttonClassName,
  menuClassName,
  error,
  hint,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={rootRef} className={cn('relative min-w-0 space-y-2', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        aria-invalid={Boolean(error)}
        className={cn(
          'w-full min-w-0 transition-all disabled:cursor-not-allowed disabled:opacity-60',
          variant === 'field'
            ? 'grid grid-cols-[minmax(0,1fr)_1rem] items-center gap-3 rounded-2xl border bg-surface-container px-4 py-3.5 text-left hover:border-primary/30 focus:ring-2 focus:ring-primary/20'
            : 'inline-flex items-center gap-2 bg-transparent text-sm font-semibold text-primary focus:outline-none',
          variant === 'field' ? (error ? 'border-error/35 focus:ring-error/20' : 'border-outline-variant') : '',
          buttonClassName,
        )}
      >
        <span className={cn('min-w-0 truncate', variant === 'field' ? (selectedOption ? 'text-on-surface' : 'text-on-surface-variant') : 'text-primary')}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'shrink-0 text-on-surface-variant transition-transform',
            variant === 'field' ? 'h-4 w-4' : 'h-3.5 w-3.5 text-primary',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen ? (
        <div
          className={cn(
            'absolute left-0 top-[calc(100%+0.5rem)] z-40 min-w-full overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-[0_24px_60px_rgba(26,28,21,0.12)]',
            variant === 'inline' ? 'w-[14rem]' : 'w-full',
            menuClassName,
          )}
        >
          <div className="max-h-64 overflow-y-auto p-2">
            {options.length === 0 ? (
              <div className="rounded-xl px-3 py-2 text-sm text-on-surface-variant">Nenhuma opcao disponivel.</div>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition',
                      isSelected ? 'bg-primary text-on-primary font-semibold' : 'text-on-surface hover:bg-primary/10',
                    )}
                  >
                    {option.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {variant === 'field' && error ? <FormFieldError message={error} /> : null}
      {variant === 'field' && !error && hint ? <p className="pl-1 text-xs text-on-surface-variant">{hint}</p> : null}
    </div>
  );
}

export type { CustomSelectProps };

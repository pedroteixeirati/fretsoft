import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { CustomSelectOption } from '../../../components/CustomSelect';

interface NovalogAutocompleteSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  error?: string;
}

export default function NovalogAutocompleteSelect({
  value,
  onChange,
  options,
  placeholder = 'Digite para buscar',
  className,
  error,
}: NovalogAutocompleteSelectProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedOption = options.find((option) => option.value === value) || null;
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (isFocused) return;
    setQuery(selectedOption?.label || value || '');
  }, [isFocused, selectedOption, value]);

  const commitFreeText = (nextValue: string) => {
    const trimmed = nextValue.trim();
    onChange(trimmed);
    setQuery(trimmed);
    setIsFocused(false);
  };

  useEffect(() => {
    if (!isFocused) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        commitFreeText(query);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isFocused, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery, options]);

  const exactMatch = useMemo(
    () =>
      options.find((option) =>
        option.label.trim().toLowerCase() === normalizedQuery || option.value.trim().toLowerCase() === normalizedQuery),
    [normalizedQuery, options],
  );

  const applyOption = (option: CustomSelectOption | undefined) => {
    if (!option) return;
    onChange(option.value);
    setQuery(option.label);
    setIsFocused(false);
  };

  return (
    <div ref={rootRef} className={cn('relative min-w-0', className)}>
      <div className={cn(
        'grid w-full grid-cols-[1rem_minmax(0,1fr)] items-center gap-3 rounded-2xl border bg-surface-container px-4 py-3.5 transition focus-within:ring-2',
        error
          ? 'border-error/35 focus-within:border-error/35 focus-within:ring-error/20'
          : 'border-outline-variant focus-within:border-primary/30 focus-within:ring-primary/20',
      )}>
        <Search className="h-4 w-4 text-on-surface-variant" />
        <input
          ref={inputRef}
          value={query}
          onFocus={() => {
            setIsFocused(true);
            setActiveIndex(0);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange('');
          }}
          aria-invalid={Boolean(error)}
          onBlur={(event) => {
            if (rootRef.current?.contains(event.relatedTarget as Node | null)) {
              return;
            }

            commitFreeText(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setIsFocused(true);
              setActiveIndex((current) => Math.min(current + 1, Math.max(filteredOptions.length - 1, 0)));
              return;
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((current) => Math.max(current - 1, 0));
              return;
            }

            if (event.key === 'Enter') {
              event.preventDefault();

              if (exactMatch) {
                applyOption(exactMatch);
                return;
              }

              commitFreeText(query);
              return;
            }

            if (event.key === 'Tab') {
              if (exactMatch) {
                applyOption(exactMatch);
                return;
              }

              commitFreeText(query);
            }
          }}
          placeholder={placeholder}
          className="min-w-0 bg-transparent text-base text-on-surface outline-none placeholder:text-on-surface-variant"
        />
      </div>

      {isFocused ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-full overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-[0_24px_60px_rgba(26,28,21,0.12)]">
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredOptions.length === 0 ? (
              <div className="rounded-xl px-3 py-2 text-sm text-on-surface-variant">Nenhum resultado encontrado.</div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => applyOption(option)}
                  className={cn(
                    'flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition',
                    index === activeIndex || option.value === value
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'text-on-surface hover:bg-primary/10',
                  )}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
      {error ? <p className="mt-2 pl-1 text-xs text-error">{error}</p> : null}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import FormFieldError from './FormFieldError';
import FieldLabel from './FieldLabel';
import { formatDatePtBr, getCalendarDays, getMonthLabel, parseLocalDate, toDateInputValue } from '../../pages/reports/reports.shared';

interface FormDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  min?: string;
  error?: string;
  icon?: React.ElementType;
  disabled?: boolean;
}

export default function FormDatePicker({
  label,
  value,
  onChange,
  required = true,
  min,
  error,
  icon: Icon = Calendar,
  disabled = false,
}: FormDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [viewDate, setViewDate] = useState(value ? parseLocalDate(value) : new Date());
  const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !value) return;
    setViewDate(parseLocalDate(value));
  }, [isOpen, value]);

  const calendarDays = getCalendarDays(viewDate);

  return (
    <div ref={rootRef} className="space-y-2">
      <FieldLabel required={required}>{label}</FieldLabel>

      <div className="relative">
        <button
          type="button"
          aria-required={required}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          onClick={() => setIsOpen((current) => !current)}
          className={cn(
            'grid w-full grid-cols-[1rem_minmax(0,1fr)_1rem] items-center gap-3 rounded-2xl border bg-surface px-4 py-3.5 text-left transition-all focus:ring-2',
            disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-primary/30',
            error ? 'border-error/35 focus:ring-error/20' : 'border-outline-variant focus:ring-primary/20',
          )}
        >
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-on-surface">{formatDatePtBr(value)}</span>
          <ChevronRight className="h-4 w-4 rotate-90 text-on-surface-variant" />
        </button>

        {isOpen ? (
          <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-[17rem] rounded-[1.6rem] border border-outline-variant/10 bg-surface-container-lowest p-2 shadow-[0_24px_60px_rgba(26,28,21,0.12)]">
            <div className="rounded-[1.2rem] border border-primary/15 bg-primary/5 px-3 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
              <p className="mt-0.5 text-[1rem] font-bold text-on-surface">{formatDatePtBr(value)}</p>
            </div>

            <div className="mt-2 rounded-[1.3rem] border border-outline-variant/20 bg-surface px-2.5 py-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                  className="rounded-full border border-outline-variant/20 p-1.25 text-on-surface-variant transition hover:border-primary hover:text-primary"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <p className="text-[0.95rem] font-bold capitalize text-on-surface">{getMonthLabel(viewDate)}</p>
                <button
                  type="button"
                  onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                  className="rounded-full border border-outline-variant/20 p-1.25 text-on-surface-variant transition hover:border-primary hover:text-primary"
                  aria-label="Proximo mes"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                {weekdayLabels.map((day) => <span key={day}>{day}</span>)}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const isoValue = toDateInputValue(day);
                  const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                  const isSelected = isoValue === value;
                  const isDisabled = Boolean(min && isoValue < min);

                  return (
                    <button
                      key={isoValue}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        onChange(isoValue);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'flex h-6.5 items-center justify-center rounded-lg text-[0.95rem] transition',
                        isSelected
                          ? 'bg-primary font-bold text-on-primary'
                          : isDisabled
                            ? 'cursor-not-allowed text-on-surface-variant/30'
                            : isCurrentMonth
                              ? 'text-on-surface hover:bg-primary/10'
                              : 'text-on-surface-variant/50 hover:bg-surface-container',
                      )}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="text-[0.95rem] font-medium text-on-surface-variant transition hover:text-primary"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const today = toDateInputValue(new Date());
                    if (!min || today >= min) {
                      onChange(today);
                      setIsOpen(false);
                    }
                  }}
                  className="text-[0.95rem] font-bold text-primary"
                >
                  Hoje
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <FormFieldError message={error} />
    </div>
  );
}

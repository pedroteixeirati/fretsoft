import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Loader2, Truck } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';
import { cn } from '../../lib/utils';
import { Company, Vehicle } from '../../types';
import { formatDatePtBr, getCalendarDays, getMonthLabel, parseLocalDate, REPORT_TABS, ReportTab, toDateInputValue } from './reports.shared';

function DateRangePill({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [activeField, setActiveField] = useState<'start' | 'end'>('start');
  const selectedDate = activeField === 'start' ? startDate : endDate;
  const [viewDate, setViewDate] = useState(selectedDate ? parseLocalDate(selectedDate) : new Date());
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
    if (!isOpen) return;
    const nextSelectedDate = activeField === 'start' ? startDate : endDate;
    if (nextSelectedDate) setViewDate(parseLocalDate(nextSelectedDate));
  }, [activeField, startDate, endDate, isOpen]);

  const calendarDays = getCalendarDays(viewDate);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="grid w-full min-w-0 grid-cols-[1.5rem_minmax(0,1fr)_1rem] items-center gap-3 whitespace-nowrap rounded-2xl border border-outline-variant/10 bg-surface-container-lowest px-4 py-3 shadow-sm transition hover:border-primary/20"
      >
        <CalendarDays className="h-5 w-5 text-primary" />
        <span className="min-w-0 truncate text-center text-sm font-medium text-on-surface">
          {formatDatePtBr(startDate)} - {formatDatePtBr(endDate)}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-stone-400" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-[17rem] rounded-[1.6rem] border border-outline-variant/10 bg-surface-container-lowest p-2 shadow-[0_24px_60px_rgba(26,28,21,0.12)]">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveField('start')}
              className={cn(
                'rounded-[1.2rem] border px-3 py-1.5 text-left transition',
                activeField === 'start' ? 'border-primary bg-primary/5' : 'border-outline-variant/20 bg-surface',
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Data inicial</p>
              <p className="mt-0.5 text-[1rem] font-bold text-on-surface">{formatDatePtBr(startDate)}</p>
            </button>
            <button
              type="button"
              onClick={() => setActiveField('end')}
              className={cn(
                'rounded-[1.2rem] border px-3 py-1.5 text-left transition',
                activeField === 'end' ? 'border-primary bg-primary/5' : 'border-outline-variant/20 bg-surface',
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Data final</p>
              <p className="mt-0.5 text-[1rem] font-bold text-on-surface">{formatDatePtBr(endDate)}</p>
            </button>
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
                const isSelected = isoValue === selectedDate;

                return (
                  <button
                    key={isoValue}
                    type="button"
                    onClick={() => {
                      if (activeField === 'start') onStartDateChange(isoValue);
                      else onEndDateChange(isoValue);
                    }}
                    className={cn(
                      'flex h-6.5 items-center justify-center rounded-lg text-[0.95rem] transition',
                      isSelected ? 'bg-primary text-on-primary font-bold' : isCurrentMonth ? 'text-on-surface hover:bg-primary/10' : 'text-on-surface-variant/50 hover:bg-surface-container',
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
                onClick={() => {
                  if (activeField === 'start') onStartDateChange('');
                  else onEndDateChange('');
                }}
                className="text-[0.95rem] font-medium text-on-surface-variant transition hover:text-primary"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = toDateInputValue(new Date());
                  if (activeField === 'start') onStartDateChange(today);
                  else onEndDateChange(today);
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
  );
}

function SelectPill({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative min-w-0">
      <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-primary" />
      <CustomSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={label}
        className="w-full"
        buttonClassName="rounded-2xl border-outline-variant/10 bg-surface-container-lowest py-3 pl-12 pr-11 text-sm font-medium text-on-surface shadow-sm hover:border-primary/20"
        menuClassName="w-full"
      />
    </div>
  );
}

interface ReportsLayoutProps {
  activeTab: ReportTab;
  onTabChange: (tab: ReportTab) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  vehicleFilter: string;
  onVehicleFilterChange: (value: string) => void;
  companyFilter: string;
  onCompanyFilterChange: (value: string) => void;
  onResetFilters: () => void;
  vehicles: Vehicle[];
  companies: Company[];
  loading: boolean;
  refreshing: boolean;
  loadError: string;
  onRefresh: () => void;
  children: React.ReactNode;
}

export default function ReportsLayout({
  activeTab,
  onTabChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  vehicleFilter,
  onVehicleFilterChange,
  companyFilter,
  onCompanyFilterChange,
  onResetFilters,
  vehicles,
  companies,
  loading,
  refreshing,
  loadError,
  onRefresh,
  children,
}: ReportsLayoutProps) {
  const activeTabMeta = REPORT_TABS.find((tab) => tab.id === activeTab);

  const vehicleOptions = useMemo(
    () => [
      { value: 'all', label: `Todos os veiculos (${vehicles.length})` },
      ...vehicles.map((vehicle) => ({ value: vehicle.id, label: `${vehicle.name} (${vehicle.plate})` })),
    ],
    [vehicles],
  );

  const companyOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas as empresas' },
      ...companies.map((company) => ({ value: company.id, label: company.corporateName })),
    ],
    [companies],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-40">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-bold text-on-surface-variant">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface">Relatorios Avancados</h1>
            <p className="mt-3 text-lg text-on-surface-variant">Leitura operacional, financeira e gerencial com foco nas decisoes da transportadora.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'rounded-full px-4 py-2.5 text-sm font-bold transition-all',
                activeTab === tab.id
                  ? 'bg-[#d4ed7f] text-[#526600]'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-on-surface',
              )}
            >
              {tab.label.replace('Relatorio ', '')}
            </button>
          ))}
        </div>

        <section className="rounded-3xl bg-surface-container-low p-2">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-center">
            <DateRangePill
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={onStartDateChange}
              onEndDateChange={onEndDateChange}
            />
            <SelectPill icon={Truck} label="Todos os veiculos" value={vehicleFilter} options={vehicleOptions} onChange={onVehicleFilterChange} />
            <SelectPill icon={Building2} label="Todas as empresas" value={companyFilter} options={companyOptions} onChange={onCompanyFilterChange} />
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex shrink-0 items-center justify-center gap-3 whitespace-nowrap rounded-2xl px-6 py-3 font-bold text-primary transition hover:bg-primary/5 xl:ml-auto"
            >
              Limpar filtros
            </button>
          </div>
        </section>

        {loadError ? (
          <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {loadError}
          </div>
        ) : null}
      </header>

      <section className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Visao atual</p>
        <h2 className="font-headline text-2xl font-bold text-on-surface">{activeTabMeta?.label}</h2>
      </section>

      {children}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Company, Vehicle } from '../../types';
import { formatDatePtBr, getCalendarDays, getMonthLabel, parseLocalDate, REPORT_TABS, ReportTab, toDateInputValue } from './reports.shared';

function DateFilterInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedDate = value ? parseLocalDate(value) : new Date();
  const [viewDate, setViewDate] = useState(selectedDate);
  const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  useEffect(() => {
    setViewDate(selectedDate);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const calendarDays = getCalendarDays(viewDate);

  return (
    <div ref={rootRef} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 pr-9 text-left text-on-surface font-medium text-sm"
      >
        <span className="block truncate">{formatDatePtBr(value)}</span>
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[18rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className="rounded-full border border-outline-variant p-2 text-on-surface-variant transition hover:border-primary hover:text-primary"
              aria-label="Mes anterior"
            >
              <Calendar className="h-4 w-4 rotate-90" />
            </button>
            <p className="text-sm font-bold capitalize text-on-surface">{getMonthLabel(viewDate)}</p>
            <button
              type="button"
              onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className="rounded-full border border-outline-variant p-2 text-on-surface-variant transition hover:border-primary hover:text-primary"
              aria-label="Proximo mes"
            >
              <Calendar className="h-4 w-4 -rotate-90" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
            {weekdayLabels.map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const isoValue = toDateInputValue(day);
              const isCurrentMonth = day.getMonth() === viewDate.getMonth();
              const isSelected = isoValue === value;

              return (
                <button
                  key={isoValue}
                  type="button"
                  onClick={() => {
                    onChange(isoValue);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-xl text-sm transition',
                    isSelected ? 'bg-primary text-on-primary font-bold' : isCurrentMonth ? 'text-on-surface hover:bg-primary/10' : 'text-on-surface-variant/50 hover:bg-surface-container'
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
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
  vehicles: Vehicle[];
  companies: Company[];
  loading: boolean;
  refreshing: boolean;
  loadError: string;
  onRefresh: () => void;
  children: React.ReactNode;
}

export default function ReportsLayout(props: ReportsLayoutProps) {
  const {
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
    vehicles,
    companies,
    loading,
    refreshing,
    loadError,
    onRefresh,
    children,
  } = props;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-on-surface-variant font-bold text-lg">Gerando relatorios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Espaco de Trabalho Analitico</span>
            <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mt-2">Relatorios da Transportadora</h2>
            <p className="text-on-surface-variant mt-2">
              Separe a leitura por area de decisao para enxergar o financeiro, a operacao e a gestao do negocio com mais clareza.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 self-start rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-bold text-on-surface transition hover:border-primary/40"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Atualizar dados
          </button>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {loadError}
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-4">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 rounded-3xl border p-5 text-left transition-all',
                activeTab === tab.id ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20' : 'bg-surface-container-lowest border-outline-variant hover:border-primary/40'
              )}
            >
              <p className="font-black text-lg">{tab.label}</p>
              <p className={cn('text-sm mt-1', activeTab === tab.id ? 'text-on-primary/80' : 'text-on-surface-variant')}>{tab.description}</p>
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-2 md:col-span-2">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Intervalo de datas</label>
          <div className="flex items-end gap-3 flex-nowrap">
            <DateFilterInput value={startDate} onChange={onStartDateChange} />
            <DateFilterInput value={endDate} onChange={onEndDateChange} />
          </div>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-2">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Veiculo</label>
          <select value={vehicleFilter} onChange={(e) => onVehicleFilterChange(e.target.value)} className="bg-transparent text-on-surface font-medium focus:outline-none">
            <option value="all">Todos os veiculos</option>
            {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} ({vehicle.plate})</option>)}
          </select>
        </div>
        <div className="bg-surface-container-low rounded-xl p-5 flex flex-col gap-2">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Empresa</label>
          <select value={companyFilter} onChange={(e) => onCompanyFilterChange(e.target.value)} className="bg-transparent text-on-surface font-medium focus:outline-none">
            <option value="all">Todas as empresas</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.corporateName}</option>)}
          </select>
        </div>
      </section>

      {children}
    </div>
  );
}

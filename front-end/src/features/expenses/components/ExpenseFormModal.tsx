import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Hash, Loader2, MapPin, Plus, Sparkles, Tag, Truck } from 'lucide-react';
import Modal from '../../../components/Modal';
import CustomSelect from '../../../components/CustomSelect';
import { cn } from '../../../lib/utils';
import { Vehicle } from '../../vehicles/types/vehicle.types';
import { Provider } from '../../providers/types/provider.types';
import { expenseCategoryOptions } from '../constants/expense-options';
import { formatDatePtBr, getCalendarDays, getMonthLabel, parseLocalDate, toDateInputValue } from '../../../pages/reports/reports.shared';
import { ExpenseFormData } from '../hooks/useExpenseForm';

interface ExpenseFormModalProps {
  isOpen: boolean;
  editing: boolean;
  submitError: string;
  formData: ExpenseFormData;
  isSubmitting: boolean;
  canReadProviders: boolean;
  vehicles: Vehicle[];
  providers: Provider[];
  providerOptions: Array<{ value: string; label: string }>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: ExpenseFormData) => void;
}

function ExpenseInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  step,
  required = true,
  icon: Icon,
  lang,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
  required?: boolean;
  icon: React.ElementType;
  lang?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        <Icon className="h-3 w-3" />
        {label}
      </label>
      <input
        required={required}
        type={type}
        step={step}
        lang={lang}
        className="w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary/20"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  required = true,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  min?: string;
}) {
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
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        <Calendar className="h-3 w-3" />
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          aria-required={required}
          onClick={() => setIsOpen((current) => !current)}
          className="grid w-full grid-cols-[1rem_minmax(0,1fr)_1rem] items-center gap-3 rounded-xl border border-outline-variant bg-surface px-4 py-3 text-left transition-all hover:border-primary/30 focus:ring-2 focus:ring-primary/20"
        >
          <Calendar className="h-4 w-4 text-primary" />
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
                <button type="button" onClick={() => onChange('')} className="text-[0.95rem] font-medium text-on-surface-variant transition hover:text-primary">
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
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const [selectedHour = '00', selectedMinute = '00'] = value.split(':');
  const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

  const updateTime = (nextHour: string, nextMinute: string) => {
    onChange(`${nextHour}:${nextMinute}`);
  };

  return (
    <div ref={rootRef} className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        <Clock className="h-3 w-3" />
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="grid w-full grid-cols-[1rem_minmax(0,1fr)_1rem] items-center gap-3 rounded-xl border border-outline-variant bg-surface px-4 py-3 text-left transition-all hover:border-primary/30 focus:ring-2 focus:ring-primary/20"
        >
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-on-surface">{value || '00:00'}</span>
          <ChevronRight className="h-4 w-4 rotate-90 text-on-surface-variant" />
        </button>

        {isOpen ? (
          <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-[16rem] rounded-[1.6rem] border border-outline-variant/10 bg-surface-container-lowest p-2 shadow-[0_24px_60px_rgba(26,28,21,0.12)]">
            <div className="rounded-[1.2rem] border border-primary/15 bg-primary/5 px-3 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
              <p className="mt-0.5 text-[1rem] font-bold text-on-surface">{value || '00:00'}</p>
            </div>

            <div className="mt-2 grid grid-cols-[1fr_auto_1fr] gap-2 rounded-[1.3rem] border border-outline-variant/20 bg-surface p-2">
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Hora</p>
                <div className="max-h-44 overflow-y-auto rounded-xl bg-surface-container-low/60 p-1">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => updateTime(hour, selectedMinute)}
                      className={cn(
                        'flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition',
                        hour === selectedHour ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-primary/10',
                      )}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center pt-6 text-lg font-bold text-on-surface-variant">:</div>

              <div className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Min</p>
                <div className="max-h-44 overflow-y-auto rounded-xl bg-surface-container-low/60 p-1">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => updateTime(selectedHour, minute)}
                      className={cn(
                        'flex w-full items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition',
                        minute === selectedMinute ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-primary/10',
                      )}
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ExpenseFormModal({
  isOpen,
  editing,
  submitError,
  formData,
  isSubmitting,
  canReadProviders,
  vehicles,
  providerOptions,
  onClose,
  onSubmit,
  onChange,
}: ExpenseFormModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Editar custo operacional' : 'Novo custo operacional'}>
      <form onSubmit={onSubmit} className="space-y-6">
        {submitError ? (
          <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
            {submitError}
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <DateField label="Data" value={formData.date} onChange={(value) => onChange({ ...formData, date: value })} />
          <TimeField label="Hora" value={formData.time} onChange={(value) => onChange({ ...formData, time: value })} />
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              <Truck className="h-3 w-3" />
              Veiculo
            </label>
            <CustomSelect
              value={formData.vehicleId}
              onChange={(value) => onChange({ ...formData, vehicleId: value })}
              placeholder="Selecione um veiculo"
              options={vehicles.map((vehicle) => ({ value: vehicle.id, label: `${vehicle.name} (${vehicle.plate})` }))}
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              <MapPin className="h-3 w-3" />
              Fornecedor
            </label>
            <CustomSelect
              value={formData.provider}
              onChange={(value) => onChange({ ...formData, provider: value })}
              placeholder={canReadProviders ? 'Selecione um fornecedor' : 'Sem acesso aos fornecedores'}
              options={providerOptions}
              disabled={!canReadProviders}
            />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              <Tag className="h-3 w-3" />
              Categoria
            </label>
            <CustomSelect
              value={formData.category}
              onChange={(value) => onChange({ ...formData, category: value })}
              options={expenseCategoryOptions}
            />
          </div>
          <ExpenseInput label="Valor Total (R$)" type="number" value={String(formData.amount)} onChange={(value) => onChange({ ...formData, amount: Number(value) })} icon={Hash} step="0.01" />
          <ExpenseInput label="Odometro (km)" type="number" value={formData.odometer} onChange={(value) => onChange({ ...formData, odometer: value })} icon={Hash} />
          <ExpenseInput label="Quantidade" value={formData.quantity} onChange={(value) => onChange({ ...formData, quantity: value })} icon={Hash} placeholder="Opcional" required={false} />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <ExpenseInput label="Observacoes" value={formData.observations} onChange={(value) => onChange({ ...formData, observations: value })} icon={Sparkles} placeholder="Opcional" required={false} />
        </div>

        <section className="rounded-2xl border border-outline-variant bg-surface-container-low/40 p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Controle financeiro</p>
                <h3 className="mt-1 text-lg font-bold text-on-surface">Gerar conta a pagar</h3>
                <p className="mt-1 text-sm text-on-surface-variant">Ative quando este custo operacional tambem precisar entrar no financeiro.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formData.paymentRequired}
                onClick={() => onChange({
                  ...formData,
                  paymentRequired: !formData.paymentRequired,
                  dueDate: !formData.paymentRequired ? (formData.dueDate || formData.date) : formData.dueDate,
                })}
                className={cn(
                  'relative mt-1 inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors',
                  formData.paymentRequired ? 'border-primary bg-primary' : 'border-outline-variant bg-surface',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform',
                    formData.paymentRequired ? 'translate-x-7' : 'translate-x-1',
                  )}
                />
              </button>
            </div>

            {formData.linkedPayableId ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                Este custo possui uma conta a pagar vinculada.
              </div>
            ) : null}

            {formData.paymentRequired ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <DateField label="Data de vencimento" value={formData.dueDate} onChange={(value) => onChange({ ...formData, dueDate: value })} min={formData.date} />
                <div className="flex items-center rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4 text-sm text-primary">
                  Este custo sera enviado para Contas a pagar ao salvar.
                </div>
              </div>
            ) : null}
          </div>
        </section>
        <div className="flex justify-end gap-4 pt-6">
          <button type="button" onClick={onClose} className="rounded-full px-8 py-3 font-bold text-on-surface-variant transition-colors hover:bg-surface-container">
            Cancelar
          </button>
          <button disabled={isSubmitting} type="submit" className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            {editing ? 'Salvar Alteracoes' : 'Lancar custo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

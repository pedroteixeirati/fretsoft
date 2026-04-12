import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Clock, Hash, Loader2, MapPin, Plus, Sparkles, Tag, Truck } from 'lucide-react';
import Modal from '../../../components/Modal';
import CustomSelect from '../../../components/CustomSelect';
import { cn } from '../../../lib/utils';
import { FormFieldErrors } from '../../../lib/errors';
import { FieldLabel, FormAlert, FormDatePicker, FormFieldError, hasRenderableFieldErrors, hasRequiredFieldsFilled, useFormErrorFocus } from '../../../shared/forms';
import { Vehicle } from '../../vehicles/types/vehicle.types';
import { Provider } from '../../providers/types/provider.types';
import { expenseCategoryOptions } from '../constants/expense-options';
import { formatDatePtBr } from '../../../pages/reports/reports.shared';
import { ExpenseFormData, ExpenseFormField } from '../hooks/useExpenseForm';

interface ExpenseFormModalProps {
  isOpen: boolean;
  editing: boolean;
  submitError: string;
  fieldErrors: FormFieldErrors<ExpenseFormField>;
  formData: ExpenseFormData;
  isSubmitting: boolean;
  canReadProviders: boolean;
  vehicles: Vehicle[];
  providers: Provider[];
  providerOptions: Array<{ value: string; label: string }>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: ExpenseFormData) => void;
  onClearFieldError: (field: ExpenseFormField) => void;
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
  error,
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
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel required={required} className="flex items-center gap-2">
        <Icon className="h-3 w-3" />
        {label}
      </FieldLabel>
      <input
        required={required}
        type={type}
        step={step}
        lang={lang}
        aria-invalid={Boolean(error)}
        className={cn(
          'w-full rounded-2xl bg-surface-container px-4 py-3.5 outline-none transition-all focus:ring-2',
          error ? 'border border-error/35 focus:ring-error/20' : 'border border-outline-variant focus:ring-primary/20',
        )}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <FormFieldError message={error} />
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
  error,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
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
      <FieldLabel required={required} className="flex items-center gap-2">
        <Clock className="h-3 w-3" />
        {label}
      </FieldLabel>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-invalid={Boolean(error)}
          className={cn(
            'grid w-full grid-cols-[1rem_minmax(0,1fr)_1rem] items-center gap-3 rounded-2xl border bg-surface px-4 py-3.5 text-left transition-all hover:border-primary/30 focus:ring-2',
            error ? 'border-error/35 focus:ring-error/20' : 'border-outline-variant focus:ring-primary/20',
          )}
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
      <FormFieldError message={error} />
    </div>
  );
}

export default function ExpenseFormModal({
  isOpen,
  editing,
  submitError,
  fieldErrors,
  formData,
  isSubmitting,
  canReadProviders,
  vehicles,
  providerOptions,
  onClose,
  onSubmit,
  onChange,
  onClearFieldError,
}: ExpenseFormModalProps) {
  const hasFieldErrors = hasRenderableFieldErrors(fieldErrors);
  const formMessage = submitError || (hasFieldErrors ? 'Revise os campos destacados antes de salvar.' : '');
  const canSubmit = hasRequiredFieldsFilled(formData, [
    'date',
    'time',
    'vehicleId',
    'provider',
    'category',
    { field: 'amount', isFilled: (value) => Number(value) > 0 },
  ]) && (!formData.paymentRequired || formData.dueDate.trim().length > 0);
  const { formRef, alertRef } = useFormErrorFocus({
    enabled: isOpen,
    fieldErrors,
    message: formMessage,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Editar custo operacional' : 'Novo custo operacional'}>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        <div ref={alertRef}>
          <FormAlert message={formMessage} />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormDatePicker
            label="Data"
            value={formData.date}
            error={fieldErrors.date}
            onChange={(value) => {
              onClearFieldError('date');
              onChange({ ...formData, date: value });
            }}
          />
          <TimeField
            label="Hora"
            value={formData.time}
            error={fieldErrors.time}
            onChange={(value) => {
              onClearFieldError('time');
              onChange({ ...formData, time: value });
            }}
          />
          <div className="space-y-2">
            <FieldLabel required className="flex items-center gap-2">
              <Truck className="h-3 w-3" />
              Veiculo
            </FieldLabel>
            <CustomSelect
              value={formData.vehicleId}
              onChange={(value) => {
                onClearFieldError('vehicleId');
                onChange({ ...formData, vehicleId: value });
              }}
              error={fieldErrors.vehicleId}
              placeholder="Selecione um veiculo"
              options={vehicles.map((vehicle) => ({ value: vehicle.id, label: `${vehicle.name} (${vehicle.plate})` }))}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel required className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Fornecedor
            </FieldLabel>
            <CustomSelect
              value={formData.provider}
              onChange={(value) => {
                onClearFieldError('provider');
                onChange({ ...formData, provider: value });
              }}
              placeholder={canReadProviders ? 'Selecione um fornecedor' : 'Sem acesso aos fornecedores'}
              options={providerOptions}
              disabled={!canReadProviders}
              error={fieldErrors.provider}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel required className="flex items-center gap-2">
              <Tag className="h-3 w-3" />
              Categoria
            </FieldLabel>
            <CustomSelect
              value={formData.category}
              onChange={(value) => {
                onClearFieldError('category');
                onChange({ ...formData, category: value });
              }}
              error={fieldErrors.category}
              options={expenseCategoryOptions}
            />
          </div>
          <ExpenseInput
            label="Valor Total (R$)"
            type="number"
            error={fieldErrors.amount}
            value={String(formData.amount)}
            onChange={(value) => {
              onClearFieldError('amount');
              onChange({ ...formData, amount: Number(value) });
            }}
            icon={Hash}
            step="0.01"
          />
          <ExpenseInput
            label="Odometro (km)"
            type="number"
            error={fieldErrors.odometer}
            value={formData.odometer}
            onChange={(value) => {
              onClearFieldError('odometer');
              onChange({ ...formData, odometer: value });
            }}
            icon={Hash}
          />
          <ExpenseInput
            label="Quantidade"
            error={fieldErrors.quantity}
            value={formData.quantity}
            onChange={(value) => {
              onClearFieldError('quantity');
              onChange({ ...formData, quantity: value });
            }}
            icon={Hash}
            placeholder="Opcional"
            required={false}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <ExpenseInput
            label="Observacoes"
            error={fieldErrors.observations}
            value={formData.observations}
            onChange={(value) => {
              onClearFieldError('observations');
              onChange({ ...formData, observations: value });
            }}
            icon={Sparkles}
            placeholder="Opcional"
            required={false}
          />
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
                <FormDatePicker
                  label="Data de vencimento"
                  value={formData.dueDate}
                  error={fieldErrors.dueDate}
                  onChange={(value) => {
                    onClearFieldError('dueDate');
                    onChange({ ...formData, dueDate: value });
                  }}
                  min={formData.date}
                />
                <div className="flex items-center rounded-[1.6rem] border border-primary/15 bg-primary/[0.06] px-4 py-4 text-sm text-primary">
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
          <button disabled={isSubmitting || !canSubmit} type="submit" className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            {editing ? 'Salvar Alteracoes' : 'Lancar custo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

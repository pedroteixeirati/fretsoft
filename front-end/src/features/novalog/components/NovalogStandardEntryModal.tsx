import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, FileText, Fuel, Route } from 'lucide-react';
import Modal from '../../../components/Modal';
import CustomSelect from '../../../components/CustomSelect';
import Input from '../../../shared/ui/Input';
import { FieldLabel, FormAlert, FormDatePicker, clearFieldError } from '../../../shared/forms';
import { FormFieldErrors } from '../../../lib/errors';
import NovalogAutocompleteSelect from './NovalogAutocompleteSelect';
import {
  defaultNovalogStandardEntryFormData,
  novalogDestinationOptions,
  novalogFuelStationOptions,
} from '../constants/novalog.constants';
import { NovalogEntry, NovalogEntryMode, NovalogOption, NovalogStandardEntryField, NovalogStandardEntryFormData } from '../types/novalog.types';
import {
  calculateNovalogEntryAmounts,
  formatNovalogCurrency,
  formatNovalogDecimalInput,
  parseNovalogDecimal,
} from '../utils/novalog.calculations';

interface NovalogStandardEntryModalProps {
  isOpen: boolean;
  weekNumber: number;
  originOptions: NovalogOption[];
  draftEntry?: NovalogEntry | null;
  mode?: 'create' | 'edit' | 'duplicate';
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (entry: NovalogEntry) => void;
}

function mapEntryToFormData(entry: NovalogEntry): NovalogStandardEntryFormData {
  return {
    operationDate: entry.operationDate,
    originName: entry.originName,
    destinationName: entry.destinationName,
    weight: entry.weight.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    companyRatePerTon: entry.companyRatePerTon.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    aggregatedRatePerTon: entry.aggregatedRatePerTon.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ticketNumber: entry.ticketNumber,
    fuelStationName: entry.fuelStationName,
  };
}

function getFormErrors(formData: NovalogStandardEntryFormData): FormFieldErrors<NovalogStandardEntryField> {
  const errors: FormFieldErrors<NovalogStandardEntryField> = {};

  if (!formData.operationDate) errors.operationDate = 'Informe a data da operacao.';
  if (formData.originName.trim().length < 2) errors.originName = 'Selecione ou informe a mineradora.';
  if (formData.destinationName.trim().length < 2) errors.destinationName = 'Selecione o destino.';

  const numericFields: Array<{ key: 'weight' | 'companyRatePerTon' | 'aggregatedRatePerTon'; label: string }> = [
    { key: 'weight', label: 'peso' },
    { key: 'companyRatePerTon', label: 'valor frete empresa' },
    { key: 'aggregatedRatePerTon', label: 'valor frete terceiro' },
  ];

  numericFields.forEach(({ key, label }) => {
      const parsed = parseNovalogDecimal(formData[key]);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      errors[key] = `Informe um ${label} maior que zero.`;
    }
  });

  return errors;
}

export default function NovalogStandardEntryModal({
  isOpen,
  weekNumber,
  originOptions,
  draftEntry,
  mode = 'create',
  isSubmitting = false,
  onClose,
  onSubmit,
}: NovalogStandardEntryModalProps) {
  const [formData, setFormData] = useState<NovalogStandardEntryFormData>(defaultNovalogStandardEntryFormData());
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<NovalogStandardEntryField>>({});

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setFormData(draftEntry ? mapEntryToFormData(draftEntry) : defaultNovalogStandardEntryFormData());
  }, [draftEntry, isOpen]);

  const amounts = useMemo(
    () => calculateNovalogEntryAmounts(parseNovalogDecimal(formData.weight), parseNovalogDecimal(formData.companyRatePerTon), parseNovalogDecimal(formData.aggregatedRatePerTon)),
    [formData.aggregatedRatePerTon, formData.companyRatePerTon, formData.weight],
  );

  const resolvedOriginOptions = useMemo(() => {
    if (!draftEntry?.originName?.trim()) {
      return originOptions;
    }

    const normalizedOrigin = draftEntry.originName.trim();
    const alreadyExists = originOptions.some((option) => option.value === normalizedOrigin);

    if (alreadyExists) {
      return originOptions;
    }

    return [{ value: normalizedOrigin, label: normalizedOrigin }, ...originOptions];
  }, [draftEntry?.originName, originOptions]);

  const formMessage = Object.values(fieldErrors).some(Boolean) ? 'Revise os campos destacados antes de salvar.' : '';

  const updateField = (field: NovalogStandardEntryField, value: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      return clearFieldError(current, field);
    });
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleClose = () => {
    setFieldErrors({});
    setFormData(defaultNovalogStandardEntryFormData());
    onClose();
  };

  const resolvedEntryMode: NovalogEntryMode = draftEntry?.entryMode ?? 'standard';
  const modalTitle = mode === 'edit' ? 'Editar lancamento Novalog' : mode === 'duplicate' ? 'Duplicar lancamento Novalog' : 'Novo lancamento Novalog';
  const submitLabel = mode === 'edit' ? 'Salvar alteracoes' : mode === 'duplicate' ? 'Salvar copia' : 'Salvar lancamento';
  const identifierText = mode === 'edit' && draftEntry?.displayId
    ? `Identificador ${draftEntry.displayId}`
    : '';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = getFormErrors(formData);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    onSubmit({
      id: mode === 'edit' && draftEntry ? draftEntry.id : `novalog-entry-${Date.now()}`,
      displayId: mode === 'edit' ? draftEntry?.displayId : undefined,
      weekNumber,
      operationDate: formData.operationDate,
      originName: formData.originName.trim(),
      destinationName: formData.destinationName.trim(),
      weight: parseNovalogDecimal(formData.weight),
      companyRatePerTon: parseNovalogDecimal(formData.companyRatePerTon),
      companyGrossAmount: amounts.companyGrossAmount,
      aggregatedRatePerTon: parseNovalogDecimal(formData.aggregatedRatePerTon),
      aggregatedGrossAmount: amounts.aggregatedGrossAmount,
      ticketNumber: formData.ticketNumber.trim(),
      fuelStationName: formData.fuelStationName.trim(),
      entryMode: resolvedEntryMode,
    });

    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormAlert message={formMessage} variant="error" />

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface">Operacao</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormDatePicker
              label="Data"
              value={formData.operationDate}
              onChange={(value) => updateField('operationDate', value)}
              error={fieldErrors.operationDate}
            />
            <div className="space-y-2">
              <FieldLabel required>Origem (mineradora)</FieldLabel>
              <CustomSelect
                value={formData.originName}
                onChange={(value) => updateField('originName', value)}
                options={resolvedOriginOptions}
                placeholder="Selecione a origem"
                error={fieldErrors.originName}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel required>Destino (siderurgica)</FieldLabel>
              <NovalogAutocompleteSelect
                value={formData.destinationName}
                onChange={(value) => updateField('destinationName', value)}
                options={novalogDestinationOptions}
                placeholder="Destino"
                error={fieldErrors.destinationName}
              />
            </div>
            <Input
              label="Peso (t)"
                type="text"
                inputMode="numeric"
                value={formData.weight}
                onChange={(event) => updateField('weight', formatNovalogDecimalInput(event.target.value))}
                error={fieldErrors.weight}
                placeholder="0,00"
              />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface">Valores</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Valor frete empresa"
              type="text"
              inputMode="numeric"
              value={formData.companyRatePerTon}
              onChange={(event) => updateField('companyRatePerTon', formatNovalogDecimalInput(event.target.value))}
              error={fieldErrors.companyRatePerTon}
              placeholder="0,00"
            />
            <Input
              label="Valor frete terceiro"
              type="text"
              inputMode="numeric"
              value={formData.aggregatedRatePerTon}
              onChange={(event) => updateField('aggregatedRatePerTon', formatNovalogDecimalInput(event.target.value))}
              error={fieldErrors.aggregatedRatePerTon}
              placeholder="0,00"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface">Detalhes operacionais</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Numero do ticket"
              value={formData.ticketNumber}
              onChange={(event) => updateField('ticketNumber', event.target.value)}
              error={fieldErrors.ticketNumber}
              placeholder="Ex: 154230"
            />
            <div className="space-y-2">
              <FieldLabel>Posto de abastecimento</FieldLabel>
              <CustomSelect
                value={formData.fuelStationName}
                onChange={(value) => updateField('fuelStationName', value)}
                options={novalogFuelStationOptions}
                placeholder="Posto"
                error={fieldErrors.fuelStationName}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface">Resumo automatico</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.4rem] border border-outline-variant/15 bg-surface px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Ganho empresa</p>
              <p className="mt-2 text-lg font-black text-primary">{formatNovalogCurrency(amounts.companyGrossAmount)}</p>
            </div>
            <div className="rounded-[1.4rem] border border-outline-variant/15 bg-surface px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Ganho terceiro</p>
              <p className="mt-2 text-lg font-black text-secondary">{formatNovalogCurrency(amounts.aggregatedGrossAmount)}</p>
            </div>
            <div className="rounded-[1.4rem] border border-outline-variant/15 bg-surface px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Valor 40%</p>
              <p className="mt-2 text-lg font-black text-on-surface">{formatNovalogCurrency(amounts.driverShareAmount)}</p>
            </div>
            <div className="rounded-[1.4rem] border border-outline-variant/15 bg-surface px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Vr motorista</p>
              <p className="mt-2 text-lg font-black text-on-surface">{formatNovalogCurrency(amounts.driverNetAmount)}</p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-outline-variant/10 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-full border border-outline-variant bg-surface px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:scale-[1.01] active:scale-95"
          >
            {isSubmitting ? 'Salvando...' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

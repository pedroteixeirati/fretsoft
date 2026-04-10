import React from 'react';
import { Loader2, Plus } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import Modal from '../../../components/Modal';
import { FieldLabel, FormAlert, FormDatePicker, FormFieldError, hasRequiredFieldsFilled, useFormErrorFocus } from '../../../shared/forms';
import Input from '../../../shared/ui/Input';
import { Company } from '../../companies/types/company.types';
import { Freight } from '../../freights/types/freight.types';
import { CargoFormData, CargoFormField } from '../hooks/useCargoForm';
import { FormFieldErrors } from '../../../lib/errors';

interface CargoFormModalProps {
  isOpen: boolean;
  editing: boolean;
  submitError: string;
  fieldErrors: FormFieldErrors<CargoFormField>;
  isSubmitting: boolean;
  formData: CargoFormData;
  freights: Freight[];
  companies: Company[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: CargoFormData) => void;
  onClearFieldError: (field: CargoFormField) => void;
  freightLocked?: boolean;
}

const cargoStatusOptions = [
  { value: 'planned', label: 'Planejada' },
  { value: 'loading', label: 'Carregando' },
  { value: 'in_transit', label: 'Em transito' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelada' },
];

export default function CargoFormModal({
  isOpen,
  editing,
  submitError,
  fieldErrors,
  isSubmitting,
  formData,
  freights,
  companies,
  onClose,
  onSubmit,
  onChange,
  onClearFieldError,
  freightLocked = false,
}: CargoFormModalProps) {
  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
  const formMessage = submitError || (hasFieldErrors ? 'Revise os campos destacados antes de salvar.' : '');
  const canSubmit = hasRequiredFieldsFilled(formData, ['freightId', 'companyId', 'description', 'cargoType', 'origin', 'destination', 'status']);
  const { formRef, alertRef } = useFormErrorFocus({
    enabled: isOpen,
    fieldErrors,
    message: formMessage,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Editar carga' : 'Nova carga'}>
      <form ref={formRef} noValidate onSubmit={onSubmit} className="space-y-6">
        <div ref={alertRef}>
          <FormAlert message={formMessage} />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel required>Frete</FieldLabel>
            <CustomSelect
              value={formData.freightId}
              onChange={(value) => {
                onClearFieldError('freightId');
                onChange({ ...formData, freightId: value });
              }}
              error={fieldErrors.freightId}
              disabled={freightLocked}
              placeholder="Selecione um frete"
              options={freights.map((freight) => ({
                value: freight.id,
                label: `${freight.displayId ? `#${freight.displayId} - ` : ''}${freight.route}`,
              }))}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel required>Cliente</FieldLabel>
            <CustomSelect
              value={formData.companyId}
              onChange={(value) => {
                onClearFieldError('companyId');
                onChange({ ...formData, companyId: value });
              }}
              error={fieldErrors.companyId}
              placeholder="Selecione um cliente"
              options={companies.map((company) => ({
                value: company.id,
                label: company.tradeName || company.corporateName,
              }))}
            />
          </div>

          <Input
            label="Numero da carga"
            name="cargoNumber"
            value={formData.cargoNumber}
            error={fieldErrors.cargoNumber}
            onChange={(event) => {
              onClearFieldError('cargoNumber');
              onChange({ ...formData, cargoNumber: event.target.value });
            }}
            placeholder="Ex: CG-2026-001"
          />

          <Input
            label="Tipo de carga"
            name="cargoType"
            required
            value={formData.cargoType}
            error={fieldErrors.cargoType}
            onChange={(event) => {
              onClearFieldError('cargoType');
              onChange({ ...formData, cargoType: event.target.value });
            }}
            placeholder="Ex: Alimentos refrigerados"
          />

          <Input
            label="Descricao"
            name="description"
            required
            containerClassName="md:col-span-2"
            value={formData.description}
            error={fieldErrors.description}
            onChange={(event) => {
              onClearFieldError('description');
              onChange({ ...formData, description: event.target.value });
            }}
            placeholder="Resumo da mercadoria transportada"
          />

          <Input
            label="Origem"
            name="origin"
            required
            value={formData.origin}
            error={fieldErrors.origin}
            onChange={(event) => {
              onClearFieldError('origin');
              onChange({ ...formData, origin: event.target.value });
            }}
            placeholder="Cidade/UF de origem"
          />

          <Input
            label="Destino"
            name="destination"
            required
            value={formData.destination}
            error={fieldErrors.destination}
            onChange={(event) => {
              onClearFieldError('destination');
              onChange({ ...formData, destination: event.target.value });
            }}
            placeholder="Cidade/UF de destino"
          />

          <Input
            label="Peso (kg)"
            name="weight"
            type="number"
            min={0}
            step="0.01"
            value={formData.weight}
            error={fieldErrors.weight}
            onChange={(event) => {
              onClearFieldError('weight');
              onChange({ ...formData, weight: event.target.value });
            }}
          />

          <Input
            label="Volume (m3)"
            name="volume"
            type="number"
            min={0}
            step="0.01"
            value={formData.volume}
            error={fieldErrors.volume}
            onChange={(event) => {
              onClearFieldError('volume');
              onChange({ ...formData, volume: event.target.value });
            }}
          />

          <Input
            label="Quantidade"
            name="unitCount"
            type="number"
            min={0}
            step="1"
            value={formData.unitCount}
            error={fieldErrors.unitCount}
            onChange={(event) => {
              onClearFieldError('unitCount');
              onChange({ ...formData, unitCount: event.target.value });
            }}
          />

          <Input
            label="Valor da mercadoria"
            name="merchandiseValue"
            type="number"
            min={0}
            step="0.01"
            value={formData.merchandiseValue}
            error={fieldErrors.merchandiseValue}
            onChange={(event) => {
              onClearFieldError('merchandiseValue');
              onChange({ ...formData, merchandiseValue: event.target.value });
            }}
          />

          <div className="space-y-2">
            <FieldLabel required>Status</FieldLabel>
            <CustomSelect
              value={formData.status}
              onChange={(value) => {
                onClearFieldError('status');
                onChange({ ...formData, status: value as CargoFormData['status'] });
              }}
              error={fieldErrors.status}
              options={cargoStatusOptions}
            />
          </div>

          <FormDatePicker
            label="Data prevista"
            value={formData.scheduledDate}
            error={fieldErrors.scheduledDate}
            onChange={(value) => {
              onClearFieldError('scheduledDate');
              onChange({ ...formData, scheduledDate: value });
            }}
          />

          <FormDatePicker
            label="Data de entrega"
            value={formData.deliveredAt}
            error={fieldErrors.deliveredAt}
            onChange={(value) => {
              onClearFieldError('deliveredAt');
              onChange({ ...formData, deliveredAt: value });
            }}
          />

          <div className="space-y-2 md:col-span-2">
            <FieldLabel htmlFor="cargo-notes">Observacoes</FieldLabel>
            <textarea
              id="cargo-notes"
              name="notes"
              rows={4}
              value={formData.notes}
              aria-invalid={Boolean(fieldErrors.notes)}
              onChange={(event) => {
                onClearFieldError('notes');
                onChange({ ...formData, notes: event.target.value });
              }}
              className={`w-full rounded-2xl bg-surface px-4 py-3.5 text-on-surface outline-none ring-1 transition-all placeholder:text-on-surface-variant/65 ${
                fieldErrors.notes ? 'ring-error/35 focus:ring-error/20' : 'ring-primary/5 focus:ring-2 focus:ring-primary/20'
              }`}
              placeholder="Observacoes operacionais da carga"
            />
            <FormFieldError message={fieldErrors.notes} />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-8 py-3 font-bold text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            {editing ? 'Salvar alteracoes' : 'Cadastrar carga'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

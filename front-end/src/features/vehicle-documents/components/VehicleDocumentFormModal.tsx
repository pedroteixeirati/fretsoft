import React from 'react';
import { Loader2, Plus } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import Modal from '../../../components/Modal';
import Input from '../../../shared/ui/Input';
import { FieldLabel, FormAlert, FormDatePicker, hasRenderableFieldErrors, hasRequiredFieldsFilled, useFormErrorFocus } from '../../../shared/forms';
import { Vehicle } from '../../vehicles/types/vehicle.types';
import { VehicleDocumentFormData, VehicleDocumentFormField } from '../hooks/useVehicleDocumentForm';
import { vehicleDocumentTypeLabels, VehicleDocumentType } from '../types/vehicle-document.types';
import { FormFieldErrors } from '../../../lib/errors';

interface VehicleDocumentFormModalProps {
  isOpen: boolean;
  editing: boolean;
  submitError: string;
  fieldErrors: FormFieldErrors<VehicleDocumentFormField>;
  isSubmitting: boolean;
  formData: VehicleDocumentFormData;
  vehicles: Vehicle[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: VehicleDocumentFormData) => void;
  onClearFieldError: (field: VehicleDocumentFormField) => void;
}

export default function VehicleDocumentFormModal({
  isOpen,
  editing,
  submitError,
  fieldErrors,
  isSubmitting,
  formData,
  vehicles,
  onClose,
  onSubmit,
  onChange,
  onClearFieldError,
}: VehicleDocumentFormModalProps) {
  const hasFieldErrors = hasRenderableFieldErrors(fieldErrors);
  const formMessage = submitError || (hasFieldErrors ? 'Revise os campos destacados antes de salvar.' : '');
  const canSubmit = hasRequiredFieldsFilled(formData, ['vehicleId', 'documentType', 'dueDate']);
  const { formRef, alertRef } = useFormErrorFocus({
    enabled: isOpen,
    fieldErrors,
    message: formMessage,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Editar documento' : 'Novo documento da frota'}>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        <div ref={alertRef}>
          <FormAlert message={formMessage} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <FieldLabel required>Veiculo</FieldLabel>
            <CustomSelect
              value={formData.vehicleId}
              onChange={(value) => {
                onClearFieldError('vehicleId');
                onChange({ ...formData, vehicleId: value });
              }}
              error={fieldErrors.vehicleId}
              options={vehicles.map((vehicle) => ({
                value: vehicle.id,
                label: `${vehicle.plate} — ${vehicle.name}`,
              }))}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel required>Tipo de documento</FieldLabel>
            <CustomSelect
              value={formData.documentType}
              onChange={(value) => {
                onClearFieldError('documentType');
                onChange({ ...formData, documentType: value as VehicleDocumentType });
              }}
              error={fieldErrors.documentType}
              options={Object.entries(vehicleDocumentTypeLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>
          <Input
            label="Identificacao"
            error={fieldErrors.identifier}
            hint="Ex: renavam, numero de serie do tacografo, numero da apolice."
            value={formData.identifier}
            onChange={(event) => {
              onClearFieldError('identifier');
              onChange({ ...formData, identifier: event.target.value });
            }}
            placeholder="Opcional"
          />
          <Input
            label="Valor (R$)"
            type="number"
            error={fieldErrors.amount}
            value={formData.amount}
            onChange={(event) => {
              onClearFieldError('amount');
              onChange({ ...formData, amount: event.target.value });
            }}
            placeholder="Opcional"
          />
          <FormDatePicker
            label="Vencimento"
            required
            error={fieldErrors.dueDate}
            value={formData.dueDate}
            onChange={(value) => {
              onClearFieldError('dueDate');
              onChange({ ...formData, dueDate: value });
            }}
          />
          {editing ? (
            <div className="space-y-2">
              <FieldLabel>Situacao</FieldLabel>
              <CustomSelect
                value={formData.status}
                onChange={(value) => {
                  onClearFieldError('status');
                  onChange({ ...formData, status: value as VehicleDocumentFormData['status'] });
                }}
                error={fieldErrors.status}
                options={[
                  { value: 'active', label: 'Ativo' },
                  { value: 'archived', label: 'Arquivado' },
                ]}
              />
            </div>
          ) : null}
          <div className="md:col-span-2">
            <Input
              label="Observacoes"
              error={fieldErrors.notes}
              value={formData.notes}
              onChange={(event) => {
                onClearFieldError('notes');
                onChange({ ...formData, notes: event.target.value });
              }}
              placeholder="Ex: parcela 2 de 3, responsavel, fornecedor."
            />
          </div>
        </div>

        <div className="pt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancelar
          </button>
          <button
            disabled={isSubmitting || !canSubmit}
            type="submit"
            className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {editing ? 'Salvar alteracoes' : 'Cadastrar documento'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

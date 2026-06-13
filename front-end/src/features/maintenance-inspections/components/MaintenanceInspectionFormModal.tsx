import React from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import Modal from '../../../components/Modal';
import Input from '../../../shared/ui/Input';
import { FieldLabel, FormAlert, FormDatePicker, hasRenderableFieldErrors, hasRequiredFieldsFilled, useFormErrorFocus } from '../../../shared/forms';
import { Vehicle } from '../../vehicles/types/vehicle.types';
import {
  InspectionItemFormData,
  MaintenanceInspectionFormData,
  MaintenanceInspectionFormField,
  createEmptyChecklistItem,
} from '../hooks/useMaintenanceInspectionForm';
import { MaintenanceInspectionResult } from '../types/maintenance-inspection.types';
import { FormFieldErrors } from '../../../lib/errors';

interface MaintenanceInspectionFormModalProps {
  isOpen: boolean;
  editing: boolean;
  submitError: string;
  fieldErrors: FormFieldErrors<MaintenanceInspectionFormField>;
  isSubmitting: boolean;
  formData: MaintenanceInspectionFormData;
  vehicles: Vehicle[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: MaintenanceInspectionFormData) => void;
  onClearFieldError: (field: MaintenanceInspectionFormField) => void;
}

const resultStyles: Record<MaintenanceInspectionResult, string> = {
  ok: 'border-primary/40 bg-primary/5',
  attention: 'border-error/40 bg-error/5',
  na: 'border-outline-variant/30 bg-surface',
};

export default function MaintenanceInspectionFormModal({
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
}: MaintenanceInspectionFormModalProps) {
  const hasFieldErrors = hasRenderableFieldErrors(fieldErrors);
  const formMessage = submitError || (hasFieldErrors ? 'Revise os campos destacados antes de salvar.' : '');
  const canSubmit = hasRequiredFieldsFilled(formData, ['vehicleId', 'inspectedOn']);
  const { formRef, alertRef } = useFormErrorFocus({
    enabled: isOpen,
    fieldErrors,
    message: formMessage,
  });

  const updateItem = (index: number, patch: Partial<InspectionItemFormData>) => {
    onClearFieldError('items');
    const items = formData.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    onChange({ ...formData, items });
  };

  const addItem = () => {
    onClearFieldError('items');
    onChange({ ...formData, items: [...formData.items, createEmptyChecklistItem()] });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    onChange({ ...formData, items: formData.items.filter((_, itemIndex) => itemIndex !== index) });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Editar inspecao preventiva' : 'Nova inspecao preventiva'}>
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
              options={vehicles.map((vehicle) => ({ value: vehicle.id, label: `${vehicle.plate} — ${vehicle.name}` }))}
            />
          </div>
          <Input
            label="Mecanico responsavel"
            error={fieldErrors.mechanicName}
            value={formData.mechanicName}
            onChange={(event) => {
              onClearFieldError('mechanicName');
              onChange({ ...formData, mechanicName: event.target.value });
            }}
            placeholder="Opcional"
          />
          <FormDatePicker
            label="Data da inspecao"
            required
            error={fieldErrors.inspectedOn}
            value={formData.inspectedOn}
            onChange={(value) => {
              onClearFieldError('inspectedOn');
              onChange({ ...formData, inspectedOn: value });
            }}
          />
          <Input
            label="Quilometragem"
            type="number"
            error={fieldErrors.odometer}
            value={formData.odometer}
            onChange={(event) => {
              onClearFieldError('odometer');
              onChange({ ...formData, odometer: event.target.value });
            }}
            placeholder="Opcional"
          />
          <FormDatePicker
            label="Proximo vencimento (data)"
            error={fieldErrors.nextDueOn}
            value={formData.nextDueOn}
            onChange={(value) => {
              onClearFieldError('nextDueOn');
              onChange({ ...formData, nextDueOn: value });
            }}
          />
          <Input
            label="Proximo vencimento (km)"
            type="number"
            error={fieldErrors.nextDueKm}
            value={formData.nextDueKm}
            onChange={(event) => {
              onClearFieldError('nextDueKm');
              onChange({ ...formData, nextDueKm: event.target.value });
            }}
            placeholder="Opcional"
          />
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="font-headline text-sm font-bold text-on-surface">Checklist da inspecao</h4>
              <p className="text-xs text-on-surface-variant">Marque o resultado de cada item e detalhe os pontos de atencao.</p>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 rounded-full border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
            >
              <Plus className="h-4 w-4" /> Item
            </button>
          </div>

          {fieldErrors.items ? <p className="mb-3 text-xs font-medium text-error">{fieldErrors.items}</p> : null}

          <div className="space-y-2">
            {formData.items.map((item, index) => (
              <div
                key={index}
                className={`rounded-xl border p-3 transition-colors ${resultStyles[item.result]}`}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
                  <div className="sm:col-span-5">
                    <Input
                      label={`Item ${index + 1}`}
                      value={item.label}
                      onChange={(event) => updateItem(index, { label: event.target.value })}
                      placeholder="Ex: Lonas de freio dianteiras"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <FieldLabel>Resultado</FieldLabel>
                    <CustomSelect
                      value={item.result}
                      onChange={(value) => updateItem(index, { result: value as MaintenanceInspectionResult })}
                      options={[
                        { value: 'ok', label: 'OK' },
                        { value: 'attention', label: 'Atencao' },
                        { value: 'na', label: 'N/A' },
                      ]}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      label="Observacao"
                      value={item.observation}
                      onChange={(event) => updateItem(index, { observation: event.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="flex items-center justify-end sm:col-span-1">
                    <button
                      type="button"
                      aria-label={`Remover item ${index + 1}`}
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                      className="p-2 text-outline transition-colors hover:text-error disabled:opacity-30"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Input
          label="Observacoes gerais"
          error={fieldErrors.notes}
          value={formData.notes}
          onChange={(event) => {
            onClearFieldError('notes');
            onChange({ ...formData, notes: event.target.value });
          }}
          placeholder="Opcional"
        />

        <div className="pt-2 flex justify-end gap-4">
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
            {editing ? 'Salvar alteracoes' : 'Registrar inspecao'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

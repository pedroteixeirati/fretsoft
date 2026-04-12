import React from 'react';
import { Loader2, Plus } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import Modal from '../../../components/Modal';
import Input from '../../../shared/ui/Input';
import { FieldLabel, FormAlert, FormDatePicker, hasRenderableFieldErrors, hasRequiredFieldsFilled, useFormErrorFocus } from '../../../shared/forms';
import { VehicleFormData, VehicleFormField } from '../hooks/useVehicleForm';
import { FormFieldErrors } from '../../../lib/errors';

interface VehicleFormModalProps {
  isOpen: boolean;
  editing: boolean;
  submitError: string;
  fieldErrors: FormFieldErrors<VehicleFormField>;
  isSubmitting: boolean;
  formData: VehicleFormData;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: VehicleFormData) => void;
  onClearFieldError: (field: VehicleFormField) => void;
}

export default function VehicleFormModal({
  isOpen,
  editing,
  submitError,
  fieldErrors,
  isSubmitting,
  formData,
  onClose,
  onSubmit,
  onChange,
  onClearFieldError,
}: VehicleFormModalProps) {
  const hasFieldErrors = hasRenderableFieldErrors(fieldErrors);
  const formMessage = submitError || (hasFieldErrors ? 'Revise os campos destacados antes de salvar.' : '');
  const canSubmit = hasRequiredFieldsFilled(formData, ['name', 'plate', 'driver']);
  const { formRef, alertRef } = useFormErrorFocus({
    enabled: isOpen,
    fieldErrors,
    message: formMessage,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Editar veiculo' : 'Novo veiculo'}>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        <div ref={alertRef}>
          <FormAlert message={formMessage} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nome do veiculo"
            required
            error={fieldErrors.name}
            value={formData.name}
            onChange={(event) => {
              onClearFieldError('name');
              onChange({ ...formData, name: event.target.value });
            }}
            placeholder="Ex: Volvo FH 540"
          />
          <Input
            label="Placa"
            required
            error={fieldErrors.plate}
            hint="Formatos aceitos: ABC1D23 ou ABC-1234."
            value={formData.plate}
            onChange={(event) => {
              onClearFieldError('plate');
              onChange({ ...formData, plate: event.target.value.toUpperCase() });
            }}
            placeholder="ABC-1234"
          />
          <Input
            label="Motorista"
            required
            error={fieldErrors.driver}
            value={formData.driver}
            onChange={(event) => {
              onClearFieldError('driver');
              onChange({ ...formData, driver: event.target.value });
            }}
            placeholder="Nome do motorista"
          />
          <div className="space-y-2">
            <FieldLabel required>Tipo</FieldLabel>
            <CustomSelect
              value={formData.type}
              onChange={(value) => {
                onClearFieldError('type');
                onChange({ ...formData, type: value });
              }}
              error={fieldErrors.type}
              options={['Carga Pesada', 'Longo Percurso', 'Utilitario', 'Executivo'].map((option) => ({
                value: option,
                label: option,
              }))}
            />
          </div>
          <Input
            label="Quilometragem"
            type="number"
            error={fieldErrors.km}
            value={String(formData.km)}
            onChange={(event) => {
              onClearFieldError('km');
              onChange({ ...formData, km: Number(event.target.value) });
            }}
          />
          <FormDatePicker
            label="Proxima manutencao"
            error={fieldErrors.nextMaintenance}
            value={formData.nextMaintenance}
            onChange={(value) => {
              onClearFieldError('nextMaintenance');
              onChange({ ...formData, nextMaintenance: value });
            }}
          />
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
            {editing ? 'Salvar alteracoes' : 'Cadastrar veiculo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

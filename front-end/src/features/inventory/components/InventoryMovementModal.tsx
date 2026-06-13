import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import Modal from '../../../components/Modal';
import Input from '../../../shared/ui/Input';
import { FormAlert, FormDatePicker, hasRenderableFieldErrors, hasRequiredFieldsFilled, useFormErrorFocus } from '../../../shared/forms';
import { InventoryItem } from '../types/inventory.types';
import { InventoryMovementFormData, InventoryMovementFormField } from '../hooks/useInventoryForms';
import { FormFieldErrors } from '../../../lib/errors';

interface InventoryMovementModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  submitError: string;
  fieldErrors: FormFieldErrors<InventoryMovementFormField>;
  isSubmitting: boolean;
  formData: InventoryMovementFormData;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: InventoryMovementFormData) => void;
  onClearFieldError: (field: InventoryMovementFormField) => void;
}

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

export default function InventoryMovementModal({
  isOpen,
  item,
  submitError,
  fieldErrors,
  isSubmitting,
  formData,
  onClose,
  onSubmit,
  onChange,
  onClearFieldError,
}: InventoryMovementModalProps) {
  const isEntry = formData.movementType === 'in';
  const hasFieldErrors = hasRenderableFieldErrors(fieldErrors);
  const formMessage = submitError || (hasFieldErrors ? 'Revise os campos destacados antes de salvar.' : '');
  const canSubmit = hasRequiredFieldsFilled(formData, ['quantity', 'occurredOn']);
  const { formRef, alertRef } = useFormErrorFocus({
    enabled: isOpen,
    fieldErrors,
    message: formMessage,
  });

  const title = isEntry ? 'Registrar entrada' : 'Registrar saida';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        <div ref={alertRef}>
          <FormAlert message={formMessage} />
        </div>

        {item ? (
          <div className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest p-4">
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl ${
                isEntry ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'
              }`}
            >
              {isEntry ? <ArrowDownCircle className="h-5 w-5" /> : <ArrowUpCircle className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-sm font-bold text-on-surface">{item.name}</p>
              <p className="text-xs text-on-surface-variant">Saldo atual: {formatNumber(item.quantity)} un</p>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Quantidade"
            type="number"
            required
            error={fieldErrors.quantity}
            value={formData.quantity}
            onChange={(event) => {
              onClearFieldError('quantity');
              onChange({ ...formData, quantity: event.target.value });
            }}
          />
          <Input
            label="Valor unitario (R$)"
            type="number"
            error={fieldErrors.unitCost}
            value={formData.unitCost}
            onChange={(event) => {
              onClearFieldError('unitCost');
              onChange({ ...formData, unitCost: event.target.value });
            }}
            placeholder="Opcional"
          />
          <FormDatePicker
            label="Data"
            required
            error={fieldErrors.occurredOn}
            value={formData.occurredOn}
            onChange={(value) => {
              onClearFieldError('occurredOn');
              onChange({ ...formData, occurredOn: value });
            }}
          />
          <Input
            label={isEntry ? 'Fornecedor / Origem' : 'Destino / Veiculo'}
            error={fieldErrors.reason}
            value={formData.reason}
            onChange={(event) => {
              onClearFieldError('reason');
              onChange({ ...formData, reason: event.target.value });
            }}
            placeholder="Opcional"
          />
          <div className="md:col-span-2">
            <Input
              label="Observacoes"
              error={fieldErrors.notes}
              value={formData.notes}
              onChange={(event) => {
                onClearFieldError('notes');
                onChange({ ...formData, notes: event.target.value });
              }}
              placeholder="Opcional"
            />
          </div>
        </div>

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
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {isEntry ? 'Confirmar entrada' : 'Confirmar saida'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

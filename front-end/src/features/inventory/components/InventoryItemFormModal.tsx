import React from 'react';
import { Loader2, Plus } from 'lucide-react';
import Modal from '../../../components/Modal';
import Input from '../../../shared/ui/Input';
import { FormAlert, hasRenderableFieldErrors, hasRequiredFieldsFilled, useFormErrorFocus } from '../../../shared/forms';
import { InventoryItemFormData, InventoryItemFormField } from '../hooks/useInventoryForms';
import { FormFieldErrors } from '../../../lib/errors';

interface InventoryItemFormModalProps {
  isOpen: boolean;
  editing: boolean;
  submitError: string;
  fieldErrors: FormFieldErrors<InventoryItemFormField>;
  isSubmitting: boolean;
  formData: InventoryItemFormData;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: InventoryItemFormData) => void;
  onClearFieldError: (field: InventoryItemFormField) => void;
}

export default function InventoryItemFormModal({
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
}: InventoryItemFormModalProps) {
  const hasFieldErrors = hasRenderableFieldErrors(fieldErrors);
  const formMessage = submitError || (hasFieldErrors ? 'Revise os campos destacados antes de salvar.' : '');
  const canSubmit = hasRequiredFieldsFilled(formData, ['name']);
  const { formRef, alertRef } = useFormErrorFocus({
    enabled: isOpen,
    fieldErrors,
    message: formMessage,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Editar peca' : 'Nova peca'}>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        <div ref={alertRef}>
          <FormAlert message={formMessage} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Descricao da peca"
            required
            error={fieldErrors.name}
            value={formData.name}
            onChange={(event) => {
              onClearFieldError('name');
              onChange({ ...formData, name: event.target.value });
            }}
            placeholder="Ex: Filtro de oleo"
          />
          <Input
            label="Codigo"
            error={fieldErrors.code}
            value={formData.code}
            onChange={(event) => {
              onClearFieldError('code');
              onChange({ ...formData, code: event.target.value });
            }}
            placeholder="Opcional"
          />
          <Input
            label="Categoria"
            error={fieldErrors.category}
            value={formData.category}
            onChange={(event) => {
              onClearFieldError('category');
              onChange({ ...formData, category: event.target.value });
            }}
            placeholder="Opcional"
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
          />
          {!editing ? (
            <Input
              label="Saldo inicial"
              type="number"
              error={fieldErrors.quantity}
              hint="Gera um movimento de entrada de saldo inicial."
              value={formData.quantity}
              onChange={(event) => {
                onClearFieldError('quantity');
                onChange({ ...formData, quantity: event.target.value });
              }}
            />
          ) : null}
          <Input
            label="Estoque minimo"
            type="number"
            error={fieldErrors.minQuantity}
            hint="Alerta quando o saldo ficar igual ou abaixo deste valor."
            value={formData.minQuantity}
            onChange={(event) => {
              onClearFieldError('minQuantity');
              onChange({ ...formData, minQuantity: event.target.value });
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

        {editing ? (
          <p className="text-xs text-on-surface-variant">
            O saldo so muda por movimentacoes de entrada e saida, mantendo o historico do estoque.
          </p>
        ) : null}

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
            {editing ? 'Salvar alteracoes' : 'Cadastrar peca'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

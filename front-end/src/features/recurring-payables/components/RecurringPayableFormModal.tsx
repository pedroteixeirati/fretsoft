import React from 'react';
import { Loader2, Plus } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import Modal from '../../../components/Modal';
import Input from '../../../shared/ui/Input';
import { FieldLabel, FormAlert, FormDatePicker, hasRenderableFieldErrors, hasRequiredFieldsFilled, useFormErrorFocus } from '../../../shared/forms';
import { RecurringPayableFormData, RecurringPayableFormField } from '../hooks/useRecurringPayableForm';
import { FormFieldErrors } from '../../../lib/errors';

interface RecurringPayableFormModalProps {
  isOpen: boolean;
  editing: boolean;
  submitError: string;
  fieldErrors: FormFieldErrors<RecurringPayableFormField>;
  isSubmitting: boolean;
  formData: RecurringPayableFormData;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: RecurringPayableFormData) => void;
  onClearFieldError: (field: RecurringPayableFormField) => void;
}

const dueDayOptions = Array.from({ length: 31 }, (_, index) => ({
  value: String(index + 1),
  label: `Dia ${index + 1}`,
}));

export default function RecurringPayableFormModal({
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
}: RecurringPayableFormModalProps) {
  const hasFieldErrors = hasRenderableFieldErrors(fieldErrors);
  const formMessage = submitError || (hasFieldErrors ? 'Revise os campos destacados antes de salvar.' : '');
  const canSubmit = hasRequiredFieldsFilled(formData, ['description', 'amount', 'dueDay']);
  const { formRef, alertRef } = useFormErrorFocus({
    enabled: isOpen,
    fieldErrors,
    message: formMessage,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Editar despesa recorrente' : 'Nova despesa recorrente'}>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        <div ref={alertRef}>
          <FormAlert message={formMessage} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Descricao"
            required
            error={fieldErrors.description}
            value={formData.description}
            onChange={(event) => {
              onClearFieldError('description');
              onChange({ ...formData, description: event.target.value });
            }}
            placeholder="Ex: Aluguel da garagem"
          />
          <Input
            label="Fornecedor"
            error={fieldErrors.providerName}
            value={formData.providerName}
            onChange={(event) => {
              onClearFieldError('providerName');
              onChange({ ...formData, providerName: event.target.value });
            }}
            placeholder="Opcional"
          />
          <Input
            label="Valor mensal (R$)"
            type="number"
            required
            error={fieldErrors.amount}
            hint="Para contas que variam (agua, luz), informe uma estimativa e ajuste na conta gerada."
            value={formData.amount}
            onChange={(event) => {
              onClearFieldError('amount');
              onChange({ ...formData, amount: event.target.value });
            }}
          />
          <div className="space-y-2">
            <FieldLabel required>Dia do vencimento</FieldLabel>
            <CustomSelect
              value={formData.dueDay}
              onChange={(value) => {
                onClearFieldError('dueDay');
                onChange({ ...formData, dueDay: value });
              }}
              error={fieldErrors.dueDay}
              options={dueDayOptions}
            />
          </div>
          <FormDatePicker
            label="Inicio da vigencia"
            error={fieldErrors.startsOn}
            value={formData.startsOn}
            onChange={(value) => {
              onClearFieldError('startsOn');
              onChange({ ...formData, startsOn: value });
            }}
          />
          <FormDatePicker
            label="Fim da vigencia"
            error={fieldErrors.endsOn}
            value={formData.endsOn}
            onChange={(value) => {
              onClearFieldError('endsOn');
              onChange({ ...formData, endsOn: value });
            }}
          />
          {editing ? (
            <div className="space-y-2">
              <FieldLabel>Situacao</FieldLabel>
              <CustomSelect
                value={formData.status}
                onChange={(value) => {
                  onClearFieldError('status');
                  onChange({ ...formData, status: value as RecurringPayableFormData['status'] });
                }}
                error={fieldErrors.status}
                options={[
                  { value: 'active', label: 'Ativa' },
                  { value: 'paused', label: 'Pausada' },
                ]}
              />
            </div>
          ) : null}
          <div className={editing ? '' : 'md:col-span-2'}>
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
            {editing ? 'Salvar alteracoes' : 'Cadastrar despesa'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

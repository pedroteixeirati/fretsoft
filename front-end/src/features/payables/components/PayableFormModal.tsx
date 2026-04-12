import React from 'react';
import { Loader2, Plus } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import Modal from '../../../components/Modal';
import { FieldLabel, FormAlert, FormDatePicker, FormFieldError, hasRenderableFieldErrors, hasRequiredFieldsFilled, useFormErrorFocus } from '../../../shared/forms';
import Input from '../../../shared/ui/Input';
import { FormFieldErrors } from '../../../lib/errors';
import { Company } from '../../companies/types/company.types';
import { Payable } from '../types/payable.types';
import { Vehicle } from '../../vehicles/types/vehicle.types';
import { PayableFormData, PayableFormField } from '../hooks/usePayableForm';

interface PayableFormModalProps {
  isOpen: boolean;
  editing: boolean;
  submitError: string;
  fieldErrors: FormFieldErrors<PayableFormField>;
  formData: PayableFormData;
  isSubmitting: boolean;
  vehicles: Vehicle[];
  companies: Company[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: PayableFormData) => void;
  onClearFieldError: (field: PayableFormField) => void;
}

export default function PayableFormModal({
  isOpen,
  editing,
  submitError,
  fieldErrors,
  formData,
  isSubmitting,
  vehicles,
  companies,
  onClose,
  onSubmit,
  onChange,
  onClearFieldError,
}: PayableFormModalProps) {
  const hasFieldErrors = hasRenderableFieldErrors(fieldErrors);
  const formMessage = submitError || (hasFieldErrors ? 'Revise os campos destacados antes de salvar.' : '');
  const canSubmit = hasRequiredFieldsFilled(formData, [
    'description',
    { field: 'amount', isFilled: (value) => Number(value) > 0 },
    'dueDate',
  ]) && (formData.sourceType !== 'expense' || formData.sourceId.trim().length > 0);
  const { formRef, alertRef } = useFormErrorFocus({
    enabled: isOpen,
    fieldErrors,
    message: formMessage,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Editar conta a pagar' : 'Nova conta a pagar'}>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        <div ref={alertRef}>
          <FormAlert message={formMessage} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Input
            required
            label="Descricao"
            error={fieldErrors.description}
            value={formData.description}
            onChange={(event) => {
              onClearFieldError('description');
              onChange({ ...formData, description: event.target.value });
            }}
            placeholder="Ex: Manutencao preventiva"
          />

          <Input
            label="Fornecedor"
            error={fieldErrors.providerName}
            value={formData.providerName}
            onChange={(event) => {
              onClearFieldError('providerName');
              onChange({ ...formData, providerName: event.target.value });
            }}
            placeholder="Ex: Oficina Diesel Centro"
          />

          <div className="space-y-2">
            <FieldLabel required>Origem</FieldLabel>
            <CustomSelect
              value={formData.sourceType}
              onChange={(value) =>
                {
                  onClearFieldError('sourceType');
                  onClearFieldError('sourceId');
                  onChange({
                    ...formData,
                    sourceType: value as PayableFormData['sourceType'],
                    sourceId: value === 'manual' ? '' : formData.sourceId,
                  });
                }
              }
              error={fieldErrors.sourceType}
              options={[
                { value: 'manual', label: 'Manual' },
                { value: 'expense', label: 'Custo operacional' },
              ]}
            />
          </div>

          <Input
            label="ID da origem"
            error={fieldErrors.sourceId}
            value={formData.sourceId}
            onChange={(event) => {
              onClearFieldError('sourceId');
              onChange({ ...formData, sourceId: event.target.value });
            }}
            placeholder="UUID do custo operacional"
            disabled={formData.sourceType === 'manual'}
            required={formData.sourceType === 'expense'}
          />

          <div className="space-y-2">
            <FieldLabel>Veiculo</FieldLabel>
            <CustomSelect
              value={formData.vehicleId}
              onChange={(value) => {
                onClearFieldError('vehicleId');
                onChange({ ...formData, vehicleId: value });
              }}
              error={fieldErrors.vehicleId}
              placeholder="Nao vincular"
              options={vehicles.map((vehicle) => ({
                value: vehicle.id,
                label: `${vehicle.name} (${vehicle.plate})`,
              }))}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel>Empresa</FieldLabel>
            <CustomSelect
              value={formData.contractId}
              onChange={(value) => {
                onClearFieldError('contractId');
                onChange({ ...formData, contractId: value });
              }}
              error={fieldErrors.contractId}
              placeholder="Nao vincular"
              options={companies.map((company) => ({
                value: company.id,
                label: company.tradeName,
              }))}
            />
          </div>

          <Input
            required
            type="number"
            step="0.01"
            label="Valor"
            error={fieldErrors.amount}
            value={String(formData.amount)}
            onChange={(event) => {
              onClearFieldError('amount');
              onChange({ ...formData, amount: Number(event.target.value) });
            }}
          />

          <FormDatePicker
            required
            label="Vencimento"
            error={fieldErrors.dueDate}
            value={formData.dueDate}
            onChange={(value) => {
              onClearFieldError('dueDate');
              onChange({ ...formData, dueDate: value });
            }}
          />

          <div className="space-y-2">
            <FieldLabel required>Status</FieldLabel>
            <CustomSelect
              value={formData.status}
              onChange={(value) => {
                onClearFieldError('status');
                onClearFieldError('paidAt');
                onChange({ ...formData, status: value as Payable['status'] });
              }}
              error={fieldErrors.status}
              options={[
                { value: 'open', label: 'Em aberto' },
                { value: 'paid', label: 'Paga' },
                { value: 'overdue', label: 'Em atraso' },
                { value: 'canceled', label: 'Cancelada' },
              ]}
            />
          </div>

          <FormDatePicker
            label="Data do pagamento"
            error={fieldErrors.paidAt}
            value={formData.paidAt}
            onChange={(value) => {
              onClearFieldError('paidAt');
              onChange({ ...formData, paidAt: value });
            }}
            required={false}
            disabled={formData.status !== 'paid'}
          />

          <Input
            label="Forma de pagamento"
            error={fieldErrors.paymentMethod}
            value={formData.paymentMethod}
            onChange={(event) => {
              onClearFieldError('paymentMethod');
              onChange({ ...formData, paymentMethod: event.target.value });
            }}
            placeholder="Ex: PIX, boleto, transferencia"
          />

          <Input
            label="Comprovante (URL)"
            error={fieldErrors.proofUrl}
            value={formData.proofUrl}
            onChange={(event) => {
              onClearFieldError('proofUrl');
              onChange({ ...formData, proofUrl: event.target.value });
            }}
            placeholder="https://..."
          />

          <div className="space-y-2 md:col-span-2">
            <FieldLabel required={false}>Observacoes</FieldLabel>
            <textarea
              className={`min-h-[110px] w-full rounded-2xl bg-surface px-4 py-3.5 text-on-surface outline-none ring-1 transition-all placeholder:text-on-surface-variant/65 focus:ring-2 ${
                fieldErrors.notes ? 'ring-error/35 focus:ring-error/20' : 'ring-primary/5 focus:ring-primary/20'
              } resize-none`}
              value={formData.notes}
              onChange={(event) => {
                onClearFieldError('notes');
                onChange({ ...formData, notes: event.target.value });
              }}
              placeholder="Contexto financeiro, acordo com fornecedor, observacoes de pagamento..."
            />
            <FormFieldError message={fieldErrors.notes} />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-8 py-3 font-bold text-on-surface-variant hover:bg-surface-container"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              {editing ? 'Salvar alteracoes' : 'Criar conta a pagar'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

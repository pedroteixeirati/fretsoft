import React, { useMemo } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import Modal from '../../../components/Modal';
import Input from '../../../shared/ui/Input';
import { FieldLabel, FormAlert, FormDatePicker, hasRenderableFieldErrors, hasRequiredFieldsFilled, useFormErrorFocus } from '../../../shared/forms';
import { Vehicle } from '../../vehicles/types/vehicle.types';
import { InventoryItem } from '../../inventory/types/inventory.types';
import { ServiceOrderFormData, ServiceOrderFormField, ServiceOrderItemFormData, createEmptyItem } from '../hooks/useServiceOrderForm';
import { ServiceOrderItemType } from '../types/service-order.types';
import { FormFieldErrors } from '../../../lib/errors';

interface ServiceOrderFormModalProps {
  isOpen: boolean;
  editing: boolean;
  submitError: string;
  fieldErrors: FormFieldErrors<ServiceOrderFormField>;
  isSubmitting: boolean;
  formData: ServiceOrderFormData;
  vehicles: Vehicle[];
  inventoryItems: InventoryItem[];
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onChange: (next: ServiceOrderFormData) => void;
  onClearFieldError: (field: ServiceOrderFormField) => void;
}

function parseNumber(value: string) {
  const numeric = Number(String(value).replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ServiceOrderFormModal({
  isOpen,
  editing,
  submitError,
  fieldErrors,
  isSubmitting,
  formData,
  vehicles,
  inventoryItems,
  onClose,
  onSubmit,
  onChange,
  onClearFieldError,
}: ServiceOrderFormModalProps) {
  const hasFieldErrors = hasRenderableFieldErrors(fieldErrors);
  const formMessage = submitError || (hasFieldErrors ? 'Revise os campos destacados antes de salvar.' : '');
  const canSubmit = hasRequiredFieldsFilled(formData, ['vehicleId', 'openedOn', 'description']);
  const { formRef, alertRef } = useFormErrorFocus({
    enabled: isOpen,
    fieldErrors,
    message: formMessage,
  });

  const total = useMemo(
    () => formData.items.reduce((sum, item) => sum + parseNumber(item.quantity) * parseNumber(item.unitAmount), 0),
    [formData.items],
  );

  const updateItem = (index: number, patch: Partial<ServiceOrderItemFormData>) => {
    onClearFieldError('items');
    const items = formData.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    onChange({ ...formData, items });
  };

  const addItem = (itemType: ServiceOrderItemType) => {
    onClearFieldError('items');
    onChange({ ...formData, items: [...formData.items, createEmptyItem(itemType)] });
  };

  const linkInventory = (index: number, inventoryItemId: string) => {
    const selected = inventoryItems.find((option) => option.id === inventoryItemId);
    const item = formData.items[index];
    updateItem(index, {
      inventoryItemId,
      // Autopreenche descricao/valor a partir da peca quando ainda vazios.
      description: selected && !item.description.trim() ? selected.name : item.description,
      unitAmount: selected && !item.unitAmount.trim() ? String(selected.unitCost) : item.unitAmount,
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    onChange({ ...formData, items: formData.items.filter((_, itemIndex) => itemIndex !== index) });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Editar ordem de servico' : 'Nova ordem de servico'}>
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
            <FieldLabel>Status</FieldLabel>
            <CustomSelect
              value={formData.status}
              onChange={(value) => {
                onClearFieldError('status');
                onChange({ ...formData, status: value as ServiceOrderFormData['status'] });
              }}
              error={fieldErrors.status}
              options={[
                { value: 'open', label: 'Aberta' },
                { value: 'in_progress', label: 'Em andamento' },
                { value: 'completed', label: 'Concluida' },
                { value: 'canceled', label: 'Cancelada' },
              ]}
            />
          </div>
          <Input
            label="Oficina / Mecanico responsavel"
            error={fieldErrors.providerName}
            value={formData.providerName}
            onChange={(event) => {
              onClearFieldError('providerName');
              onChange({ ...formData, providerName: event.target.value });
            }}
            placeholder="Opcional"
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
            label="Data de abertura"
            required
            error={fieldErrors.openedOn}
            value={formData.openedOn}
            onChange={(value) => {
              onClearFieldError('openedOn');
              onChange({ ...formData, openedOn: value });
            }}
          />
          <FormDatePicker
            label="Data de conclusao"
            error={fieldErrors.closedOn}
            value={formData.closedOn}
            onChange={(value) => {
              onClearFieldError('closedOn');
              onChange({ ...formData, closedOn: value });
            }}
          />
          <div className="md:col-span-2">
            <Input
              label="Descricao do servico"
              required
              error={fieldErrors.description}
              value={formData.description}
              onChange={(event) => {
                onClearFieldError('description');
                onChange({ ...formData, description: event.target.value });
              }}
              placeholder="Ex: Revisao de freios e suspensao dianteira"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="font-headline text-sm font-bold text-on-surface">Itens da ordem</h4>
              <p className="text-xs text-on-surface-variant">Adicione pecas e mao de obra com fornecedor e valor.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addItem('part')}
                className="flex items-center gap-1 rounded-full border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" /> Peca
              </button>
              <button
                type="button"
                onClick={() => addItem('labor')}
                className="flex items-center gap-1 rounded-full border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" /> Mao de obra
              </button>
            </div>
          </div>

          {fieldErrors.items ? (
            <p className="mb-3 text-xs font-medium text-error">{fieldErrors.items}</p>
          ) : null}

          <div className="space-y-3">
            {formData.items.map((item, index) => {
              const lineTotal = parseNumber(item.quantity) * parseNumber(item.unitAmount);
              return (
                <div key={index} className="rounded-xl border border-outline-variant/20 bg-surface p-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
                    <div className="space-y-1 sm:col-span-2">
                      <FieldLabel>Tipo</FieldLabel>
                      <CustomSelect
                        value={item.itemType}
                        onChange={(value) => updateItem(index, { itemType: value as ServiceOrderItemType })}
                        options={[
                          { value: 'part', label: 'Peca' },
                          { value: 'labor', label: 'Mao de obra' },
                        ]}
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <Input
                        label="Descricao"
                        value={item.description}
                        onChange={(event) => updateItem(index, { description: event.target.value })}
                        placeholder={item.itemType === 'part' ? 'Ex: Filtro de oleo' : 'Ex: Troca de oleo'}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        label="Fornecedor / Mecanico"
                        value={item.supplierName}
                        onChange={(event) => updateItem(index, { supplierName: event.target.value })}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Input
                        label="Qtd"
                        type="number"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, { quantity: event.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        label="Valor unit."
                        type="number"
                        value={item.unitAmount}
                        onChange={(event) => updateItem(index, { unitAmount: event.target.value })}
                      />
                    </div>
                    <div className="flex items-center justify-between sm:col-span-1 sm:justify-end">
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
                  {item.itemType === 'part' ? (
                    <div className="mt-3 space-y-1">
                      <FieldLabel>Vincular peca do almoxarifado (baixa automatica do estoque)</FieldLabel>
                      <CustomSelect
                        value={item.inventoryItemId}
                        onChange={(value) => linkInventory(index, value)}
                        options={[
                          { value: '', label: 'Nao vincular ao estoque' },
                          ...inventoryItems.map((option) => ({
                            value: option.id,
                            label: `${option.name}${option.code ? ` (${option.code})` : ''} — saldo ${option.quantity}`,
                          })),
                        ]}
                      />
                    </div>
                  ) : null}
                  <p className="mt-2 text-right text-xs font-medium text-on-surface-variant">
                    Subtotal: {formatCurrency(lineTotal)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-outline-variant/20 pt-4">
            <span className="text-sm font-medium text-on-surface-variant">Total da ordem:</span>
            <span className="text-lg font-black tracking-tight text-on-surface">{formatCurrency(total)}</span>
          </div>
        </div>

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
            {editing ? 'Salvar alteracoes' : 'Criar ordem de servico'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

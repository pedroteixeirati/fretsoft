import { useState } from 'react';
import { FormFieldErrors } from '../../../lib/errors';
import { InventoryItem, InventoryMovementType } from '../types/inventory.types';

export type InventoryItemFormData = {
  code: string;
  name: string;
  category: string;
  unitCost: string;
  quantity: string;
  minQuantity: string;
  notes: string;
};

export type InventoryItemFormField = keyof InventoryItemFormData;

export const defaultInventoryItemFormData: InventoryItemFormData = {
  code: '',
  name: '',
  category: '',
  unitCost: '',
  quantity: '0',
  minQuantity: '',
  notes: '',
};

export type InventoryMovementFormData = {
  movementType: InventoryMovementType;
  quantity: string;
  unitCost: string;
  occurredOn: string;
  reason: string;
  notes: string;
};

export type InventoryMovementFormField = keyof InventoryMovementFormData;

export function createDefaultMovementFormData(): InventoryMovementFormData {
  return {
    movementType: 'in',
    quantity: '',
    unitCost: '',
    occurredOn: '',
    reason: '',
    notes: '',
  };
}

export function useInventoryItemForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<InventoryItemFormData>(defaultInventoryItemFormData);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<InventoryItemFormField>>({});
  const [submitError, setSubmitError] = useState('');

  const openCreate = () => {
    setEditingItem(null);
    setFormData(defaultInventoryItemFormData);
    setFieldErrors({});
    setSubmitError('');
    setIsOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code || '',
      name: item.name,
      category: item.category || '',
      unitCost: String(item.unitCost ?? ''),
      quantity: String(item.quantity ?? '0'),
      minQuantity: item.minQuantity !== null && item.minQuantity !== undefined ? String(item.minQuantity) : '',
      notes: item.notes || '',
    });
    setFieldErrors({});
    setSubmitError('');
    setIsOpen(true);
  };

  const close = () => {
    setEditingItem(null);
    setFormData(defaultInventoryItemFormData);
    setFieldErrors({});
    setSubmitError('');
    setIsOpen(false);
  };

  return {
    isOpen,
    editingItem,
    formData,
    setFormData,
    fieldErrors,
    setFieldErrors,
    submitError,
    setSubmitError,
    openCreate,
    openEdit,
    close,
  };
}

export function useInventoryMovementForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [targetItem, setTargetItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<InventoryMovementFormData>(createDefaultMovementFormData());
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<InventoryMovementFormField>>({});
  const [submitError, setSubmitError] = useState('');

  const open = (item: InventoryItem, movementType: InventoryMovementType) => {
    setTargetItem(item);
    setFormData({ ...createDefaultMovementFormData(), movementType, unitCost: String(item.unitCost ?? '') });
    setFieldErrors({});
    setSubmitError('');
    setIsOpen(true);
  };

  const close = () => {
    setTargetItem(null);
    setFormData(createDefaultMovementFormData());
    setFieldErrors({});
    setSubmitError('');
    setIsOpen(false);
  };

  return {
    isOpen,
    targetItem,
    formData,
    setFormData,
    fieldErrors,
    setFieldErrors,
    submitError,
    setSubmitError,
    open,
    close,
  };
}

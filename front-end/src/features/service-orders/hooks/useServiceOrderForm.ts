import { useState } from 'react';
import { FormFieldErrors } from '../../../lib/errors';
import { ServiceOrder, ServiceOrderItemType, ServiceOrderStatus } from '../types/service-order.types';

export interface ServiceOrderItemFormData {
  itemType: ServiceOrderItemType;
  description: string;
  quantity: string;
  unitAmount: string;
  supplierName: string;
  notes: string;
}

export type ServiceOrderFormData = {
  vehicleId: string;
  status: ServiceOrderStatus;
  openedOn: string;
  closedOn: string;
  odometer: string;
  providerName: string;
  description: string;
  notes: string;
  items: ServiceOrderItemFormData[];
};

export type ServiceOrderFormField =
  | 'vehicleId'
  | 'status'
  | 'openedOn'
  | 'closedOn'
  | 'odometer'
  | 'providerName'
  | 'description'
  | 'notes'
  | 'items';

export function createEmptyItem(itemType: ServiceOrderItemType = 'part'): ServiceOrderItemFormData {
  return {
    itemType,
    description: '',
    quantity: '1',
    unitAmount: '',
    supplierName: '',
    notes: '',
  };
}

export const defaultServiceOrderFormData: ServiceOrderFormData = {
  vehicleId: '',
  status: 'open',
  openedOn: '',
  closedOn: '',
  odometer: '',
  providerName: '',
  description: '',
  notes: '',
  items: [createEmptyItem('part')],
};

export function useServiceOrderForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceOrder, setEditingServiceOrder] = useState<ServiceOrder | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<ServiceOrderFormField>>({});
  const [formData, setFormData] = useState<ServiceOrderFormData>(defaultServiceOrderFormData);

  const openCreate = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setEditingServiceOrder(null);
    setFormData(defaultServiceOrderFormData);
    setIsModalOpen(true);
  };

  const openEdit = (serviceOrder: ServiceOrder) => {
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setEditingServiceOrder(serviceOrder);
    setFormData({
      vehicleId: serviceOrder.vehicleId,
      status: serviceOrder.status,
      openedOn: serviceOrder.openedOn || '',
      closedOn: serviceOrder.closedOn || '',
      odometer: serviceOrder.odometer !== null && serviceOrder.odometer !== undefined ? String(serviceOrder.odometer) : '',
      providerName: serviceOrder.providerName || '',
      description: serviceOrder.description || '',
      notes: serviceOrder.notes || '',
      items: serviceOrder.items.length
        ? serviceOrder.items.map((item) => ({
            itemType: item.itemType,
            description: item.description,
            quantity: String(item.quantity),
            unitAmount: String(item.unitAmount),
            supplierName: item.supplierName || '',
            notes: item.notes || '',
          }))
        : [createEmptyItem('part')],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingServiceOrder(null);
    setFormData(defaultServiceOrderFormData);
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setIsModalOpen(false);
  };

  return {
    isModalOpen,
    editingServiceOrder,
    formData,
    setFormData,
    fieldErrors,
    setFieldErrors,
    submitError,
    setSubmitError,
    submitSuccess,
    setSubmitSuccess,
    openCreate,
    openEdit,
    closeModal,
  };
}

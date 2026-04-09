import { useState } from 'react';
import { FormFieldErrors } from '../../../lib/errors';
import { Payable } from '../types/payable.types';

export interface PayableFormData {
  sourceType: 'manual' | 'expense';
  sourceId: string;
  description: string;
  providerName: string;
  vehicleId: string;
  contractId: string;
  amount: number;
  dueDate: string;
  status: Payable['status'];
  paidAt: string;
  paymentMethod: string;
  proofUrl: string;
  notes: string;
}

export type PayableFormField =
  | 'sourceType'
  | 'sourceId'
  | 'description'
  | 'providerName'
  | 'vehicleId'
  | 'contractId'
  | 'amount'
  | 'dueDate'
  | 'status'
  | 'paidAt'
  | 'paymentMethod'
  | 'proofUrl'
  | 'notes';

export function defaultPayableFormData(): PayableFormData {
  const today = new Date().toISOString().split('T')[0];

  return {
    sourceType: 'manual',
    sourceId: '',
    description: '',
    providerName: '',
    vehicleId: '',
    contractId: '',
    amount: 0,
    dueDate: today,
    status: 'open',
    paidAt: '',
    paymentMethod: '',
    proofUrl: '',
    notes: '',
  };
}

export function usePayableForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayable, setEditingPayable] = useState<Payable | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<PayableFormField>>({});
  const [formData, setFormData] = useState<PayableFormData>(defaultPayableFormData());

  const openCreate = () => {
    setEditingPayable(null);
    setFormData(defaultPayableFormData());
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (payable: Payable) => {
    setEditingPayable(payable);
    setFormData({
      sourceType: payable.sourceType,
      sourceId: payable.sourceId || '',
      description: payable.description,
      providerName: payable.providerName || '',
      vehicleId: payable.vehicleId || '',
      contractId: payable.contractId || '',
      amount: Number(payable.amount || 0),
      dueDate: payable.dueDate,
      status: payable.status,
      paidAt: payable.paidAt || '',
      paymentMethod: payable.paymentMethod || '',
      proofUrl: payable.proofUrl || '',
      notes: payable.notes || '',
    });
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPayable(null);
    setFormData(defaultPayableFormData());
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
  };

  return {
    isModalOpen,
    editingPayable,
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

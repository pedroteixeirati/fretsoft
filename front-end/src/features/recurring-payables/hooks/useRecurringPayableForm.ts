import { useState } from 'react';
import { FormFieldErrors } from '../../../lib/errors';
import { RecurringPayable } from '../types/recurring-payable.types';

export type RecurringPayableFormData = {
  description: string;
  providerName: string;
  amount: string;
  dueDay: string;
  startsOn: string;
  endsOn: string;
  status: RecurringPayable['status'];
  notes: string;
};

export type RecurringPayableFormField =
  | 'description'
  | 'providerName'
  | 'amount'
  | 'dueDay'
  | 'startsOn'
  | 'endsOn'
  | 'status'
  | 'notes';

export const defaultRecurringPayableFormData: RecurringPayableFormData = {
  description: '',
  providerName: '',
  amount: '',
  dueDay: '5',
  startsOn: '',
  endsOn: '',
  status: 'active',
  notes: '',
};

export function useRecurringPayableForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecurringPayable, setEditingRecurringPayable] = useState<RecurringPayable | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<RecurringPayableFormField>>({});
  const [formData, setFormData] = useState<RecurringPayableFormData>(defaultRecurringPayableFormData);

  const openCreate = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setEditingRecurringPayable(null);
    setFormData(defaultRecurringPayableFormData);
    setIsModalOpen(true);
  };

  const openEdit = (recurringPayable: RecurringPayable) => {
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setEditingRecurringPayable(recurringPayable);
    setFormData({
      description: recurringPayable.description,
      providerName: recurringPayable.providerName || '',
      amount: String(recurringPayable.amount ?? ''),
      dueDay: String(recurringPayable.dueDay ?? '1'),
      startsOn: recurringPayable.startsOn || '',
      endsOn: recurringPayable.endsOn || '',
      status: recurringPayable.status,
      notes: recurringPayable.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingRecurringPayable(null);
    setFormData(defaultRecurringPayableFormData);
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setIsModalOpen(false);
  };

  return {
    isModalOpen,
    editingRecurringPayable,
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

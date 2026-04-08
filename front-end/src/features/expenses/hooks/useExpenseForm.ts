import { useMemo, useState } from 'react';
import { Expense } from '../types/expense.types';
import { Provider } from '../../providers/types/provider.types';

export interface ExpenseFormData {
  date: string;
  time: string;
  vehicleId: string;
  vehicleName: string;
  provider: string;
  category: string;
  quantity: string;
  amount: number;
  odometer: string;
  status: Expense['status'];
  paymentRequired: boolean;
  dueDate: string;
  linkedPayableId: string | null;
  observations: string;
}

export function defaultExpenseFormData() {
  return {
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    vehicleId: '',
    vehicleName: '',
    provider: '',
    category: 'Combustivel',
    quantity: '',
    amount: 0,
    odometer: '',
    status: 'approved' as const,
    paymentRequired: false,
    dueDate: '',
    linkedPayableId: null as string | null,
    observations: '',
  } satisfies ExpenseFormData;
}

interface UseExpenseFormOptions {
  providers: Provider[];
}

export function useExpenseForm({ providers }: UseExpenseFormOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [formData, setFormData] = useState<ExpenseFormData>(defaultExpenseFormData());

  const providerOptions = useMemo(() => {
    const orderedProviders = [...providers].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));

    const options = orderedProviders.map((provider) => ({
      value: provider.name,
      label: provider.name,
    }));

    if (formData.provider && !options.some((option) => option.value === formData.provider)) {
      options.unshift({ value: formData.provider, label: formData.provider });
    }

    return options;
  }, [providers, formData.provider]);

  const openCreate = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setEditingExpense(null);
    setFormData(defaultExpenseFormData());
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    setSubmitError('');
    setFormData(defaultExpenseFormData());
  };

  const openEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      time: expense.time,
      vehicleId: expense.vehicleId,
      vehicleName: expense.vehicleName,
      provider: expense.provider,
      category: expense.category,
      quantity: expense.quantity || '',
      amount: Number(expense.amount || 0),
      odometer: expense.odometer || '',
      status: expense.status,
      paymentRequired: Boolean(expense.paymentRequired),
      dueDate: expense.dueDate || '',
      linkedPayableId: expense.linkedPayableId || null,
      observations: expense.observations || '',
    });
    setSubmitError('');
    setSubmitSuccess('');
    setIsModalOpen(true);
  };

  return {
    isModalOpen,
    editingExpense,
    formData,
    setFormData,
    submitError,
    setSubmitError,
    submitSuccess,
    setSubmitSuccess,
    providerOptions,
    openCreate,
    openEdit,
    closeModal,
  };
}

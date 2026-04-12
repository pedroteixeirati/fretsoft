import React, { useEffect, useMemo, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FormFieldErrors } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { getErrorMessage } from '../../../lib/errors';
import { NavItem } from '../../../shared/types/common.types';
import { useFirebase } from '../../../context/FirebaseContext';
import { clearFieldError } from '../../../shared/forms';
import { useExpenseMutations } from '../hooks/useExpenseMutations';
import { useExpensesQuery } from '../hooks/useExpensesQuery';
import { ExpenseFormField, useExpenseForm } from '../hooks/useExpenseForm';
import ExpensesHeader from '../components/ExpensesHeader';
import ExpensesStats from '../components/ExpensesStats';
import ExpensesFilters from '../components/ExpensesFilters';
import ExpensesTable from '../components/ExpensesTable';
import ExpenseFormModal from '../components/ExpenseFormModal';
import ExpensesInsights from '../components/ExpensesInsights';

interface ExpensesPageProps {
  onNavigate: (item: NavItem) => void;
}

export default function ExpensesPage({ onNavigate }: ExpensesPageProps) {
  const { user, userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'expenses', 'create');
  const canUpdate = canAccess(userProfile, 'expenses', 'update');
  const canDelete = canAccess(userProfile, 'expenses', 'delete');
  const canReadProviders = canAccess(userProfile, 'providers', 'read');

  const [searchTerm, setSearchTerm] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { expenses, vehicles, providers, isLoading: loading, error: loadQueryError } = useExpensesQuery({
    enabled: Boolean(user),
    canReadProviders,
  });
  const { createExpense, updateExpense, deleteExpense, isSubmitting } = useExpenseMutations();
  const {
    isModalOpen,
    editingExpense,
    formData,
    setFormData,
    fieldErrors,
    setFieldErrors,
    submitError,
    setSubmitError,
    submitSuccess,
    setSubmitSuccess,
    providerOptions,
    openCreate,
    openEdit,
    closeModal,
  } = useExpenseForm({ providers });

  const loadError = loadQueryError ? getErrorMessage(loadQueryError, 'Nao foi possivel carregar os custos operacionais.') : '';

  useEffect(() => {
    if (expenses.length > 0 && !aiSummary && !aiLoading) {
      void generateAiSummary();
    }
  }, [expenses]);

  const generateAiSummary = async () => {
    if (expenses.length === 0) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      setAiSummary('Os custos operacionais ja podem ser analisados pelos relatorios. Se quiser um resumo automatico por IA, configure a chave do Gemini no ambiente.');
      return;
    }

    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const total = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
      const byCategory = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount || 0);
        return acc;
      }, {} as Record<string, number>);
      const formatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 });
      const categorySummary = Object.entries(byCategory)
        .map(([category, value]) => `${category}: R$ ${formatter.format(value)}`)
        .join(', ');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Resuma em no maximo 2 frases os custos operacionais da frota. Total: R$ ${formatter.format(total)}. Lancamentos: ${expenses.length}. Categorias: ${categorySummary}. Tom profissional e direto, em portugues do Brasil.`,
      });

      setAiSummary(response.text || 'Analise indisponivel no momento.');
    } catch (error) {
      console.error('Erro ao gerar resumo de IA:', error);
      setAiSummary('Os custos operacionais ja estao organizados por categoria e veiculo. Use os relatorios para comparar recorrencia e impacto por caminhao.');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredExpenses = useMemo(() => (
    expenses.filter((expense) =>
      expense.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  ), [expenses, searchTerm]);

  const totalAmount = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const fuelAmount = filteredExpenses
    .filter((expense) => expense.category.toLowerCase().includes('combust'))
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const maintenanceAmount = filteredExpenses
    .filter((expense) => expense.category.toLowerCase().includes('manut'))
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const pendingCount = filteredExpenses.filter((expense) => expense.status === 'pending').length;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});

    const nextFieldErrors: FormFieldErrors<ExpenseFormField> = {};

    if (!formData.date) nextFieldErrors.date = 'Informe a data do custo operacional.';
    if (!formData.time) nextFieldErrors.time = 'Informe a hora do custo operacional.';
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === formData.vehicleId);
    if (!selectedVehicle) nextFieldErrors.vehicleId = 'Selecione um veiculo cadastrado para registrar o custo operacional.';
    if (!formData.provider.trim()) nextFieldErrors.provider = 'Selecione um fornecedor para registrar o custo operacional.';
    if (!formData.category.trim()) nextFieldErrors.category = 'Selecione uma categoria para o custo operacional.';
    if (!Number.isFinite(Number(formData.amount)) || Number(formData.amount) <= 0) nextFieldErrors.amount = 'Informe um valor total maior que zero para o custo operacional.';
    if (formData.paymentRequired && !formData.dueDate) nextFieldErrors.dueDate = 'Informe a data de vencimento para gerar a conta a pagar.';

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }
    if (editingExpense?.linkedPayableId && !formData.paymentRequired) {
      const confirmed = window.confirm('Ao remover a exigencia financeira, a conta a pagar vinculada sera excluida. Deseja continuar?');
      if (!confirmed) return;
    }
    try {
      const payload = { ...formData, vehicleName: selectedVehicle.name };
      if (editingExpense) {
        await updateExpense.mutateAsync({ id: editingExpense.id, payload });
      } else {
        await createExpense.mutateAsync(payload);
      }
      setSubmitSuccess(editingExpense ? 'Custo operacional atualizado com sucesso.' : 'Custo operacional lancado com sucesso.');
      closeModal();
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar o custo operacional.'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este custo operacional?')) return;
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await deleteExpense.mutateAsync(id);
      setSubmitSuccess('Custo operacional excluido com sucesso.');
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir o custo operacional.'));
    }
  };

  return (
    <div className="space-y-8">
      <ExpensesHeader canCreate={canCreate} onCreate={openCreate} />

      {(submitSuccess || submitError || loadError) ? (
        <div className={`rounded-2xl border px-5 py-4 text-sm font-medium ${submitError || loadError ? 'border-error/20 bg-error/5 text-error' : 'border-primary/20 bg-primary/5 text-primary'}`}>
          {submitError || loadError || submitSuccess}
        </div>
      ) : null}

      <ExpensesStats
        totalAmount={totalAmount}
        fuelAmount={fuelAmount}
        maintenanceAmount={maintenanceAmount}
        pendingCount={pendingCount}
      />

      <section className="flex flex-col overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
        <ExpensesFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredCount={filteredExpenses.length}
          totalCount={expenses.length}
        />
        <ExpensesTable
          expenses={filteredExpenses}
          loading={loading}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </section>

      <ExpenseFormModal
        isOpen={isModalOpen}
        editing={Boolean(editingExpense)}
        submitError={submitError}
        fieldErrors={fieldErrors}
        formData={formData}
        isSubmitting={isSubmitting}
        canReadProviders={canReadProviders}
        vehicles={vehicles}
        providers={providers}
        providerOptions={providerOptions}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={setFormData}
        onClearFieldError={(field) => setFieldErrors((current) => clearFieldError(current, field))}
      />

      <ExpensesInsights aiLoading={aiLoading} aiSummary={aiSummary} onNavigate={onNavigate} />
    </div>
  );
}

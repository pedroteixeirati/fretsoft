import React, { useMemo, useState } from 'react';
import { getErrorMessage, resolveFieldError } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { isValidDateInput } from '../../../lib/validation';
import { useFirebase } from '../../../context/FirebaseContext';
import { clearFieldError } from '../../../shared/forms';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import { useRecurringPayablesQuery } from '../hooks/useRecurringPayablesQuery';
import { useRecurringPayableMutations } from '../hooks/useRecurringPayableMutations';
import { useRecurringPayableForm } from '../hooks/useRecurringPayableForm';
import RecurringPayablesHeader from '../components/RecurringPayablesHeader';
import RecurringPayablesFilters from '../components/RecurringPayablesFilters';
import RecurringPayablesList from '../components/RecurringPayablesList';
import RecurringPayableFormModal from '../components/RecurringPayableFormModal';
import { RecurringPayable } from '../types/recurring-payable.types';

export default function RecurringPayablesPage() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'recurringPayables', 'create');
  const canUpdate = canAccess(userProfile, 'recurringPayables', 'update');
  const canDelete = canAccess(userProfile, 'recurringPayables', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingRecurringPayable, setDeletingRecurringPayable] = useState<RecurringPayable | null>(null);

  const { recurringPayables, isLoading: loading, error: loadQueryError } = useRecurringPayablesQuery({
    enabled: Boolean(userProfile),
  });
  const {
    createRecurringPayable,
    updateRecurringPayable,
    deleteRecurringPayable,
    generateMonthPayables,
    isSubmitting,
  } = useRecurringPayableMutations();
  const {
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
  } = useRecurringPayableForm();

  const loadError = loadQueryError
    ? getErrorMessage(loadQueryError, 'Nao foi possivel carregar as despesas recorrentes.')
    : '';

  const filteredRecurringPayables = useMemo(
    () =>
      recurringPayables.filter((recurringPayable) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          !search ||
          recurringPayable.description.toLowerCase().includes(search) ||
          recurringPayable.providerName.toLowerCase().includes(search);

        const matchesStatus = statusFilter === 'all' || recurringPayable.status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [recurringPayables, searchTerm, statusFilter],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});

    const nextFieldErrors: typeof fieldErrors = {};

    if (formData.description.trim().length < 3) {
      nextFieldErrors.description = 'Informe uma descricao valida para a despesa recorrente.';
    }
    if (formData.amount.trim() === '' || !Number.isFinite(Number(formData.amount)) || Number(formData.amount) < 0) {
      nextFieldErrors.amount = 'O valor deve ser zero ou maior.';
    }
    const dueDayNumber = Number(formData.dueDay);
    if (!Number.isInteger(dueDayNumber) || dueDayNumber < 1 || dueDayNumber > 31) {
      nextFieldErrors.dueDay = 'Informe um dia de vencimento entre 1 e 31.';
    }
    if (formData.startsOn && !isValidDateInput(formData.startsOn)) {
      nextFieldErrors.startsOn = 'Informe uma data de inicio valida.';
    }
    if (formData.endsOn && !isValidDateInput(formData.endsOn)) {
      nextFieldErrors.endsOn = 'Informe uma data de termino valida.';
    }
    if (formData.startsOn && formData.endsOn && formData.startsOn > formData.endsOn) {
      nextFieldErrors.endsOn = 'O termino da vigencia deve ser posterior ao inicio.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    const payload = {
      description: formData.description.trim(),
      providerName: formData.providerName.trim(),
      amount: Number(formData.amount),
      dueDay: dueDayNumber,
      startsOn: formData.startsOn,
      endsOn: formData.endsOn,
      status: formData.status,
      notes: formData.notes.trim(),
    };

    try {
      if (editingRecurringPayable) {
        await updateRecurringPayable.mutateAsync({ id: editingRecurringPayable.id, payload });
      } else {
        await createRecurringPayable.mutateAsync(payload);
      }

      setSubmitSuccess(
        editingRecurringPayable ? 'Despesa recorrente atualizada com sucesso.' : 'Despesa recorrente cadastrada com sucesso.',
      );
      closeModal();
    } catch (error) {
      const fieldError = resolveFieldError(error, {
        fieldMap: {
          description: 'description',
          providerName: 'providerName',
          amount: 'amount',
          dueDay: 'dueDay',
          startsOn: 'startsOn',
          endsOn: 'endsOn',
          status: 'status',
          notes: 'notes',
        },
      });

      if (fieldError?.field) {
        setFieldErrors({ [fieldError.field]: fieldError.message });
        return;
      }

      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar a despesa recorrente.'));
    }
  };

  const handleGenerate = async () => {
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const result = await generateMonthPayables.mutateAsync();
      setSubmitSuccess(
        result.created > 0
          ? `${result.created} conta(s) a pagar gerada(s) para o mes atual. Confira em Contas a pagar.`
          : 'Nenhuma conta nova: os lancamentos deste mes ja foram gerados.',
      );
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel gerar os lancamentos do mes.'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecurringPayable) return;

    setSubmitError('');
    setSubmitSuccess('');
    try {
      await deleteRecurringPayable.mutateAsync(deletingRecurringPayable.id);
      setSubmitSuccess('Despesa recorrente excluida com sucesso.');
      setDeletingRecurringPayable(null);
    } catch (error) {
      setDeletingRecurringPayable(null);
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir a despesa recorrente.'));
    }
  };

  const feedbackMessage = submitError || loadError || submitSuccess;
  const feedbackIsError = Boolean(submitError || loadError);

  return (
    <div className="space-y-10">
      <RecurringPayablesHeader
        canCreate={canCreate}
        isGenerating={generateMonthPayables.isPending}
        onCreate={openCreate}
        onGenerate={handleGenerate}
      />

      {feedbackMessage ? (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
            feedbackIsError
              ? 'border-error/20 bg-error/5 text-error'
              : 'border-primary/20 bg-primary/5 text-primary'
          }`}
        >
          {feedbackMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <RecurringPayablesFilters
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            onSearchChange={setSearchTerm}
            onStatusChange={setStatusFilter}
          />
        </div>

        <RecurringPayablesList
          recurringPayables={filteredRecurringPayables}
          loading={loading}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={openEdit}
          onDelete={setDeletingRecurringPayable}
        />
      </div>

      <RecurringPayableFormModal
        isOpen={isModalOpen}
        editing={Boolean(editingRecurringPayable)}
        submitError={submitError}
        fieldErrors={fieldErrors}
        isSubmitting={isSubmitting}
        formData={formData}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={setFormData}
        onClearFieldError={(field) => setFieldErrors((current) => clearFieldError(current, field))}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingRecurringPayable)}
        title="Excluir despesa recorrente"
        message={
          deletingRecurringPayable
            ? `Tem certeza que deseja excluir "${deletingRecurringPayable.description}"? As contas a pagar ja geradas serao mantidas; apenas os proximos meses deixam de ser gerados.`
            : ''
        }
        confirmLabel="Excluir"
        variant="danger"
        isLoading={deleteRecurringPayable.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingRecurringPayable(null)}
      />
    </div>
  );
}

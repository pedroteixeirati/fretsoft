import React, { useEffect, useMemo, useState } from 'react';
import { NavItem } from '../../../shared/types/common.types';
import { useFirebase } from '../../../context/FirebaseContext';
import { canAccess } from '../../../lib/permissions';
import { getErrorMessage } from '../../../lib/errors';
import { clearFieldError } from '../../../shared/forms';
import { usePayablesQuery } from '../hooks/usePayablesQuery';
import { usePayableMutations } from '../hooks/usePayableMutations';
import { usePayableForm } from '../hooks/usePayableForm';
import PayablesHeader from '../components/PayablesHeader';
import PayablesStats from '../components/PayablesStats';
import PayablesFilters from '../components/PayablesFilters';
import PayablesTable from '../components/PayablesTable';
import PayableFormModal from '../components/PayableFormModal';
import { getNovalogPayableProviderOptions } from '../utils/novalog-payable-providers';

interface PayablesPageProps {
  onNavigate?: (item: NavItem) => void;
}

const itemsPerPage = 10;

export default function PayablesPage({ onNavigate }: PayablesPageProps) {
  const { user, userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'payables', 'create');
  const canUpdate = canAccess(userProfile, 'payables', 'update');
  const canDelete = canAccess(userProfile, 'payables', 'delete');
  const canReadProviders = canAccess(userProfile, 'providers', 'read');
  const isNovalogTenant = userProfile?.tenantSlug === 'novalog';

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'paid' | 'overdue' | 'canceled'>('all');
  const [referenceMonthFilter, setReferenceMonthFilter] = useState('all');
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'with_invoice' | 'missing'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { payables, vehicles, companies, providers, isLoading: loading, error: loadQueryError } = usePayablesQuery({
    enabled: Boolean(user),
    canReadProviders: isNovalogTenant && canReadProviders,
  });
  const { createPayable, updatePayable, deletePayable, payPayable, markPayableOverdue, isSubmitting } = usePayableMutations();
  const {
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
  } = usePayableForm();

  const loadError = loadQueryError
    ? getErrorMessage(loadQueryError, 'Nao foi possivel carregar as contas a pagar.')
    : '';

  const filteredPayables = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return payables.filter((payable) => {
      const matchesSearch =
        payable.description.toLowerCase().includes(term) ||
        payable.providerName.toLowerCase().includes(term) ||
        (payable.vehicleName || '').toLowerCase().includes(term) ||
        (payable.documentNumber || '').toLowerCase().includes(term) ||
        (payable.invoiceNumber || '').toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || payable.status === statusFilter;
      const matchesReferenceMonth = referenceMonthFilter === 'all' || payable.referenceMonth === referenceMonthFilter;
      const matchesInvoice =
        invoiceFilter === 'all' ||
        (invoiceFilter === 'missing' && payable.invoiceStatus === 'missing') ||
        (invoiceFilter === 'with_invoice' && payable.invoiceStatus === 'informed');

      return matchesSearch && matchesStatus && matchesReferenceMonth && matchesInvoice;
    });
  }, [invoiceFilter, payables, referenceMonthFilter, searchTerm, statusFilter]);

  const referenceMonthOptions = useMemo(() => {
    const months = new Set(payables.map((payable) => payable.referenceMonth).filter(Boolean));
    return Array.from(months).sort((left, right) => right.localeCompare(left));
  }, [payables]);

  const novalogProviderOptions = useMemo(() => {
    return getNovalogPayableProviderOptions(providers, formData.providerName);
  }, [formData.providerName, providers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, referenceMonthFilter, invoiceFilter, payables.length]);

  const totalFiltered = filteredPayables.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalOpen = filteredPayables
    .filter((item) => item.status === 'open')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPaid = filteredPayables
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalOverdue = filteredPayables
    .filter((item) => item.status === 'overdue')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalPages = Math.max(1, Math.ceil(filteredPayables.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPayables = filteredPayables.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});

    const nextFieldErrors: typeof fieldErrors = {};

    if (isNovalogTenant) {
      if (formData.providerName.trim().length < 3) nextFieldErrors.providerName = 'Informe o fornecedor.';
    } else {
      if (formData.description.trim().length < 3) nextFieldErrors.description = 'Informe uma descricao valida para a conta a pagar.';
      if (formData.sourceType === 'expense' && !formData.sourceId.trim()) nextFieldErrors.sourceId = 'Informe o identificador do custo operacional.';
    }
    if (!Number.isFinite(Number(formData.amount)) || Number(formData.amount) <= 0) nextFieldErrors.amount = 'O valor da conta a pagar deve ser maior que zero.';
    if (!formData.dueDate) nextFieldErrors.dueDate = 'Informe um vencimento valido para a conta a pagar.';
    if (!isNovalogTenant && formData.status === 'paid' && !formData.paidAt) nextFieldErrors.paidAt = 'Informe a data do pagamento ou deixe o sistema usar o vencimento.';
    if (formData.referenceMonth && !/^\d{4}-\d{2}$/.test(formData.referenceMonth)) nextFieldErrors.referenceMonth = 'Informe a competencia no formato AAAA-MM.';
    if (formData.proofUrl) {
      try {
        new URL(formData.proofUrl);
      } catch {
        nextFieldErrors.proofUrl = 'Informe uma URL valida para o comprovante.';
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    try {
      const novalogDescription = [
        formData.providerName.trim(),
        formData.invoiceNumber.trim() ? `NF ${formData.invoiceNumber.trim()}` : '',
        formData.documentNumber.trim() ? `Boleto ${formData.documentNumber.trim()}` : '',
      ].filter(Boolean).join(' - ');
      const invoiceNumber = formData.invoiceNumber.trim();
      const invoiceStatus = invoiceNumber
        ? invoiceNumber.toUpperCase().includes('SEM') ? 'missing' : 'informed'
        : 'not_informed';
      const payload = {
        ...formData,
        sourceType: isNovalogTenant ? 'manual' as const : formData.sourceType,
        sourceId: !isNovalogTenant && formData.sourceType === 'expense' ? formData.sourceId || undefined : undefined,
        description: isNovalogTenant ? novalogDescription : formData.description,
        vehicleId: isNovalogTenant ? undefined : formData.vehicleId || undefined,
        contractId: isNovalogTenant ? undefined : formData.contractId || undefined,
        providerName: formData.providerName || undefined,
        status: isNovalogTenant ? (formData.paidAt ? 'paid' as const : 'open' as const) : formData.status,
        paidAt: isNovalogTenant
          ? formData.paidAt || undefined
          : formData.status === 'paid' ? formData.paidAt || formData.dueDate : formData.paidAt || undefined,
        paymentMethod: formData.paymentMethod || undefined,
        proofUrl: isNovalogTenant ? undefined : formData.proofUrl || undefined,
        notes: formData.notes || undefined,
        documentNumber: formData.documentNumber || undefined,
        invoiceNumber: invoiceNumber || undefined,
        invoiceStatus,
        referenceMonth: formData.referenceMonth || undefined,
      };

      if (editingPayable) {
        await updatePayable.mutateAsync({ id: editingPayable.id, payload });
      } else {
        await createPayable.mutateAsync(payload);
      }

      setSubmitSuccess(editingPayable ? 'Conta a pagar atualizada com sucesso.' : 'Conta a pagar criada com sucesso.');
      closeModal();
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar a conta a pagar.'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta a pagar?')) return;

    try {
      await deletePayable.mutateAsync(id);
      setSubmitSuccess('Conta a pagar excluida com sucesso.');
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir a conta a pagar.'));
    }
  };

  const handlePay = async (id: string) => {
    setProcessingId(id);
    setSubmitError('');

    try {
      await payPayable.mutateAsync(id);
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel registrar o pagamento.'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleOverdue = async (id: string) => {
    setProcessingId(id);
    setSubmitError('');

    try {
      await markPayableOverdue.mutateAsync(id);
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel marcar a conta em atraso.'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PayablesHeader canCreate={canCreate} onCreate={openCreate} onNavigate={onNavigate} />

      {submitSuccess || submitError || loadError ? (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
            submitError || loadError
              ? 'border-error/20 bg-error/5 text-error'
              : 'border-primary/20 bg-primary/5 text-primary'
          }`}
        >
          {submitError || loadError || submitSuccess}
        </div>
      ) : null}

      <PayablesStats
        totalFiltered={totalFiltered}
        totalOpen={totalOpen}
        totalPaid={totalPaid}
        totalOverdue={totalOverdue}
      />

      <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
        <PayablesFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          referenceMonthFilter={referenceMonthFilter}
          referenceMonthOptions={referenceMonthOptions}
          invoiceFilter={invoiceFilter}
          showNovalogFilters={isNovalogTenant || referenceMonthOptions.length > 0}
          filteredCount={filteredPayables.length}
          totalCount={payables.length}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onReferenceMonthChange={setReferenceMonthFilter}
          onInvoiceFilterChange={setInvoiceFilter}
        />
        <PayablesTable
          payables={paginatedPayables}
          loading={loading}
          processingId={processingId}
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={openEdit}
          onDelete={handleDelete}
          onPay={handlePay}
          onMarkOverdue={handleOverdue}
          onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
          onNextPage={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        />
      </section>

      <PayableFormModal
        isOpen={isModalOpen}
        editing={Boolean(editingPayable)}
        submitError={submitError}
        fieldErrors={fieldErrors}
        formData={formData}
        isSubmitting={isSubmitting}
        vehicles={vehicles}
        companies={companies}
        providerOptions={novalogProviderOptions}
        showNovalogFields={isNovalogTenant}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={setFormData}
        onClearFieldError={(field) => setFieldErrors((current) => clearFieldError(current, field))}
      />
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { Wallet, Wrench, CheckCircle2 } from 'lucide-react';
import { getErrorMessage, resolveFieldError } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { isValidDateInput } from '../../../lib/validation';
import { useFirebase } from '../../../context/FirebaseContext';
import { clearFieldError } from '../../../shared/forms';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import KpiCard from '../../../shared/ui/KpiCard';
import { useVehiclesQuery } from '../../vehicles/hooks/useVehiclesQuery';
import { useServiceOrdersQuery } from '../hooks/useServiceOrdersQuery';
import { useServiceOrderMutations } from '../hooks/useServiceOrderMutations';
import { useServiceOrderForm } from '../hooks/useServiceOrderForm';
import ServiceOrdersHeader from '../components/ServiceOrdersHeader';
import ServiceOrdersFilters from '../components/ServiceOrdersFilters';
import ServiceOrdersList from '../components/ServiceOrdersList';
import ServiceOrderFormModal from '../components/ServiceOrderFormModal';
import { ServiceOrder } from '../types/service-order.types';

function parseNumber(value: string) {
  const numeric = Number(String(value).replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ServiceOrdersPage() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'serviceOrders', 'create');
  const canUpdate = canAccess(userProfile, 'serviceOrders', 'update');
  const canDelete = canAccess(userProfile, 'serviceOrders', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deletingServiceOrder, setDeletingServiceOrder] = useState<ServiceOrder | null>(null);

  const { serviceOrders, isLoading: loading, error: loadQueryError } = useServiceOrdersQuery({
    enabled: Boolean(userProfile),
  });
  const { vehicles } = useVehiclesQuery({ enabled: Boolean(userProfile) });
  const { createServiceOrder, updateServiceOrder, deleteServiceOrder, isSubmitting } = useServiceOrderMutations();
  const {
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
  } = useServiceOrderForm();

  const loadError = loadQueryError
    ? getErrorMessage(loadQueryError, 'Nao foi possivel carregar as ordens de servico.')
    : '';

  const filteredServiceOrders = useMemo(
    () =>
      serviceOrders.filter((serviceOrder) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          !search ||
          serviceOrder.vehiclePlate.toLowerCase().includes(search) ||
          serviceOrder.vehicleName.toLowerCase().includes(search) ||
          serviceOrder.providerName.toLowerCase().includes(search) ||
          serviceOrder.description.toLowerCase().includes(search);

        const matchesStatus = statusFilter === 'all' || serviceOrder.status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [serviceOrders, searchTerm, statusFilter],
  );

  const stats = useMemo(() => {
    const active = serviceOrders.filter((order) => order.status === 'open' || order.status === 'in_progress');
    const totalCost = serviceOrders
      .filter((order) => order.status !== 'canceled')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    return {
      activeCount: active.length,
      totalCost,
      totalCount: serviceOrders.length,
    };
  }, [serviceOrders]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});

    const nextFieldErrors: typeof fieldErrors = {};

    if (!formData.vehicleId) nextFieldErrors.vehicleId = 'Selecione o veiculo da ordem de servico.';
    if (!isValidDateInput(formData.openedOn)) nextFieldErrors.openedOn = 'Informe a data de abertura.';
    if (formData.closedOn && !isValidDateInput(formData.closedOn)) nextFieldErrors.closedOn = 'Informe uma data de conclusao valida.';
    if (formData.closedOn && formData.openedOn && formData.closedOn < formData.openedOn) {
      nextFieldErrors.closedOn = 'A conclusao deve ser posterior a abertura.';
    }
    if (formData.description.trim().length < 3) nextFieldErrors.description = 'Descreva o servico realizado.';
    if (formData.odometer.trim() !== '' && (!Number.isFinite(Number(formData.odometer)) || Number(formData.odometer) < 0)) {
      nextFieldErrors.odometer = 'A quilometragem deve ser zero ou maior.';
    }

    const validItems = formData.items.filter((item) => item.description.trim().length >= 2);
    if (validItems.length === 0) {
      nextFieldErrors.items = 'Inclua ao menos um item (peca ou mao de obra) com descricao.';
    } else if (validItems.some((item) => parseNumber(item.quantity) <= 0)) {
      nextFieldErrors.items = 'A quantidade de cada item deve ser maior que zero.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    const payload = {
      vehicleId: formData.vehicleId,
      status: formData.status,
      openedOn: formData.openedOn,
      closedOn: formData.closedOn || '',
      odometer: formData.odometer.trim() === '' ? null : Number(formData.odometer),
      providerName: formData.providerName.trim(),
      description: formData.description.trim(),
      notes: formData.notes.trim(),
      items: validItems.map((item) => ({
        itemType: item.itemType,
        description: item.description.trim(),
        quantity: parseNumber(item.quantity),
        unitAmount: parseNumber(item.unitAmount),
        totalAmount: parseNumber(item.quantity) * parseNumber(item.unitAmount),
        supplierName: item.supplierName.trim(),
        notes: item.notes.trim(),
      })),
    };

    try {
      if (editingServiceOrder) {
        await updateServiceOrder.mutateAsync({ id: editingServiceOrder.id, payload });
      } else {
        await createServiceOrder.mutateAsync(payload);
      }

      setSubmitSuccess(editingServiceOrder ? 'Ordem de servico atualizada com sucesso.' : 'Ordem de servico criada com sucesso.');
      closeModal();
    } catch (error) {
      const fieldError = resolveFieldError(error, {
        fieldMap: {
          vehicleId: 'vehicleId',
          status: 'status',
          openedOn: 'openedOn',
          closedOn: 'closedOn',
          odometer: 'odometer',
          description: 'description',
          items: 'items',
        },
      });

      if (fieldError?.field) {
        setFieldErrors({ [fieldError.field]: fieldError.message });
        return;
      }

      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar a ordem de servico.'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingServiceOrder) return;

    setSubmitError('');
    setSubmitSuccess('');
    try {
      await deleteServiceOrder.mutateAsync(deletingServiceOrder.id);
      setSubmitSuccess('Ordem de servico excluida com sucesso.');
      setDeletingServiceOrder(null);
    } catch (error) {
      setDeletingServiceOrder(null);
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir a ordem de servico.'));
    }
  };

  const feedbackMessage = submitError || loadError || submitSuccess;
  const feedbackIsError = Boolean(submitError || loadError);

  return (
    <div className="space-y-10">
      <ServiceOrdersHeader canCreate={canCreate} onCreate={openCreate} />

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Custo de manutencao" value={formatCurrency(stats.totalCost)} icon={Wallet} tone="primary" />
        <KpiCard label="Ordens em aberto" value={stats.activeCount} icon={Wrench} tone="tertiary" />
        <KpiCard label="Total de ordens" value={stats.totalCount} icon={CheckCircle2} tone="secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <ServiceOrdersFilters
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            onSearchChange={setSearchTerm}
            onStatusChange={setStatusFilter}
          />
        </div>

        <ServiceOrdersList
          serviceOrders={filteredServiceOrders}
          loading={loading}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={openEdit}
          onDelete={setDeletingServiceOrder}
        />
      </div>

      <ServiceOrderFormModal
        isOpen={isModalOpen}
        editing={Boolean(editingServiceOrder)}
        submitError={submitError}
        fieldErrors={fieldErrors}
        isSubmitting={isSubmitting}
        formData={formData}
        vehicles={vehicles}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={setFormData}
        onClearFieldError={(field) => setFieldErrors((current) => clearFieldError(current, field))}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingServiceOrder)}
        title="Excluir ordem de servico"
        message={
          deletingServiceOrder
            ? `Tem certeza que deseja excluir esta ordem de servico do veiculo ${deletingServiceOrder.vehiclePlate}? Esta acao nao pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        variant="danger"
        isLoading={deleteServiceOrder.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingServiceOrder(null)}
      />
    </div>
  );
}

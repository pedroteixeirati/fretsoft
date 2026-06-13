import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, ClipboardCheck } from 'lucide-react';
import { getErrorMessage, resolveFieldError } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { isValidDateInput } from '../../../lib/validation';
import { useFirebase } from '../../../context/FirebaseContext';
import { clearFieldError } from '../../../shared/forms';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import KpiCard from '../../../shared/ui/KpiCard';
import { useVehiclesQuery } from '../../vehicles/hooks/useVehiclesQuery';
import { useMaintenanceInspectionsQuery } from '../hooks/useMaintenanceInspectionsQuery';
import { useMaintenanceInspectionMutations } from '../hooks/useMaintenanceInspectionMutations';
import { useMaintenanceInspectionForm } from '../hooks/useMaintenanceInspectionForm';
import MaintenanceInspectionsHeader from '../components/MaintenanceInspectionsHeader';
import MaintenanceInspectionsFilters from '../components/MaintenanceInspectionsFilters';
import MaintenanceInspectionsList from '../components/MaintenanceInspectionsList';
import MaintenanceInspectionFormModal from '../components/MaintenanceInspectionFormModal';
import { MaintenanceInspection } from '../types/maintenance-inspection.types';
import { getNextDueState } from '../utils/next-due';

export default function MaintenanceInspectionsPage() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'maintenanceInspections', 'create');
  const canUpdate = canAccess(userProfile, 'maintenanceInspections', 'update');
  const canDelete = canAccess(userProfile, 'maintenanceInspections', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [dueFilter, setDueFilter] = useState('all');
  const [deletingInspection, setDeletingInspection] = useState<MaintenanceInspection | null>(null);

  const { inspections, isLoading: loading, error: loadQueryError } = useMaintenanceInspectionsQuery({
    enabled: Boolean(userProfile),
  });
  const { vehicles } = useVehiclesQuery({ enabled: Boolean(userProfile) });
  const { createInspection, updateInspection, deleteInspection, isSubmitting } = useMaintenanceInspectionMutations();
  const {
    isModalOpen,
    editingInspection,
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
  } = useMaintenanceInspectionForm();

  const loadError = loadQueryError
    ? getErrorMessage(loadQueryError, 'Nao foi possivel carregar as inspecoes preventivas.')
    : '';

  const filteredInspections = useMemo(
    () =>
      inspections.filter((inspection) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          !search ||
          inspection.vehiclePlate.toLowerCase().includes(search) ||
          inspection.vehicleName.toLowerCase().includes(search) ||
          inspection.mechanicName.toLowerCase().includes(search);

        const dueState = getNextDueState(inspection.nextDueOn);
        const matchesDue =
          dueFilter === 'all' ||
          (dueFilter === 'overdue' && dueState === 'overdue') ||
          (dueFilter === 'upcoming' && dueState === 'upcoming') ||
          (dueFilter === 'attention' && inspection.attentionCount > 0);

        return matchesSearch && matchesDue;
      }),
    [inspections, searchTerm, dueFilter],
  );

  const stats = useMemo(() => {
    let overdue = 0;
    let upcoming = 0;
    let attention = 0;
    inspections.forEach((inspection) => {
      const dueState = getNextDueState(inspection.nextDueOn);
      if (dueState === 'overdue') overdue += 1;
      if (dueState === 'upcoming') upcoming += 1;
      if (inspection.attentionCount > 0) attention += 1;
    });
    return { overdue, upcoming, attention };
  }, [inspections]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});

    const nextFieldErrors: typeof fieldErrors = {};

    if (!formData.vehicleId) nextFieldErrors.vehicleId = 'Selecione o veiculo da inspecao.';
    if (!isValidDateInput(formData.inspectedOn)) nextFieldErrors.inspectedOn = 'Informe a data da inspecao.';
    if (formData.nextDueOn && !isValidDateInput(formData.nextDueOn)) nextFieldErrors.nextDueOn = 'Informe uma data valida para o proximo vencimento.';
    if (formData.odometer.trim() !== '' && (!Number.isFinite(Number(formData.odometer)) || Number(formData.odometer) < 0)) {
      nextFieldErrors.odometer = 'A quilometragem deve ser zero ou maior.';
    }
    if (formData.nextDueKm.trim() !== '' && (!Number.isFinite(Number(formData.nextDueKm)) || Number(formData.nextDueKm) < 0)) {
      nextFieldErrors.nextDueKm = 'A quilometragem deve ser zero ou maior.';
    }

    const validItems = formData.items.filter((item) => item.label.trim().length >= 2);
    if (validItems.length === 0) {
      nextFieldErrors.items = 'Inclua ao menos um item no checklist.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    const payload = {
      vehicleId: formData.vehicleId,
      status: formData.status,
      inspectedOn: formData.inspectedOn,
      odometer: formData.odometer.trim() === '' ? null : Number(formData.odometer),
      mechanicName: formData.mechanicName.trim(),
      nextDueOn: formData.nextDueOn || '',
      nextDueKm: formData.nextDueKm.trim() === '' ? null : Number(formData.nextDueKm),
      notes: formData.notes.trim(),
      items: validItems.map((item) => ({
        label: item.label.trim(),
        result: item.result,
        observation: item.observation.trim(),
      })),
    };

    try {
      if (editingInspection) {
        await updateInspection.mutateAsync({ id: editingInspection.id, payload });
      } else {
        await createInspection.mutateAsync(payload);
      }

      setSubmitSuccess(editingInspection ? 'Inspecao atualizada com sucesso.' : 'Inspecao registrada com sucesso.');
      closeModal();
    } catch (error) {
      const fieldError = resolveFieldError(error, {
        fieldMap: {
          vehicleId: 'vehicleId',
          status: 'status',
          inspectedOn: 'inspectedOn',
          odometer: 'odometer',
          nextDueOn: 'nextDueOn',
          nextDueKm: 'nextDueKm',
          items: 'items',
        },
      });

      if (fieldError?.field) {
        setFieldErrors({ [fieldError.field]: fieldError.message });
        return;
      }

      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar a inspecao.'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingInspection) return;

    setSubmitError('');
    setSubmitSuccess('');
    try {
      await deleteInspection.mutateAsync(deletingInspection.id);
      setSubmitSuccess('Inspecao excluida com sucesso.');
      setDeletingInspection(null);
    } catch (error) {
      setDeletingInspection(null);
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir a inspecao.'));
    }
  };

  const feedbackMessage = submitError || loadError || submitSuccess;
  const feedbackIsError = Boolean(submitError || loadError);

  return (
    <div className="space-y-10">
      <MaintenanceInspectionsHeader canCreate={canCreate} onCreate={openCreate} />

      {feedbackMessage ? (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
            feedbackIsError ? 'border-error/20 bg-error/5 text-error' : 'border-primary/20 bg-primary/5 text-primary'
          }`}
        >
          {feedbackMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Preventivas vencidas" value={stats.overdue} icon={CalendarClock} tone={stats.overdue > 0 ? 'danger' : 'success'} />
        <KpiCard label="A vencer (30 dias)" value={stats.upcoming} icon={CalendarClock} tone="tertiary" />
        <KpiCard label="Com pontos de atencao" value={stats.attention} icon={AlertTriangle} tone={stats.attention > 0 ? 'warning' : 'success'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <MaintenanceInspectionsFilters
            searchTerm={searchTerm}
            dueFilter={dueFilter}
            onSearchChange={setSearchTerm}
            onDueChange={setDueFilter}
          />
        </div>

        <MaintenanceInspectionsList
          inspections={filteredInspections}
          loading={loading}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={openEdit}
          onDelete={setDeletingInspection}
        />
      </div>

      <MaintenanceInspectionFormModal
        isOpen={isModalOpen}
        editing={Boolean(editingInspection)}
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
        isOpen={Boolean(deletingInspection)}
        title="Excluir inspecao"
        message={
          deletingInspection
            ? `Tem certeza que deseja excluir a inspecao do veiculo ${deletingInspection.vehiclePlate}? Esta acao nao pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        variant="danger"
        isLoading={deleteInspection.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingInspection(null)}
      />
    </div>
  );
}

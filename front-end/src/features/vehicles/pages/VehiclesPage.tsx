import React, { useMemo, useState } from 'react';
import { getErrorMessage, resolveFieldError } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { isValidDateInput, isValidPlate } from '../../../lib/validation';
import { useFirebase } from '../../../context/FirebaseContext';
import { clearFieldError } from '../../../shared/forms';
import { useVehiclesQuery } from '../hooks/useVehiclesQuery';
import { useVehicleMutations } from '../hooks/useVehicleMutations';
import { useVehicleForm } from '../hooks/useVehicleForm';
import VehiclesHeader from '../components/VehiclesHeader';
import VehiclesFilters from '../components/VehiclesFilters';
import VehiclesList from '../components/VehiclesList';
import VehicleFormModal from '../components/VehicleFormModal';

export default function VehiclesPage() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'vehicles', 'create');
  const canUpdate = canAccess(userProfile, 'vehicles', 'update');
  const canDelete = canAccess(userProfile, 'vehicles', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { vehicles, isLoading: loading, error: loadQueryError } = useVehiclesQuery({
    enabled: Boolean(userProfile),
  });
  const { createVehicle, updateVehicle, deleteVehicle, isSubmitting } = useVehicleMutations();
  const {
    isModalOpen,
    editingVehicle,
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
  } = useVehicleForm();

  const loadError = loadQueryError
    ? getErrorMessage(loadQueryError, 'Nao foi possivel carregar os veiculos.')
    : '';

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          (vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase())) &&
          (typeFilter === 'all' || vehicle.type === typeFilter) &&
          (statusFilter === 'all' || vehicle.status === statusFilter),
      ),
    [vehicles, searchTerm, typeFilter, statusFilter],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});

    const payload = {
      ...formData,
      name: formData.name.trim(),
      plate: formData.plate.toUpperCase().trim(),
      driver: formData.driver.trim(),
    };

    const nextFieldErrors: typeof fieldErrors = {};

    if (payload.name.length < 3) nextFieldErrors.name = 'Informe um nome valido para o veiculo.';
    if (!isValidPlate(payload.plate)) nextFieldErrors.plate = 'Placa invalida. Use o formato ABC1D23 ou ABC-1234.';
    if (payload.driver.length < 3) nextFieldErrors.driver = 'Informe o motorista responsavel pelo veiculo.';
    if (!payload.type.trim()) nextFieldErrors.type = 'Selecione o tipo do veiculo.';
    if (!Number.isFinite(Number(payload.km)) || Number(payload.km) < 0) nextFieldErrors.km = 'A quilometragem deve ser zero ou maior.';
    if (payload.nextMaintenance && !isValidDateInput(payload.nextMaintenance)) nextFieldErrors.nextMaintenance = 'Informe uma data valida para a proxima manutencao.';

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    try {
      if (editingVehicle) {
        await updateVehicle.mutateAsync({ id: editingVehicle.id, payload });
      } else {
        await createVehicle.mutateAsync(payload);
      }

      setSubmitSuccess(editingVehicle ? 'Veiculo atualizado com sucesso.' : 'Veiculo cadastrado com sucesso.');
      closeModal();
    } catch (error) {
      const fieldError = resolveFieldError(error, {
        fieldMap: {
          name: 'name',
          plate: 'plate',
          driver: 'driver',
          type: 'type',
          km: 'km',
          nextMaintenance: 'nextMaintenance',
          status: 'status',
        },
      });

      if (fieldError?.field) {
        setFieldErrors({ [fieldError.field]: fieldError.message });
        return;
      }

      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar o veiculo.'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este veiculo?')) return;

    setSubmitError('');
    setSubmitSuccess('');
    try {
      await deleteVehicle.mutateAsync(id);
      setSubmitSuccess('Veiculo excluido com sucesso.');
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir o veiculo.'));
    }
  };

  const feedbackMessage = submitError || loadError || submitSuccess;
  const feedbackIsError = Boolean(submitError || loadError);

  return (
    <div className="space-y-10">
      <VehiclesHeader canCreate={canCreate} onCreate={openCreate} />

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
          <VehiclesFilters
            searchTerm={searchTerm}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            onSearchChange={setSearchTerm}
            onTypeChange={setTypeFilter}
            onStatusChange={setStatusFilter}
          />
        </div>

        <VehiclesList
          vehicles={filteredVehicles}
          loading={loading}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </div>

      <VehicleFormModal
        isOpen={isModalOpen}
        editing={Boolean(editingVehicle)}
        submitError={submitError}
        fieldErrors={fieldErrors}
        isSubmitting={isSubmitting}
        formData={formData}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={setFormData}
        onClearFieldError={(field) => setFieldErrors((current) => clearFieldError(current, field))}
      />
    </div>
  );
}

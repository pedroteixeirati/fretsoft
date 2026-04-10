import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getErrorMessage, resolveFieldError } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { isValidDateInput } from '../../../lib/validation';
import { useFirebase } from '../../../context/FirebaseContext';
import { companiesApi, freightsApi } from '../../../lib/api';
import { Company, Freight } from '../../../types';
import { useCargasQuery } from '../hooks/useCargasQuery';
import { useCargoMutations } from '../hooks/useCargoMutations';
import { useCargoForm } from '../hooks/useCargoForm';
import CargasHeader from '../components/CargasHeader';
import CargasFilters from '../components/CargasFilters';
import CargasTable from '../components/CargasTable';
import CargoFormModal from '../components/CargoFormModal';

export default function CargasPage() {
  const { userProfile } = useFirebase();
  const [searchParams] = useSearchParams();
  const freightIdFilter = searchParams.get('freightId') || undefined;
  const canCreate = canAccess(userProfile, 'cargas', 'create');
  const canUpdate = canAccess(userProfile, 'cargas', 'update');
  const canDelete = canAccess(userProfile, 'cargas', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [freights, setFreights] = useState<Freight[]>([]);
  const [supportingError, setSupportingError] = useState('');
  const [prefillHandled, setPrefillHandled] = useState(false);

  const { cargas, isLoading, error: loadQueryError } = useCargasQuery({
    enabled: Boolean(userProfile),
    freightId: freightIdFilter,
  });
  const { createCargo, updateCargo, deleteCargo, isSubmitting } = useCargoMutations();
  const {
    isModalOpen,
    editingCargo,
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
  } = useCargoForm();

  useEffect(() => {
    if (!userProfile) return;

    const loadSupportingData = async () => {
      setSupportingError('');
      try {
        const [companiesData, freightsData] = await Promise.all([companiesApi.list(), freightsApi.list()]);
        setCompanies(companiesData);
        setFreights(freightsData);
      } catch (error) {
        setSupportingError(getErrorMessage(error, 'Nao foi possivel carregar os dados auxiliares de cargas.'));
      }
    };

    void loadSupportingData();
  }, [userProfile]);

  useEffect(() => {
    if (!freightIdFilter || isModalOpen || prefillHandled) return;
    openCreate({ freightId: freightIdFilter });
    setPrefillHandled(true);
  }, [freightIdFilter, isModalOpen, openCreate, prefillHandled]);

  const loadError = loadQueryError
    ? getErrorMessage(loadQueryError, 'Nao foi possivel carregar as cargas.')
    : supportingError;

  const filteredCargas = useMemo(
    () =>
      cargas.filter((cargo) => {
        const haystack = [
          cargo.cargoNumber,
          cargo.description,
          cargo.companyName,
          cargo.freightRoute,
          cargo.origin,
          cargo.destination,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return (
          haystack.includes(searchTerm.toLowerCase()) &&
          (statusFilter === 'all' || cargo.status === statusFilter)
        );
      }),
    [cargas, searchTerm, statusFilter],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});

    const nextFieldErrors: typeof fieldErrors = {};
    if (!formData.freightId) nextFieldErrors.freightId = 'Selecione o frete da carga.';
    if (!formData.companyId) nextFieldErrors.companyId = 'Selecione o cliente da carga.';
    if (formData.description.trim().length < 3) nextFieldErrors.description = 'Informe uma descricao valida para a carga.';
    if (formData.cargoType.trim().length < 2) nextFieldErrors.cargoType = 'Informe o tipo da carga.';
    if (formData.origin.trim().length < 3) nextFieldErrors.origin = 'Informe a origem da carga.';
    if (formData.destination.trim().length < 3) nextFieldErrors.destination = 'Informe o destino da carga.';
    if (formData.scheduledDate && !isValidDateInput(formData.scheduledDate)) nextFieldErrors.scheduledDate = 'Informe uma data prevista valida.';
    if (formData.deliveredAt && !isValidDateInput(formData.deliveredAt)) nextFieldErrors.deliveredAt = 'Informe uma data de entrega valida.';

    const numericRules: Array<{ field: 'weight' | 'volume' | 'unitCount' | 'merchandiseValue'; label: string }> = [
      { field: 'weight', label: 'peso' },
      { field: 'volume', label: 'volume' },
      { field: 'unitCount', label: 'quantidade' },
      { field: 'merchandiseValue', label: 'valor da mercadoria' },
    ];

    numericRules.forEach(({ field, label }) => {
      const value = formData[field];
      if (!value) return;
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        nextFieldErrors[field] = `Informe um ${label} valido.`;
      }
    });

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    const selectedCompany = companies.find((company) => company.id === formData.companyId);
    const selectedFreight = freights.find((freight) => freight.id === formData.freightId);

    const payload = {
      freightId: formData.freightId,
      companyId: formData.companyId,
      companyName: selectedCompany?.tradeName || selectedCompany?.corporateName,
      freightRoute: selectedFreight?.route,
      cargoNumber: formData.cargoNumber.trim() || undefined,
      description: formData.description.trim(),
      cargoType: formData.cargoType.trim(),
      origin: formData.origin.trim(),
      destination: formData.destination.trim(),
      weight: formData.weight ? Number(formData.weight) : undefined,
      volume: formData.volume ? Number(formData.volume) : undefined,
      unitCount: formData.unitCount ? Number(formData.unitCount) : undefined,
      merchandiseValue: formData.merchandiseValue ? Number(formData.merchandiseValue) : undefined,
      status: formData.status,
      scheduledDate: formData.scheduledDate || undefined,
      deliveredAt: formData.deliveredAt || undefined,
      notes: formData.notes.trim() || undefined,
    };

    try {
      if (editingCargo) {
        await updateCargo.mutateAsync({ id: editingCargo.id, payload });
      } else {
        await createCargo.mutateAsync(payload);
      }

      setSubmitSuccess(editingCargo ? 'Carga atualizada com sucesso.' : 'Carga cadastrada com sucesso.');
      closeModal();
    } catch (error) {
      const fieldError = resolveFieldError(error, {
        fieldMap: {
          freightId: 'freightId',
          companyId: 'companyId',
          cargoNumber: 'cargoNumber',
          description: 'description',
          cargoType: 'cargoType',
          weight: 'weight',
          volume: 'volume',
          unitCount: 'unitCount',
          merchandiseValue: 'merchandiseValue',
          origin: 'origin',
          destination: 'destination',
          status: 'status',
          scheduledDate: 'scheduledDate',
          deliveredAt: 'deliveredAt',
          notes: 'notes',
        },
      });

      if (fieldError?.field) {
        setFieldErrors({ [fieldError.field]: fieldError.message });
        return;
      }

      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar a carga.'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta carga?')) return;

    setSubmitError('');
    setSubmitSuccess('');
    try {
      await deleteCargo.mutateAsync(id);
      setSubmitSuccess('Carga excluida com sucesso.');
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir a carga.'));
    }
  };

  const feedbackMessage = submitError || loadError || submitSuccess;
  const feedbackIsError = Boolean(submitError || loadError);

  return (
    <div className="space-y-10">
      <CargasHeader canCreate={canCreate} onCreate={() => openCreate(freightIdFilter ? { freightId: freightIdFilter } : undefined)} />

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

      <CargasFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
      />

      <CargasTable
        cargas={filteredCargas}
        loading={isLoading}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <CargoFormModal
        isOpen={isModalOpen}
        editing={Boolean(editingCargo)}
        submitError={submitError}
        fieldErrors={fieldErrors}
        isSubmitting={isSubmitting}
        formData={formData}
        freights={freights}
        companies={companies}
        freightLocked={Boolean(freightIdFilter && !editingCargo)}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={setFormData}
        onClearFieldError={(field) =>
          setFieldErrors((current) => {
            const next = { ...current };
            delete next[field];
            return next;
          })
        }
      />
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Edit2, Filter, Loader2, MapPinned, PackagePlus, Plus, Route, Search, Trash2 } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import KpiCard from '../components/KpiCard';
import Modal from '../components/Modal';
import { useFirebase } from '../context/FirebaseContext';
import CargoFormModal from '../features/cargas/components/CargoFormModal';
import { useCargoForm } from '../features/cargas/hooks/useCargoForm';
import { useCargoMutations } from '../features/cargas/hooks/useCargoMutations';
import { contractsApi, freightsApi, vehiclesApi, cargasApi, companiesApi } from '../lib/api';
import { formatDateOnlyPtBr } from '../lib/date';
import { FormFieldErrors, getErrorMessage, resolveFieldError } from '../lib/errors';
import { canAccess } from '../lib/permissions';
import { isValidDateInput } from '../lib/validation';
import { Cargo, Company, Contract, Freight, Vehicle } from '../types';
import { clearFieldError, FieldLabel, FormAlert, FormDatePicker, hasRequiredFieldsFilled, useFormErrorFocus } from '../shared/forms';
import Input from '../shared/ui/Input';

const initialFormData = {
  freightType: 'standalone',
  vehicleId: '',
  plate: '',
  contractId: '',
  date: '',
  route: '',
  amount: '',
  hasCargo: 'true',
};

type FreightFormField =
  | 'freightType'
  | 'vehicleId'
  | 'contractId'
  | 'date'
  | 'route'
  | 'amount'
  | 'hasCargo';

function getFreightFormErrors(
  formData: typeof initialFormData,
  selectedContract?: Contract,
): FormFieldErrors<FreightFormField> {
  const errors: FormFieldErrors<FreightFormField> = {};
  const requiresAmount = !selectedContract || selectedContract.remunerationType === 'per_trip';

  if (formData.freightType === 'contract' && !formData.contractId) {
    errors.contractId = 'Selecione um contrato.';
  }

  if (!formData.vehicleId) {
    errors.vehicleId = 'Selecione o caminhao do frete.';
  }

  if (!isValidDateInput(formData.date)) {
    errors.date = 'Informe a data do frete.';
  }

  if (formData.route.trim().length < 5) {
    errors.route = 'Informe uma rota valida.';
  }

  if (requiresAmount) {
    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.amount = 'Informe um valor de frete maior que zero.';
    }
  }

  return errors;
}

export default function Freights() {
  const navigate = useNavigate();
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'freights', 'create');
  const canUpdate = canAccess(userProfile, 'freights', 'update');
  const canDelete = canAccess(userProfile, 'freights', 'delete');
  const canReadCargas = canAccess(userProfile, 'cargas', 'read');
  const canCreateCargas = canAccess(userProfile, 'cargas', 'create');
  const [freights, setFreights] = useState<Freight[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [cargas, setCargas] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFreight, setEditingFreight] = useState<Freight | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(initialFormData);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<FreightFormField>>({});
  const {
    isModalOpen: isCargoModalOpen,
    editingCargo,
    formData: cargoFormData,
    setFormData: setCargoFormData,
    fieldErrors: cargoFieldErrors,
    setFieldErrors: setCargoFieldErrors,
    submitError: cargoSubmitError,
    setSubmitError: setCargoSubmitError,
    setSubmitSuccess: setCargoSubmitSuccess,
    openCreate: openCreateCargo,
    closeModal: closeCargoModal,
  } = useCargoForm();
  const { createCargo, updateCargo, isSubmitting: isSubmittingCargo } = useCargoMutations();

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [freightsData, vehiclesData, contractsData, companiesData, cargasData] = await Promise.all([
        freightsApi.list(),
        vehiclesApi.list(),
        contractsApi.list(),
        companiesApi.list(),
        cargasApi.list(),
      ]);
      setFreights(freightsData);
      setVehicles(vehiclesData);
      setContracts(contractsData);
      setCompanies(companiesData);
      setCargas(cargasData);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Nao foi possivel carregar os fretes.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const selectedContract = useMemo(
    () => contracts.find((contract) => contract.id === formData.contractId),
    [contracts, formData.contractId]
  );
  const showOperationalFields = formData.freightType === 'standalone' || !!selectedContract;

  const availableVehicles = useMemo(() => {
    if (!selectedContract) return vehicles;
    return vehicles.filter((vehicle) => selectedContract.vehicleIds.includes(vehicle.id));
  }, [vehicles, selectedContract]);

  const requiresAmount = !selectedContract || selectedContract.remunerationType === 'per_trip';
  const recurringOperationalTrips = useMemo(
    () => freights.filter((freight) => freight.billingType === 'contract_recurring').length,
    [freights]
  );
  const totalRevenue = useMemo(() => freights.reduce((acc, freight) => acc + Number(freight.amount || 0), 0), [freights]);
  const cargoCountByFreightId = useMemo(
    () =>
      cargas.reduce<Record<string, number>>((accumulator, cargo) => {
        accumulator[cargo.freightId] = (accumulator[cargo.freightId] || 0) + 1;
        return accumulator;
      }, {}),
    [cargas],
  );
  const filteredFreights = useMemo(
    () =>
      freights.filter((freight) =>
        freight.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freight.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (freight.contractName || '').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [freights, searchTerm]
  );
  const selectableContracts = useMemo(
    () => contracts.filter((contract) =>
      contract.status === 'active' ||
      contract.status === 'renewal' ||
      contract.id === formData.contractId
    ),
    [contracts, formData.contractId]
  );
  const currentCargoFreight = useMemo(
    () => freights.find((freight) => freight.id === cargoFormData.freightId),
    [cargoFormData.freightId, freights],
  );

  const formValidationErrors = useMemo(() => getFreightFormErrors(formData, selectedContract), [formData, selectedContract]);
  const canSubmit = hasRequiredFieldsFilled(formData, [
    'vehicleId',
    'date',
    'route',
    { field: 'contractId', isFilled: (value, currentFormData) => currentFormData.freightType !== 'contract' || (typeof value === 'string' && value.trim().length > 0) },
    { field: 'amount', isFilled: (value, currentFormData) => {
      const requiresCurrentAmount = currentFormData.freightType === 'standalone' || !selectedContract || selectedContract.remunerationType === 'per_trip';
      return !requiresCurrentAmount || (typeof value === 'string' && value.trim().length > 0);
    } },
  ]);
  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
  const formMessage = submitError || (hasFieldErrors ? 'Revise os campos destacados antes de salvar.' : '');
  const { formRef, alertRef } = useFormErrorFocus({
    enabled: isModalOpen,
    fieldErrors,
    message: formMessage,
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingFreight(null);
    setSubmitError('');
    setFieldErrors({});
    setIsModalOpen(false);
  };

  const updateField = (field: FreightFormField, value: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      return clearFieldError(current, field);
    });
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleOpenCreate = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setFormData(initialFormData);
    setEditingFreight(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (Object.keys(formValidationErrors).length > 0) {
      setFieldErrors(formValidationErrors);
      return;
    }

    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === formData.vehicleId);
    const payload = {
      vehicleId: formData.vehicleId,
      plate: selectedVehicle?.plate || formData.plate,
      contractId: formData.freightType === 'contract' ? formData.contractId || undefined : undefined,
      date: formData.date,
      route: formData.route.trim(),
      amount: requiresAmount ? Number(formData.amount) : 0,
      hasCargo: formData.hasCargo === 'true',
    };

    setIsSubmitting(true);
    try {
      if (editingFreight) {
        await freightsApi.update(editingFreight.id, payload);
      } else {
        await freightsApi.create(payload as Omit<Freight, 'id'>);
      }
      await loadData();
      setSubmitSuccess(editingFreight ? 'Frete atualizado com sucesso.' : 'Frete cadastrado com sucesso.');
      resetForm();
    } catch (error) {
      const resolvedFieldError = resolveFieldError<FreightFormField>(error, {
        fieldMap: {
          vehicleId: 'vehicleId',
          contractId: 'contractId',
          date: 'date',
          route: 'route',
          amount: 'amount',
        },
      });

      if (resolvedFieldError?.field) {
        setFieldErrors((current) => ({
          ...current,
          [resolvedFieldError.field!]: resolvedFieldError.message,
        }));
        setSubmitError('');
      } else {
        setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar o frete.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAddCargo = (freight: Freight) => {
    const linkedContract = freight.contractId
      ? contracts.find((contract) => contract.id === freight.contractId)
      : undefined;

    openCreateCargo({
      freightId: freight.id,
      companyId: linkedContract?.companyId || '',
      origin: freight.route.includes(' x ') ? freight.route.split(' x ')[0] : '',
      destination: freight.route.includes(' x ') ? freight.route.split(' x ')[1] : '',
    });
  };

  const handleSubmitCargo = async (event: React.FormEvent) => {
    event.preventDefault();
    setCargoSubmitError('');
    setCargoSubmitSuccess('');
    setCargoFieldErrors({});

    const nextFieldErrors: typeof cargoFieldErrors = {};
    if (!cargoFormData.freightId) nextFieldErrors.freightId = 'Selecione o frete da carga.';
    if (!cargoFormData.companyId) nextFieldErrors.companyId = 'Selecione o cliente da carga.';
    if (cargoFormData.description.trim().length < 3) nextFieldErrors.description = 'Informe uma descricao valida para a carga.';
    if (cargoFormData.cargoType.trim().length < 2) nextFieldErrors.cargoType = 'Informe o tipo da carga.';
    if (cargoFormData.origin.trim().length < 3) nextFieldErrors.origin = 'Informe a origem da carga.';
    if (cargoFormData.destination.trim().length < 3) nextFieldErrors.destination = 'Informe o destino da carga.';
    if (cargoFormData.scheduledDate && !isValidDateInput(cargoFormData.scheduledDate)) nextFieldErrors.scheduledDate = 'Informe uma data prevista valida.';
    if (cargoFormData.deliveredAt && !isValidDateInput(cargoFormData.deliveredAt)) nextFieldErrors.deliveredAt = 'Informe uma data de entrega valida.';

    (['weight', 'volume', 'unitCount', 'merchandiseValue'] as const).forEach((field) => {
      const value = cargoFormData[field];
      if (!value) return;
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        nextFieldErrors[field] = 'Informe um valor valido.';
      }
    });

    if (Object.keys(nextFieldErrors).length > 0) {
      setCargoFieldErrors(nextFieldErrors);
      return;
    }

    const selectedCompany = companies.find((company) => company.id === cargoFormData.companyId);
    const payload = {
      freightId: cargoFormData.freightId,
      companyId: cargoFormData.companyId,
      cargoNumber: cargoFormData.cargoNumber.trim() || undefined,
      description: cargoFormData.description.trim(),
      cargoType: cargoFormData.cargoType.trim(),
      weight: cargoFormData.weight ? Number(cargoFormData.weight) : undefined,
      volume: cargoFormData.volume ? Number(cargoFormData.volume) : undefined,
      unitCount: cargoFormData.unitCount ? Number(cargoFormData.unitCount) : undefined,
      merchandiseValue: cargoFormData.merchandiseValue ? Number(cargoFormData.merchandiseValue) : undefined,
      origin: cargoFormData.origin.trim(),
      destination: cargoFormData.destination.trim(),
      status: cargoFormData.status,
      scheduledDate: cargoFormData.scheduledDate || undefined,
      deliveredAt: cargoFormData.deliveredAt || undefined,
      notes: cargoFormData.notes.trim() || undefined,
      companyName: selectedCompany?.tradeName || selectedCompany?.corporateName,
      freightRoute: currentCargoFreight?.route,
    };

    try {
      if (editingCargo) {
        await updateCargo.mutateAsync({ id: editingCargo.id, payload });
      } else {
        await createCargo.mutateAsync(payload);
      }
      await loadData();
      setCargoSubmitSuccess(editingCargo ? 'Carga atualizada com sucesso.' : 'Carga cadastrada com sucesso.');
      closeCargoModal();
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
        setCargoFieldErrors({ [fieldError.field]: fieldError.message });
        return;
      }

      setCargoSubmitError(getErrorMessage(error, 'Nao foi possivel salvar a carga.'));
    }
  };

  const handleEdit = (freight: Freight) => {
    const linkedVehicle = vehicles.find((vehicle) => vehicle.id === freight.vehicleId || vehicle.plate === freight.plate);
    setEditingFreight(freight);
    setFieldErrors({});
    setFormData({
      freightType: freight.contractId ? 'contract' : 'standalone',
      vehicleId: linkedVehicle?.id || freight.vehicleId,
      plate: freight.plate,
      contractId: freight.contractId || '',
      date: freight.date,
      route: freight.route,
      amount: freight.amount ? String(freight.amount) : '',
      hasCargo: freight.hasCargo === false ? 'false' : 'true',
    });
    setSubmitError('');
    setSubmitSuccess('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir este frete?')) return;
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await freightsApi.remove(id);
      await loadData();
      setSubmitSuccess('Frete excluido com sucesso.');
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir o frete.'));
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Fretes</h1>
          <p className="text-on-secondary-container mt-2">
            Registre viagens avulsas ou vinculadas a contrato sem misturar execucao operacional com faturamento.
          </p>
        </div>
        {canCreate && (
          <button onClick={handleOpenCreate} className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            NOVO FRETE
          </button>
        )}
      </div>

      {(submitSuccess || submitError || loadError) && (
        <div className={`rounded-2xl border px-5 py-4 text-sm font-medium ${submitError || loadError ? 'border-error/20 bg-error/5 text-error' : 'border-primary/20 bg-primary/5 text-primary'}`}>
          {submitError || loadError || submitSuccess}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard label="Fretes lancados" value={freights.length.toString()} />
        <KpiCard label="Receita no frete" value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
        <KpiCard label="Viagens de contrato recorrente" value={recurringOperationalTrips.toString()} />
        <KpiCard label="Ultimo frete" value={freights[0]?.date ? formatDateOnlyPtBr(freights[0].date) : '-'} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-surface-container-lowest rounded-xl p-2 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
            <Search className="w-5 h-5 text-outline ml-3" />
            <input type="text" placeholder="Buscar por placa, rota ou contrato..." className="w-full border-none focus:ring-0 bg-transparent text-on-surface text-sm py-2 px-4 placeholder:text-outline/60" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="h-6 w-px bg-outline/20 mx-2" />
            <div className="flex items-center gap-2 px-2">
              <Filter className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 bg-surface-container-low rounded-xl p-1">
          <div className="bg-surface-container-lowest rounded-lg p-6 h-full min-h-[420px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-lg text-on-surface">Lancamentos de Frete</h3>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-on-surface-variant font-medium">Carregando fretes...</p>
              </div>
            ) : filteredFreights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center text-outline/40 mb-4">
                  <Route className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-on-surface">Nenhum frete encontrado</h4>
                <p className="text-on-surface-variant max-w-xs mt-2">Cadastre um frete ou ajuste os filtros para visualizar os registros.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFreights.map((freight) => (
                  <div key={freight.id} className="group flex items-center p-3 rounded-xl hover:bg-primary-fixed-dim/10 transition-all">
                    <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center text-primary">
                      <Route className="w-6 h-6" />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold font-headline text-on-surface">{freight.route}</span>
                        <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded uppercase tracking-wider font-bold">{freight.plate}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold ${billingTypeTone(freight.billingType)}`}>
                          {billingTypeLabel(freight.billingType)}
                        </span>
                      </div>
                      <p className="text-xs text-on-secondary-container flex items-center gap-1 mt-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {formatDateOnlyPtBr(freight.date)}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-1 inline-flex items-center gap-1">
                        <MapPinned className="w-3.5 h-3.5" />
                        {freight.route}
                      </p>
                      {freight.contractName && (
                        <p className="text-[11px] text-on-surface-variant mt-1">
                          Contrato: <span className="font-semibold text-on-surface">{freight.contractName}</span>
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-on-surface-variant">
                        Cargas:{' '}
                        <span className="font-semibold text-on-surface">
                          {cargoCountByFreightId[freight.id] || 0}
                        </span>
                        {freight.hasCargo === false ? ' (controle opcional desativado)' : ''}
                      </p>
                    </div>
                    <div className="hidden sm:block text-right mr-6">
                      <span className="text-sm font-bold text-on-surface">{`R$ ${Number(freight.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                      <p className="text-[10px] text-on-secondary-container uppercase">
                        {freight.billingType === 'contract_recurring' ? 'Sem receita por viagem' : 'Receita no frete'}
                      </p>
                    </div>
                    {(canUpdate || canDelete || canReadCargas || canCreateCargas) && (
                      <div className="flex items-center gap-2">
                        {canReadCargas && freight.hasCargo !== false ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/cargas?freightId=${freight.id}`)}
                            className="rounded-full p-2 text-outline transition-colors hover:bg-surface-container hover:text-on-surface"
                            aria-label={`Ver cargas do frete ${freight.route}`}
                          >
                            <Search className="h-5 w-5" />
                          </button>
                        ) : null}
                        {canCreateCargas && freight.hasCargo !== false ? (
                          <button
                            type="button"
                            onClick={() => handleOpenAddCargo(freight)}
                            className="rounded-full p-2 text-outline transition-colors hover:bg-primary/10 hover:text-primary"
                            aria-label={`Adicionar carga ao frete ${freight.route}`}
                          >
                            <PackagePlus className="h-5 w-5" />
                          </button>
                        ) : null}
                        {canUpdate && (
                          <button onClick={() => handleEdit(freight)} className="p-2 text-outline hover:text-on-surface transition-colors">
                            <Edit2 className="w-5 h-5" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(freight.id)} className="p-2 text-outline hover:text-error transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={resetForm} title={editingFreight ? 'Editar frete' : 'Novo frete'}>
        <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-6">
          <div ref={alertRef}>
            <FormAlert message={formMessage} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <FieldLabel required>Tipo de frete</FieldLabel>
              <CustomSelect
                value={formData.freightType}
                onChange={(value) => {
                  const nextType = value as 'standalone' | 'contract';
                  updateField('freightType', nextType);
                  setFormData((current) => ({
                    ...current,
                    freightType: nextType,
                    contractId: nextType === 'contract' ? current.contractId : '',
                    amount: nextType === 'contract' && selectedContract?.remunerationType === 'recurring' ? '' : current.amount,
                  }));
                }}
                error={fieldErrors.freightType}
                options={[
                  { value: 'standalone', label: 'Frete avulso' },
                  { value: 'contract', label: 'Frete por contrato' },
                ]}
              />
            </div>

            {formData.freightType === 'contract' && (
              <div className="space-y-2 md:col-span-2">
                <FieldLabel required>Contrato</FieldLabel>
                <CustomSelect
                  value={formData.contractId}
                  onChange={(nextContractId) => {
                    const nextContract = contracts.find((contract) => contract.id === nextContractId);
                    const shouldResetVehicle = nextContract && !nextContract.vehicleIds.includes(formData.vehicleId);
                    updateField('contractId', nextContractId);
                    setFormData((current) => ({
                      ...current,
                      contractId: nextContractId,
                      vehicleId: shouldResetVehicle ? '' : current.vehicleId,
                      plate: shouldResetVehicle ? '' : current.plate,
                      amount: nextContract?.remunerationType === 'recurring' ? '' : current.amount,
                    }));
                  }}
                  error={fieldErrors.contractId}
                  placeholder="Selecione um contrato"
                  options={selectableContracts.map((contract) => ({
                    value: contract.id,
                    label: `${contract.contractName} - ${contract.companyName}`,
                  }))}
                />
              </div>
            )}

            {showOperationalFields && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <FieldLabel required>Possui cargas?</FieldLabel>
                  <CustomSelect
                    value={formData.hasCargo}
                    onChange={(value) => updateField('hasCargo', value)}
                    error={fieldErrors.hasCargo}
                    options={[
                      { value: 'true', label: 'Sim' },
                      { value: 'false', label: 'Nao' },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel required>Placa</FieldLabel>
                  <CustomSelect
                    value={formData.vehicleId}
                    onChange={(value) => {
                      const selectedVehicle = availableVehicles.find((vehicle) => vehicle.id === value);
                      updateField('vehicleId', value);
                      setFormData((current) => ({ ...current, vehicleId: value, plate: selectedVehicle?.plate || current.plate }));
                    }}
                    error={fieldErrors.vehicleId}
                    placeholder={selectedContract ? 'Selecione um caminhao do contrato' : 'Selecione um caminhao'}
                    options={availableVehicles.map((vehicle) => ({ value: vehicle.id, label: `${vehicle.plate} - ${vehicle.name}` }))}
                  />
                </div>

                <FormDatePicker label="Data" value={formData.date} onChange={(value) => updateField('date', value)} error={fieldErrors.date} />

                <Field label="Rota" value={formData.route} onChange={(value) => updateField('route', value)} containerClassName="md:col-span-2" placeholder="Ex: Campinas/SP x Belo Horizonte/MG" error={fieldErrors.route} />

                {requiresAmount ? (
                  <Field label="Valor do frete" type="number" min={0} step="0.01" value={formData.amount} onChange={(value) => updateField('amount', value)} error={fieldErrors.amount} />
                ) : (
                  <div className="md:col-span-2 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-on-surface">
                    Este frete sera registrado apenas para controle operacional. O faturamento continuara vindo do contrato recorrente.
                  </div>
                )}
              </>
            )}
          </div>

          {formData.freightType === 'contract' && selectedContract?.remunerationType === 'per_trip' && (
            <div className="rounded-2xl border border-secondary-container bg-secondary-container/30 px-4 py-3 text-sm text-on-surface">
              Este contrato trabalha com receita por viagem. O valor do frete continua obrigatorio e sera refletido nas receitas.
            </div>
          )}

          {formData.freightType === 'contract' && !selectedContract && (
            <div className="rounded-2xl border border-outline-variant bg-surface-container px-4 py-3 text-sm text-on-surface">
              Selecione um contrato para liberar os campos do frete, carregar apenas os veiculos vinculados e aplicar a regra correta de faturamento.
            </div>
          )}

          {vehicles.length === 0 && <div className="bg-tertiary-container/20 text-on-surface rounded-2xl p-4 text-sm">Cadastre ao menos um caminhao em Veiculos para lancar um frete com placa vinculada.</div>}
          {selectedContract && availableVehicles.length === 0 && (
            <div className="bg-error/5 text-error rounded-2xl p-4 text-sm">
              Este contrato nao possui caminhoes vinculados. Atualize o contrato antes de lancar o frete.
            </div>
          )}

          <div className="pt-6 flex justify-end gap-4">
            <button type="button" onClick={resetForm} className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Cancelar</button>
            <button disabled={isSubmitting || !canSubmit} type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editingFreight ? 'Salvar alteracoes' : 'Cadastrar frete'}
            </button>
          </div>
        </form>
      </Modal>

      <CargoFormModal
        isOpen={isCargoModalOpen}
        editing={Boolean(editingCargo)}
        submitError={cargoSubmitError}
        fieldErrors={cargoFieldErrors}
        isSubmitting={isSubmittingCargo}
        formData={cargoFormData}
        freights={freights.filter((freight) => freight.hasCargo !== false)}
        companies={companies}
        freightLocked={Boolean(cargoFormData.freightId && !editingCargo)}
        onClose={closeCargoModal}
        onSubmit={handleSubmitCargo}
        onChange={setCargoFormData}
        onClearFieldError={(field) =>
          setCargoFieldErrors((current) => {
            return clearFieldError(current, field);
          })
        }
      />
    </div>
  );
}

function billingTypeLabel(billingType?: Freight['billingType']) {
  switch (billingType) {
    case 'contract_recurring':
      return 'Contrato recorrente';
    case 'contract_per_trip':
      return 'Contrato por viagem';
    default:
      return 'Frete avulso';
  }
}

function billingTypeTone(billingType?: Freight['billingType']) {
  switch (billingType) {
    case 'contract_recurring':
      return 'bg-primary-fixed text-primary';
    case 'contract_per_trip':
      return 'bg-secondary-container text-on-secondary-container';
    default:
      return 'bg-tertiary-container text-on-tertiary-container';
  }
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  min,
  step,
  placeholder,
  containerClassName,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  step?: string;
  placeholder?: string;
  containerClassName?: string;
  error?: string;
}) {
  return (
    <Input
      label={label}
      required
      type={type}
      min={min}
      step={step}
      placeholder={placeholder}
      value={value}
      error={error}
      onChange={(event) => onChange(event.target.value)}
      containerClassName={containerClassName}
      className="rounded-xl bg-surface-container"
    />
  );
}

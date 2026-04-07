import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Edit2, Filter, Loader2, MapPinned, Plus, Route, Search, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useFirebase } from '../context/FirebaseContext';
import { contractsApi, freightsApi, vehiclesApi } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { canAccess } from '../lib/permissions';
import { Contract, Freight, Vehicle } from '../types';

const initialFormData = {
  freightType: 'standalone',
  vehicleId: '',
  plate: '',
  contractId: '',
  date: '',
  route: '',
  amount: '',
};

export default function Freights() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'freights', 'create');
  const canUpdate = canAccess(userProfile, 'freights', 'update');
  const canDelete = canAccess(userProfile, 'freights', 'delete');
  const [freights, setFreights] = useState<Freight[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFreight, setEditingFreight] = useState<Freight | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [freightsData, vehiclesData, contractsData] = await Promise.all([
        freightsApi.list(),
        vehiclesApi.list(),
        contractsApi.list(),
      ]);
      setFreights(freightsData);
      setVehicles(vehiclesData);
      setContracts(contractsData);
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
  const requiresContractSelection = formData.freightType === 'contract' && !selectedContract;
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
  const filteredFreights = useMemo(
    () =>
      freights.filter((freight) =>
        freight.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freight.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (freight.contractName || '').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [freights, searchTerm]
  );

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingFreight(null);
    setSubmitError('');
    setIsModalOpen(false);
  };

  const handleOpenCreate = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setFormData(initialFormData);
    setEditingFreight(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === formData.vehicleId);
    const payload = {
      vehicleId: formData.vehicleId,
      plate: selectedVehicle?.plate || formData.plate,
      contractId: formData.freightType === 'contract' ? formData.contractId || undefined : undefined,
      date: formData.date,
      route: formData.route.trim(),
      amount: requiresAmount ? Number(formData.amount) : 0,
    };

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
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
      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar o frete.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (freight: Freight) => {
    const linkedVehicle = vehicles.find((vehicle) => vehicle.id === freight.vehicleId || vehicle.plate === freight.plate);
    setEditingFreight(freight);
    setFormData({
      freightType: freight.contractId ? 'contract' : 'standalone',
      vehicleId: linkedVehicle?.id || freight.vehicleId,
      plate: freight.plate,
      contractId: freight.contractId || '',
      date: freight.date,
      route: freight.route,
      amount: freight.amount ? String(freight.amount) : '',
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

  const selectableContracts = useMemo(
    () => contracts.filter((contract) =>
      contract.status === 'active' ||
      contract.status === 'renewal' ||
      contract.id === formData.contractId
    ),
    [contracts, formData.contractId]
  );

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
        <StatCard label="Fretes lancados" value={freights.length.toString()} />
        <StatCard label="Receita no frete" value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
        <StatCard label="Viagens de contrato recorrente" value={recurringOperationalTrips.toString()} />
        <StatCard label="Ultimo frete" value={freights[0]?.date ? new Date(freights[0].date).toLocaleDateString('pt-BR') : '-'} />
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
                        {new Date(freight.date).toLocaleDateString('pt-BR')}
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
                    </div>
                    <div className="hidden sm:block text-right mr-6">
                      <span className="text-sm font-bold text-on-surface">{`R$ ${Number(freight.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                      <p className="text-[10px] text-on-secondary-container uppercase">
                        {freight.billingType === 'contract_recurring' ? 'Sem receita por viagem' : 'Receita no frete'}
                      </p>
                    </div>
                    {(canUpdate || canDelete) && (
                      <div className="flex items-center gap-2">
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
              {submitError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipo de frete</label>
              <select
                className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={formData.freightType}
                onChange={(e) => {
                  const nextType = e.target.value as 'standalone' | 'contract';
                  setFormData((current) => ({
                    ...current,
                    freightType: nextType,
                    contractId: nextType === 'contract' ? current.contractId : '',
                    vehicleId: nextType === 'contract' ? current.vehicleId : current.vehicleId,
                    plate: nextType === 'contract' ? current.plate : current.plate,
                    amount: nextType === 'contract' && selectedContract?.remunerationType === 'recurring' ? '' : current.amount,
                  }));
                }}
              >
                <option value="standalone">Frete avulso</option>
                <option value="contract">Frete por contrato</option>
              </select>
            </div>

            {formData.freightType === 'contract' && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Contrato</label>
                <select
                  required
                  className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={formData.contractId}
                  onChange={(e) => {
                    const nextContractId = e.target.value;
                    const nextContract = contracts.find((contract) => contract.id === nextContractId);
                    const shouldResetVehicle = nextContract && !nextContract.vehicleIds.includes(formData.vehicleId);
                    setFormData((current) => ({
                      ...current,
                      contractId: nextContractId,
                      vehicleId: shouldResetVehicle ? '' : current.vehicleId,
                      plate: shouldResetVehicle ? '' : current.plate,
                      amount: nextContract?.remunerationType === 'recurring' ? '' : current.amount,
                    }));
                  }}
                >
                  <option value="">Selecione um contrato</option>
                  {selectableContracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.contractName} - {contract.companyName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showOperationalFields && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Placa</label>
                  <select required className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" value={formData.vehicleId} onChange={(e) => {
                    const selectedVehicle = availableVehicles.find((vehicle) => vehicle.id === e.target.value);
                    setFormData({ ...formData, vehicleId: e.target.value, plate: selectedVehicle?.plate || '' });
                  }}>
                    <option value="">{selectedContract ? 'Selecione um caminhao do contrato' : 'Selecione um caminhao'}</option>
                    {availableVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} - {vehicle.name}</option>)}
                  </select>
                </div>

                <Field label="Data" type="date" value={formData.date} onChange={(value) => setFormData({ ...formData, date: value })} />

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Rota</label>
                  <input required type="text" className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Ex: Campinas/SP x Belo Horizonte/MG" value={formData.route} onChange={(e) => setFormData({ ...formData, route: e.target.value })} />
                </div>

                {requiresAmount ? (
                  <Field label="Valor do frete" type="number" value={formData.amount} onChange={(value) => setFormData({ ...formData, amount: value })} />
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
            <button disabled={isSubmitting || vehicles.length === 0 || !formData.vehicleId || requiresContractSelection || (selectedContract && availableVehicles.length === 0)} type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editingFreight ? 'Salvar alteracoes' : 'Cadastrar frete'}
            </button>
          </div>
        </form>
      </Modal>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant shadow-sm"><p className="text-sm font-medium text-on-surface-variant mb-2">{label}</p><p className="text-3xl font-black text-on-surface">{value}</p></div>;
}

function Field({ label, value, onChange, type = 'text', required = true, disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; disabled?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <input required={required} disabled={disabled} min={type === 'number' ? 0 : undefined} step={type === 'number' ? '0.01' : undefined} type={type} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-60" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

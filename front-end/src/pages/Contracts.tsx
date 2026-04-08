import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CalendarRange, Edit2, FileText, Filter, Loader2, Plus, Search, Trash2, Truck, Wallet } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import KpiCard from '../components/KpiCard';
import Modal from '../components/Modal';
import { useFirebase } from '../context/FirebaseContext';
import { companiesApi, contractsApi, vehiclesApi } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { canAccess } from '../lib/permissions';
import { Company, Contract, Vehicle } from '../types';

const initialFormData = {
  companyId: '',
  companyName: '',
  contractName: '',
  remunerationType: 'recurring' as const,
  annualValue: '',
  startDate: '',
  endDate: '',
  status: 'active' as const,
  notes: '',
  vehicleIds: [] as string[],
};

export default function Contracts() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'contracts', 'create');
  const canUpdate = canAccess(userProfile, 'contracts', 'update');
  const canDelete = canAccess(userProfile, 'contracts', 'delete');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState(initialFormData);

  const loadData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [contractsData, vehiclesData, companiesData] = await Promise.all([
        contractsApi.list(),
        vehiclesApi.list(),
        companiesApi.list(),
      ]);
      setContracts(contractsData);
      setVehicles(vehiclesData);
      setCompanies(companiesData);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Nao foi possivel carregar os contratos.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const totalAnnualValue = useMemo(() => contracts.reduce((acc, contract) => acc + Number(contract.annualValue || 0), 0), [contracts]);
  const totalMonthlyValue = useMemo(() => contracts.reduce((acc, contract) => acc + Number(contract.monthlyValue || 0), 0), [contracts]);
  const allocatedVehicleIds = useMemo(() => new Set(contracts.flatMap((contract) => contract.vehicleIds || [])), [contracts]);
  const computedMonthlyValue = useMemo(() => (Number(formData.annualValue || 0) > 0 ? Number(formData.annualValue) / 12 : 0), [formData.annualValue]);

  const filteredContracts = useMemo(
    () =>
      contracts.filter((contract) => {
        const matchesSearch =
          contract.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (contract.vehicleNames || []).some((vehicleName) => vehicleName.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [contracts, searchTerm, statusFilter]
  );

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingContract(null);
    setSubmitError('');
    setIsModalOpen(false);
  };

  const handleOpenCreate = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setFormData(initialFormData);
    setEditingContract(null);
    setIsModalOpen(true);
  };

  const handleToggleVehicle = (vehicleId: string) => {
    setFormData((current) => ({
      ...current,
      vehicleIds: current.vehicleIds.includes(vehicleId)
        ? current.vehicleIds.filter((id) => id !== vehicleId)
        : [...current.vehicleIds, vehicleId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    const annualValue = formData.remunerationType === 'recurring' ? Number(formData.annualValue) : 0;
    const selectedCompany = companies.find((company) => company.id === formData.companyId);
    const selectedVehicles = vehicles.filter((vehicle) => formData.vehicleIds.includes(vehicle.id));
    const payload = {
      companyId: formData.companyId,
      companyName: selectedCompany?.corporateName || formData.companyName,
      contractName: formData.contractName,
      remunerationType: formData.remunerationType,
      annualValue,
      monthlyValue: formData.remunerationType === 'recurring' ? annualValue / 12 : 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      notes: formData.notes,
      vehicleIds: selectedVehicles.map((vehicle) => vehicle.id),
      vehicleNames: selectedVehicles.map((vehicle) => `${vehicle.name} (${vehicle.plate})`),
    };

    setIsSubmitting(true);
    try {
      if (editingContract) {
        await contractsApi.update(editingContract.id, payload);
      } else {
        await contractsApi.create(payload as Omit<Contract, 'id'>);
      }
      await loadData();
      setSubmitSuccess(editingContract ? 'Contrato atualizado com sucesso.' : 'Contrato cadastrado com sucesso.');
      resetForm();
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar o contrato.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      companyId: contract.companyId || '',
      companyName: contract.companyName,
      contractName: contract.contractName,
      remunerationType: contract.remunerationType || 'recurring',
      annualValue: String(contract.annualValue),
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
      notes: contract.notes || '',
      vehicleIds: contract.vehicleIds || [],
    });
    setSubmitError('');
    setSubmitSuccess('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir este contrato?')) return;
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await contractsApi.remove(id);
      await loadData();
      setSubmitSuccess('Contrato excluido com sucesso.');
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir o contrato.'));
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Gestao de contratos</p>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mt-2">Contratos de clientes</h1>
          <p className="text-on-surface-variant mt-2 max-w-3xl">
            Cadastre contratos anuais, acompanhe o repasse mensal e vincule um ou mais caminhoes da frota para cada empresa atendida.
          </p>
        </div>
        {canCreate && (
          <button onClick={handleOpenCreate} className="bg-primary text-on-primary rounded-full px-6 py-2.5 font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            NOVO CONTRATO
          </button>
        )}
      </div>

      {(submitSuccess || submitError || loadError) && (
        <div className={`rounded-2xl border px-5 py-4 text-sm font-medium ${submitError || loadError ? 'border-error/20 bg-error/5 text-error' : 'border-primary/20 bg-primary/5 text-primary'}`}>
          {submitError || loadError || submitSuccess}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard label="Contratos ativos" value={contracts.filter((contract) => contract.status === 'active').length.toString()} icon={FileText} />
        <KpiCard label="Receita anual contratada" value={`R$ ${totalAnnualValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} />
        <KpiCard label="Repasse mensal previsto" value={`R$ ${totalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={CalendarRange} />
        <KpiCard label="Caminhoes alocados" value={allocatedVehicleIds.size.toString()} icon={Truck} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-surface-container-lowest rounded-xl p-2 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
            <Search className="w-5 h-5 text-outline ml-3" />
            <input
              type="text"
              placeholder="Buscar por empresa, contrato ou caminhao vinculado..."
              className="w-full border-none focus:ring-0 bg-transparent text-on-surface text-sm py-2 px-4 placeholder:text-outline/60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="h-6 w-px bg-outline/20 mx-2" />
            <div className="flex items-center gap-2 px-2">
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                variant="inline"
                options={[
                  { value: 'all', label: 'Todos os Status' },
                  { value: 'active', label: 'Ativo' },
                  { value: 'renewal', label: 'Renovacao' },
                  { value: 'closed', label: 'Encerrado' },
                ]}
              />
              <Filter className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 bg-surface-container-low rounded-xl p-1">
          <div className="bg-surface-container-lowest rounded-lg p-6 h-full min-h-[420px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-lg text-on-surface">Lancamentos de Contratos</h3>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-on-surface-variant font-medium">Carregando contratos...</p>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center text-outline/40 mb-4">
                  <FileText className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-on-surface">Nenhum contrato encontrado</h4>
                <p className="text-on-surface-variant max-w-xs mt-2">
                  Cadastre um contrato novo ou ajuste os filtros para visualizar os registros.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContracts.map((contract) => (
                  <div key={contract.id} className="group flex items-center p-3 rounded-xl hover:bg-primary-fixed-dim/10 transition-all">
                    <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center text-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold font-headline text-on-surface">{contract.contractName}</span>
                        <span className="text-[10px] bg-primary-fixed text-primary px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                          {contract.remunerationType === 'per_trip' ? 'Receita por viagem' : 'Receita recorrente'}
                        </span>
                        <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                          {statusLabel(contract.status)}
                        </span>
                      </div>
                      <p className="text-xs text-on-secondary-container flex items-center gap-1 mt-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {contract.companyName}
                      </p>
                      <p className="text-[11px] text-on-surface-variant mt-1">
                        Periodo: {contract.startDate || '-'} ate {contract.endDate || '-'} • Caminhoes: {contract.vehicleNames?.length || 0}
                      </p>
                      {!!contract.vehicleNames?.length && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {contract.vehicleNames.slice(0, 3).map((vehicleName) => (
                            <span key={vehicleName} className="px-2 py-1 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">
                              {vehicleName}
                            </span>
                          ))}
                          {contract.vehicleNames.length > 3 && (
                            <span className="px-2 py-1 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-bold">
                              +{contract.vehicleNames.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="hidden sm:block text-right mr-6">
                      <span className="text-sm font-bold text-on-surface">
                        {`R$ ${Number(contract.monthlyValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </span>
                      <p className="text-[10px] text-on-secondary-container uppercase">
                        anual {`R$ ${Number(contract.annualValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </p>
                    </div>
                    {(canUpdate || canDelete) && (
                      <div className="flex items-center gap-2">
                        {canUpdate && (
                          <button onClick={() => handleEdit(contract)} className="p-2 text-outline hover:text-on-surface transition-colors">
                            <Edit2 className="w-5 h-5" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(contract.id)} className="p-2 text-outline hover:text-error transition-colors">
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

      <Modal isOpen={isModalOpen} onClose={resetForm} title={editingContract ? 'Editar contrato' : 'Novo contrato'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">
              {submitError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Empresa contratante</label>
              <CustomSelect
                value={formData.companyId}
                onChange={(value) => {
                  const selectedCompany = companies.find((company) => company.id === value);
                  setFormData({ ...formData, companyId: value, companyName: selectedCompany?.corporateName || '' });
                }}
                placeholder="Selecione uma empresa cadastrada"
                options={companies.map((company) => ({ value: company.id, label: `${company.corporateName} (${company.cnpj})` }))}
              />
            </div>
            <Field label="Nome do contrato" value={formData.contractName} onChange={(value) => setFormData({ ...formData, contractName: value })} />
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipo de remuneracao</label>
              <CustomSelect
                value={formData.remunerationType}
                onChange={(value) => setFormData({ ...formData, remunerationType: value as 'recurring' | 'per_trip' })}
                options={[
                  { value: 'recurring', label: 'Receita recorrente' },
                  { value: 'per_trip', label: 'Receita por viagem' },
                ]}
              />
            </div>
            {formData.remunerationType === 'recurring' && (
              <>
                <Field label="Valor anual do contrato" type="number" value={formData.annualValue} onChange={(value) => setFormData({ ...formData, annualValue: value })} />
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Repasse mensal previsto</label>
                  <div className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-on-surface font-bold">
                    R$ {computedMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </>
            )}
            <Field label="Data de inicio" type="date" value={formData.startDate} onChange={(value) => setFormData({ ...formData, startDate: value })} />
            <Field label="Data de termino" type="date" value={formData.endDate} onChange={(value) => setFormData({ ...formData, endDate: value })} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status do contrato</label>
            <CustomSelect
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value as 'active' | 'renewal' | 'closed' })}
              options={[
                { value: 'active', label: 'Ativo' },
                { value: 'renewal', label: 'Em renovacao' },
                { value: 'closed', label: 'Encerrado' },
              ]}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Caminhoes vinculados</label>
              <span className="text-xs text-on-surface-variant">{formData.vehicleIds.length} selecionado(s)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vehicles.length === 0 ? (
                <div className="md:col-span-2 bg-surface-container rounded-2xl p-4 text-sm text-on-surface-variant">
                  Cadastre ao menos um caminhao em Veiculos para vincular ao contrato.
                </div>
              ) : vehicles.map((vehicle) => (
                <label key={vehicle.id} className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all ${formData.vehicleIds.includes(vehicle.id) ? 'border-primary bg-primary/5' : 'border-outline-variant bg-surface-container'}`}>
                  <input type="checkbox" className="mt-1" checked={formData.vehicleIds.includes(vehicle.id)} onChange={() => handleToggleVehicle(vehicle.id)} />
                  <div>
                    <p className="font-bold text-on-surface">{vehicle.name}</p>
                    <p className="text-sm text-on-surface-variant">{vehicle.plate} • {vehicle.driver}</p>
                  </div>
                </label>
              ))}
            </div>
            {companies.length === 0 && <div className="bg-tertiary-container/20 text-on-surface rounded-2xl p-4 text-sm">Cadastre antes uma empresa no menu Empresas para poder gerar contratos vinculados corretamente.</div>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Observacoes</label>
            <textarea
              rows={4}
              className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              placeholder="Detalhes operacionais, condicoes comerciais ou observacoes da operacao."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-6 flex justify-end gap-4">
            <button type="button" onClick={resetForm} className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Cancelar</button>
            <button
              disabled={isSubmitting || vehicles.length === 0 || companies.length === 0 || formData.vehicleIds.length === 0 || !formData.companyId}
              type="submit"
              className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editingContract ? 'Salvar alteracoes' : 'Cadastrar contrato'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <input required type={type} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function statusLabel(status: Contract['status']) {
  switch (status) {
    case 'renewal':
      return 'Renovacao';
    case 'closed':
      return 'Encerrado';
    default:
      return 'Ativo';
  }
}

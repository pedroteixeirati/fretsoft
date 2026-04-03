import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CalendarRange, Edit2, FileText, Loader2, Plus, Trash2, Truck, Wallet } from 'lucide-react';
import Modal from '../components/Modal';
import { useFirebase } from '../context/FirebaseContext';
import { companiesApi, contractsApi, vehiclesApi } from '../lib/api';
import { canAccess } from '../lib/permissions';
import { Company, Contract, Vehicle } from '../types';

const initialFormData = {
  companyId: '',
  companyName: '',
  contractName: '',
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
  const [formData, setFormData] = useState(initialFormData);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contractsData, vehiclesData, companiesData] = await Promise.all([
        contractsApi.list(),
        vehiclesApi.list(),
        companiesApi.list(),
      ]);
      setContracts(contractsData);
      setVehicles(vehiclesData);
      setCompanies(companiesData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalAnnualValue = useMemo(() => contracts.reduce((acc, contract) => acc + Number(contract.annualValue || 0), 0), [contracts]);
  const totalMonthlyValue = useMemo(() => contracts.reduce((acc, contract) => acc + Number(contract.monthlyValue || 0), 0), [contracts]);
  const allocatedVehicleIds = useMemo(() => new Set(contracts.flatMap((contract) => contract.vehicleIds || [])), [contracts]);
  const computedMonthlyValue = useMemo(() => (Number(formData.annualValue || 0) > 0 ? Number(formData.annualValue) / 12 : 0), [formData.annualValue]);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingContract(null);
    setIsModalOpen(false);
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
    const annualValue = Number(formData.annualValue);
    const selectedCompany = companies.find((company) => company.id === formData.companyId);
    const selectedVehicles = vehicles.filter((vehicle) => formData.vehicleIds.includes(vehicle.id));
    const payload = {
      companyId: formData.companyId,
      companyName: selectedCompany?.corporateName || formData.companyName,
      contractName: formData.contractName,
      annualValue,
      monthlyValue: annualValue / 12,
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
      resetForm();
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
      annualValue: String(contract.annualValue),
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
      notes: contract.notes || '',
      vehicleIds: contract.vehicleIds || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir este contrato?')) return;
    await contractsApi.remove(id);
    await loadData();
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Gestão de contratos</p>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mt-2">Contratos de clientes</h1>
          <p className="text-on-surface-variant mt-2 max-w-3xl">Cadastre contratos anuais, acompanhe o repasse mensal e vincule um ou mais caminhões da frota para cada empresa atendida.</p>
        </div>
          {canCreate && (
            <button onClick={() => setIsModalOpen(true)} className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" />
              Novo contrato
            </button>
          )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Metric label="Contratos ativos" value={contracts.filter((contract) => contract.status === 'active').length.toString()} icon={FileText} />
        <Metric label="Receita anual contratada" value={`R$ ${totalAnnualValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} />
        <Metric label="Repasse mensal previsto" value={`R$ ${totalMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={CalendarRange} />
        <Metric label="Caminhões alocados" value={allocatedVehicleIds.size.toString()} icon={Truck} />
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-on-surface-variant font-medium">Carregando contratos...</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-12 text-center">
          <Building2 className="w-14 h-14 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-on-surface">Nenhum contrato cadastrado</h3>
          <p className="text-on-surface-variant mt-2 max-w-xl mx-auto">Comece cadastrando a empresa contratante, o valor anual do contrato e os caminhões que vão atender essa operação.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {contracts.map((contract) => (
            <article key={contract.id} className="bg-surface-container-lowest rounded-3xl border border-outline-variant p-7 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-2">{contract.companyName}</p>
                  <h2 className="text-2xl font-bold text-on-surface">{contract.contractName}</h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${contract.status === 'active' ? 'bg-primary-container text-on-primary-container' : contract.status === 'renewal' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container text-on-surface-variant'}`}>
                  {contract.status === 'active' ? 'Ativo' : contract.status === 'renewal' ? 'Renovação' : 'Encerrado'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Tile label="Valor anual" value={`R$ ${Number(contract.annualValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Tile label="Repasse mensal" value={`R$ ${Number(contract.monthlyValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </div>

              <div className="space-y-3 text-sm text-on-surface-variant mb-6">
                <p><span className="font-bold text-on-surface">Período:</span> {contract.startDate || '-'} até {contract.endDate || '-'}</p>
                <p><span className="font-bold text-on-surface">Caminhões vinculados:</span> {contract.vehicleNames?.length || 0}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(contract.vehicleNames || []).map((vehicleName) => (
                    <span key={vehicleName} className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">{vehicleName}</span>
                  ))}
                </div>
                {contract.notes && <p className="pt-2"><span className="font-bold text-on-surface">Observações:</span> {contract.notes}</p>}
              </div>

                {(canUpdate || canDelete) && (
                  <div className="pt-5 border-t border-outline-variant flex items-center justify-end gap-3">
                    {canUpdate && (
                      <button onClick={() => handleEdit(contract)} className="px-4 py-2 rounded-full text-sm font-bold text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"><Edit2 className="w-4 h-4" />Editar</button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(contract.id)} className="px-4 py-2 rounded-full text-sm font-bold text-error hover:bg-error/10 transition-colors flex items-center gap-2"><Trash2 className="w-4 h-4" />Excluir</button>
                    )}
                  </div>
                )}
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={resetForm} title={editingContract ? 'Editar contrato' : 'Novo contrato'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Empresa contratante</label>
              <select required className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" value={formData.companyId} onChange={(e) => {
                const selectedCompany = companies.find((company) => company.id === e.target.value);
                setFormData({ ...formData, companyId: e.target.value, companyName: selectedCompany?.corporateName || '' });
              }}>
                <option value="">Selecione uma empresa cadastrada</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.corporateName} ({company.cnpj})</option>)}
              </select>
            </div>
            <Field label="Nome do contrato" value={formData.contractName} onChange={(value) => setFormData({ ...formData, contractName: value })} />
            <Field label="Valor anual do contrato" type="number" value={formData.annualValue} onChange={(value) => setFormData({ ...formData, annualValue: value })} />
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Repasse mensal previsto</label>
              <div className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-on-surface font-bold">R$ {computedMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            <Field label="Data de início" type="date" value={formData.startDate} onChange={(value) => setFormData({ ...formData, startDate: value })} />
            <Field label="Data de término" type="date" value={formData.endDate} onChange={(value) => setFormData({ ...formData, endDate: value })} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status do contrato</label>
            <select className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'renewal' | 'closed' })}>
              <option value="active">Ativo</option>
              <option value="renewal">Em renovação</option>
              <option value="closed">Encerrado</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Caminhões vinculados</label>
              <span className="text-xs text-on-surface-variant">{formData.vehicleIds.length} selecionado(s)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vehicles.length === 0 ? (
                <div className="md:col-span-2 bg-surface-container rounded-2xl p-4 text-sm text-on-surface-variant">Cadastre ao menos um caminhão em Veículos para vincular ao contrato.</div>
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
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Observações</label>
            <textarea rows={4} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" placeholder="Detalhes operacionais, condições comerciais ou observações da operação." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          <div className="pt-6 flex justify-end gap-4">
            <button type="button" onClick={resetForm} className="px-8 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Cancelar</button>
            <button disabled={isSubmitting || vehicles.length === 0 || companies.length === 0 || formData.vehicleIds.length === 0 || !formData.companyId} type="submit" className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {editingContract ? 'Salvar alterações' : 'Cadastrar contrato'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant shadow-sm"><div className="flex items-center justify-between mb-3"><p className="text-sm font-medium text-on-surface-variant">{label}</p><Icon className="w-5 h-5 text-primary" /></div><p className="text-3xl font-black text-on-surface">{value}</p></div>;
}

function Tile({ label, value }: { label: string; value: string }) {
  return <div className="bg-surface-container rounded-2xl p-4"><p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">{label}</p><p className="text-xl font-black text-on-surface">{value}</p></div>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <input required type={type} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

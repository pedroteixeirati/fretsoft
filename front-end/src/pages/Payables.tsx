import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Edit2,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import Modal from '../components/Modal';
import { companiesApi, payablesApi, vehiclesApi } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { canAccess } from '../lib/permissions';
import { useFirebase } from '../context/FirebaseContext';
import { Company, NavItem, Payable, Vehicle } from '../types';

interface PayablesProps {
  onNavigate?: (item: NavItem) => void;
}

type PayableFormData = {
  sourceType: 'manual' | 'expense';
  sourceId: string;
  description: string;
  providerName: string;
  vehicleId: string;
  contractId: string;
  amount: number;
  dueDate: string;
  status: Payable['status'];
  paidAt: string;
  paymentMethod: string;
  proofUrl: string;
  notes: string;
};

const itemsPerPage = 10;

function defaultFormData(): PayableFormData {
  const today = new Date().toISOString().split('T')[0];
  return {
    sourceType: 'manual',
    sourceId: '',
    description: '',
    providerName: '',
    vehicleId: '',
    contractId: '',
    amount: 0,
    dueDate: today,
    status: 'open',
    paidAt: '',
    paymentMethod: '',
    proofUrl: '',
    notes: '',
  };
}

function currency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function statusLabel(status: Payable['status']) {
  switch (status) {
    case 'paid':
      return 'Paga';
    case 'overdue':
      return 'Em atraso';
    case 'canceled':
      return 'Cancelada';
    default:
      return 'Em aberto';
  }
}

function badgeTone(status: Payable['status']) {
  switch (status) {
    case 'paid':
      return 'bg-primary-fixed text-primary';
    case 'overdue':
      return 'bg-error/10 text-error';
    case 'canceled':
      return 'bg-surface-container text-on-surface-variant';
    default:
      return 'bg-secondary-container text-on-secondary-container';
  }
}

function inputClassName() {
  return 'w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-primary/20';
}

export default function Payables({ onNavigate }: PayablesProps) {
  const { user, userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'payables', 'create');
  const canUpdate = canAccess(userProfile, 'payables', 'update');
  const canDelete = canAccess(userProfile, 'payables', 'delete');

  const [payables, setPayables] = useState<Payable[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayable, setEditingPayable] = useState<Payable | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Payable['status']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<PayableFormData>(defaultFormData);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setLoadError('');
    try {
      const [payablesData, vehiclesData, companiesData] = await Promise.all([
        payablesApi.list(),
        vehiclesApi.list(),
        companiesApi.list(),
      ]);
      setPayables(payablesData);
      setVehicles(vehiclesData);
      setCompanies(companiesData);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Nao foi possivel carregar as contas a pagar.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user]);

  const filteredPayables = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return payables.filter((payable) => {
      const matchesSearch =
        payable.description.toLowerCase().includes(term) ||
        payable.providerName.toLowerCase().includes(term) ||
        (payable.vehicleName || '').toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || payable.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payables, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, payables.length]);

  const totalFiltered = filteredPayables.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalOpen = filteredPayables.filter((item) => item.status === 'open').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPaid = filteredPayables.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalOverdue = filteredPayables.filter((item) => item.status === 'overdue').reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalPages = Math.max(1, Math.ceil(filteredPayables.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPayables = filteredPayables.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  const handleOpenCreate = () => {
    setEditingPayable(null);
    setFormData(defaultFormData());
    setSubmitError('');
    setSubmitSuccess('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPayable(null);
    setFormData(defaultFormData());
    setSubmitError('');
  };

  const handleEdit = (payable: Payable) => {
    setEditingPayable(payable);
    setFormData({
      sourceType: payable.sourceType,
      sourceId: payable.sourceId || '',
      description: payable.description,
      providerName: payable.providerName || '',
      vehicleId: payable.vehicleId || '',
      contractId: payable.contractId || '',
      amount: Number(payable.amount || 0),
      dueDate: payable.dueDate,
      status: payable.status,
      paidAt: payable.paidAt || '',
      paymentMethod: payable.paymentMethod || '',
      proofUrl: payable.proofUrl || '',
      notes: payable.notes || '',
    });
    setSubmitError('');
    setSubmitSuccess('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const payload = {
        ...formData,
        sourceId: formData.sourceType === 'expense' ? formData.sourceId || undefined : undefined,
        vehicleId: formData.vehicleId || undefined,
        contractId: formData.contractId || undefined,
        providerName: formData.providerName || undefined,
        paidAt: formData.status === 'paid' ? formData.paidAt || formData.dueDate : formData.paidAt || undefined,
        paymentMethod: formData.paymentMethod || undefined,
        proofUrl: formData.proofUrl || undefined,
        notes: formData.notes || undefined,
      };

      if (editingPayable) {
        await payablesApi.update(editingPayable.id, payload);
      } else {
        await payablesApi.create(payload as Omit<Payable, 'id'>);
      }

      await loadData();
      setSubmitSuccess(editingPayable ? 'Conta a pagar atualizada com sucesso.' : 'Conta a pagar criada com sucesso.');
      handleCloseModal();
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar a conta a pagar.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta a pagar?')) return;
    try {
      await payablesApi.remove(id);
      await loadData();
      setSubmitSuccess('Conta a pagar excluida com sucesso.');
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir a conta a pagar.'));
    }
  };

  const handlePay = async (id: string) => {
    setProcessingId(id);
    try {
      await payablesApi.markPaid(id);
      await loadData();
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Nao foi possivel registrar o pagamento.'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleOverdue = async (id: string) => {
    setProcessingId(id);
    try {
      await payablesApi.markOverdue(id);
      await loadData();
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Nao foi possivel marcar a conta em atraso.'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm text-on-surface-variant">
          <span>Gestao Financeira</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-primary">Contas a pagar</span>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Contas a pagar</h1>
            <p className="mt-1 text-on-secondary-container">
              Controle vencimentos, baixas e atrasos sem perder o contexto de cada obrigacao financeira.
            </p>
          </div>
          <div className="flex gap-3">
            {onNavigate ? (
              <button type="button" onClick={() => onNavigate('expenses')} className="rounded-full border border-outline-variant bg-surface-container-low px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container">
                Ver custos operacionais
              </button>
            ) : null}
            {canCreate ? (
              <button type="button" onClick={handleOpenCreate} className="rounded-full bg-primary px-6 py-2.5 font-semibold text-on-primary shadow-lg shadow-primary/15 hover:brightness-110">
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova conta a pagar
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {(submitSuccess || submitError || loadError) ? (
        <div className={`rounded-2xl border px-5 py-4 text-sm font-medium ${submitError || loadError ? 'border-error/20 bg-error/5 text-error' : 'border-primary/20 bg-primary/5 text-primary'}`}>
          {submitError || loadError || submitSuccess}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-surface-container-lowest p-6 shadow-sm"><p className="text-sm text-on-surface-variant">Compromissos filtrados</p><p className="mt-1 text-2xl font-black text-on-surface">{currency(totalFiltered)}</p></div>
        <div className="rounded-2xl border bg-surface-container-lowest p-6 shadow-sm"><p className="text-sm text-on-surface-variant">Em aberto</p><p className="mt-1 text-2xl font-black text-on-surface">{currency(totalOpen)}</p></div>
        <div className="rounded-2xl border bg-surface-container-lowest p-6 shadow-sm"><p className="text-sm text-on-surface-variant">Pagas</p><p className="mt-1 text-2xl font-black text-on-surface">{currency(totalPaid)}</p></div>
        <div className="rounded-2xl border bg-surface-container-lowest p-6 shadow-sm"><p className="text-sm text-on-surface-variant">Em atraso</p><p className="mt-1 text-2xl font-black text-on-surface">{currency(totalOverdue)}</p></div>
      </div>

      <section className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low/50 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input type="text" placeholder="Buscar conta, fornecedor ou veiculo..." className="min-w-[260px] rounded-full border-none bg-surface py-2 pl-10 pr-4 text-sm font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | Payable['status'])} className="appearance-none bg-transparent text-sm font-semibold text-primary focus:outline-none">
                <option value="all">Todos os status</option>
                <option value="open">Em aberto</option>
                <option value="paid">Paga</option>
                <option value="overdue">Em atraso</option>
                <option value="canceled">Cancelada</option>
              </select>
              <Filter className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-sm font-semibold text-on-surface-variant">Mostrando <span className="text-primary">{filteredPayables.length}</span> de {payables.length} contas a pagar</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Vencimento</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Conta</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Origem</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Veiculo</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-right">Valor</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-center">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-20 text-center"><div className="flex flex-col items-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="font-medium text-on-surface-variant">Carregando contas a pagar...</p></div></td></tr>
              ) : paginatedPayables.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-20 text-center text-on-surface-variant">Nenhuma conta a pagar encontrada.</td></tr>
              ) : (
                paginatedPayables.map((payable) => {
                  const canPay = payable.status === 'open' || payable.status === 'overdue';
                  const canMarkOverdue = payable.status === 'open';
                  return (
                    <tr key={payable.id} className="transition-colors hover:bg-primary-fixed-dim/5">
                      <td className="px-6 py-5"><div className="text-sm font-semibold text-on-surface">{new Date(`${payable.dueDate}T00:00:00`).toLocaleDateString('pt-BR')}</div><div className="text-xs text-on-surface-variant">{payable.paidAt ? `Pago em ${new Date(`${payable.paidAt}T00:00:00`).toLocaleDateString('pt-BR')}` : 'Aguardando baixa'}</div></td>
                      <td className="px-6 py-5"><div className="text-sm font-medium text-on-surface">{payable.description}</div><div className="text-xs text-on-surface-variant">{payable.providerName || 'Sem fornecedor informado'}</div></td>
                      <td className="px-6 py-5"><span className="inline-flex rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-medium text-on-secondary-container">{payable.sourceType === 'expense' ? 'Custo operacional' : 'Manual'}</span></td>
                      <td className="px-6 py-5 text-sm text-on-surface">{payable.vehicleName || 'Nao vinculado'}</td>
                      <td className="px-6 py-5 text-right text-sm font-bold text-primary">{currency(Number(payable.amount || 0))}</td>
                      <td className="px-6 py-5 text-center"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeTone(payable.status)}`}>{statusLabel(payable.status)}</span></td>
                      <td className="px-6 py-5">
                        <div className="flex min-w-[320px] items-center justify-center gap-1 whitespace-nowrap">
                          {canPay ? <button type="button" onClick={() => handlePay(payable.id)} disabled={processingId === payable.id} className="rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-on-primary disabled:opacity-50">Pagar</button> : null}
                          {canMarkOverdue ? <button type="button" onClick={() => handleOverdue(payable.id)} disabled={processingId === payable.id} className="rounded-full bg-error/10 px-3 py-2 text-[11px] font-bold text-error disabled:opacity-50">Em atraso</button> : null}
                          {canUpdate ? <button type="button" onClick={() => handleEdit(payable)} className="rounded-full bg-surface-container px-3 py-2 text-[11px] font-bold text-on-surface">Editar</button> : null}
                          {canDelete ? <button type="button" onClick={() => handleDelete(payable.id)} className="rounded-full bg-surface-container px-3 py-2 text-[11px] font-bold text-error">Excluir</button> : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-low/30 p-6">
          <p className="text-xs text-on-surface-variant">Mostrando {paginatedPayables.length} resultado(s)</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container disabled:opacity-30" disabled={safeCurrentPage === 1}><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">{safeCurrentPage}</button>
            <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container disabled:opacity-30" disabled={safeCurrentPage === totalPages}><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPayable ? 'Editar conta a pagar' : 'Nova conta a pagar'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError ? <div className="rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error">{submitError}</div> : null}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Descricao</label><input required className={inputClassName()} value={formData.description} onChange={(e) => setFormData((current) => ({ ...current, description: e.target.value }))} placeholder="Ex: Manutencao preventiva" /></div>
            <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Fornecedor</label><input className={inputClassName()} value={formData.providerName} onChange={(e) => setFormData((current) => ({ ...current, providerName: e.target.value }))} placeholder="Ex: Oficina Diesel Centro" /></div>
            <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Origem</label><select className={inputClassName()} value={formData.sourceType} onChange={(e) => setFormData((current) => ({ ...current, sourceType: e.target.value as PayableFormData['sourceType'], sourceId: e.target.value === 'manual' ? '' : current.sourceId }))}><option value="manual">Manual</option><option value="expense">Custo operacional</option></select></div>
            <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">ID da origem</label><input className={inputClassName()} value={formData.sourceId} onChange={(e) => setFormData((current) => ({ ...current, sourceId: e.target.value }))} placeholder="UUID do custo operacional" disabled={formData.sourceType === 'manual'} /></div>
            <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Veiculo</label><select className={inputClassName()} value={formData.vehicleId} onChange={(e) => setFormData((current) => ({ ...current, vehicleId: e.target.value }))}><option value="">Nao vincular</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} ({vehicle.plate})</option>)}</select></div>
            <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Empresa</label><select className={inputClassName()} value={formData.contractId} onChange={(e) => setFormData((current) => ({ ...current, contractId: e.target.value }))}><option value="">Nao vincular</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.tradeName}</option>)}</select></div>
            <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Valor</label><input required type="number" step="0.01" className={inputClassName()} value={String(formData.amount)} onChange={(e) => setFormData((current) => ({ ...current, amount: Number(e.target.value) }))} /></div>
            <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Vencimento</label><input required type="date" className={inputClassName()} value={formData.dueDate} onChange={(e) => setFormData((current) => ({ ...current, dueDate: e.target.value }))} /></div>
            <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Status</label><select className={inputClassName()} value={formData.status} onChange={(e) => setFormData((current) => ({ ...current, status: e.target.value as Payable['status'] }))}><option value="open">Em aberto</option><option value="paid">Paga</option><option value="overdue">Em atraso</option><option value="canceled">Cancelada</option></select></div>
            <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Data do pagamento</label><input type="date" className={inputClassName()} value={formData.paidAt} onChange={(e) => setFormData((current) => ({ ...current, paidAt: e.target.value }))} disabled={formData.status !== 'paid'} /></div>
            <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Forma de pagamento</label><input className={inputClassName()} value={formData.paymentMethod} onChange={(e) => setFormData((current) => ({ ...current, paymentMethod: e.target.value }))} placeholder="Ex: PIX, boleto, transferencia" /></div>
            <div className="space-y-2"><label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Comprovante (URL)</label><input className={inputClassName()} value={formData.proofUrl} onChange={(e) => setFormData((current) => ({ ...current, proofUrl: e.target.value }))} placeholder="https://..." /></div>
            <div className="space-y-2 md:col-span-2"><label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Observacoes</label><textarea className={`${inputClassName()} min-h-[110px] resize-none`} value={formData.notes} onChange={(e) => setFormData((current) => ({ ...current, notes: e.target.value }))} placeholder="Contexto financeiro, acordo com fornecedor, observacoes de pagamento..." /></div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={handleCloseModal} className="rounded-full px-8 py-3 font-bold text-on-surface-variant hover:bg-surface-container">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="rounded-full bg-primary px-8 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 disabled:opacity-50">
              <span className="inline-flex items-center gap-2">{isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}{editingPayable ? 'Salvar alteracoes' : 'Criar conta a pagar'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

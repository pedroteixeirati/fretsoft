import React, { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, FileText, Filter, Loader2, MoreVertical, RefreshCw, Search } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import KpiCard from '../components/KpiCard';
import { revenuesApi } from '../lib/api';
import { formatDateOnlyPtBr } from '../lib/date';
import { Revenue } from '../types';

function currency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function canChargeRevenue(revenue: Revenue) {
  return (revenue.status === 'pending' || revenue.status === 'overdue') && !revenue.chargeReference;
}

function canReceiveRevenue(revenue: Revenue) {
  return revenue.status === 'pending' || revenue.status === 'billed' || revenue.status === 'overdue';
}

function canMarkRevenueAsOverdue(revenue: Revenue) {
  return revenue.status === 'pending' || revenue.status === 'billed';
}

export default function Revenues() {
  const itemsPerPage = 10;
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [processingRevenueId, setProcessingRevenueId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useEffectEvent(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') {
      setLoading(true);
    }
    setLoadError('');
    try {
      setRevenues(await revenuesApi.list());
    } catch {
      setLoadError('Nao foi possivel carregar as contas a receber agora. Tente atualizar novamente.');
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void loadData('initial');
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      void loadData('refresh');
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleCharge = async (revenueId: string) => {
    setProcessingRevenueId(revenueId);
    try {
      await revenuesApi.generateCharge(revenueId);
      await loadData('refresh');
    } finally {
      setProcessingRevenueId(null);
    }
  };

  const handleReceive = async (revenueId: string) => {
    setProcessingRevenueId(revenueId);
    try {
      await revenuesApi.markReceived(revenueId);
      await loadData('refresh');
    } finally {
      setProcessingRevenueId(null);
    }
  };

  const handleOverdue = async (revenueId: string) => {
    setProcessingRevenueId(revenueId);
    try {
      await revenuesApi.markOverdue(revenueId);
      await loadData('refresh');
    } finally {
      setProcessingRevenueId(null);
    }
  };

  const filteredRevenues = useMemo(
    () =>
      revenues.filter((revenue) => {
        const matchesSearch =
          revenue.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          revenue.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          revenue.competenceLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (revenue.chargeReference || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || revenue.status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [revenues, searchTerm, statusFilter]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, revenues.length]);

  const totalFiltered = filteredRevenues.reduce((sum, revenue) => sum + Number(revenue.amount || 0), 0);
  const totalReceived = filteredRevenues
    .filter((revenue) => revenue.status === 'received')
    .reduce((sum, revenue) => sum + Number(revenue.amount || 0), 0);
  const totalOpen = filteredRevenues
    .filter((revenue) => ['pending', 'billed'].includes(revenue.status))
    .reduce((sum, revenue) => sum + Number(revenue.amount || 0), 0);
  const totalOverdue = filteredRevenues
    .filter((revenue) => revenue.status === 'overdue')
    .reduce((sum, revenue) => sum + Number(revenue.amount || 0), 0);
  const totalPages = Math.max(1, Math.ceil(filteredRevenues.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRevenues = filteredRevenues.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Contas a receber</h1>
          <p className="text-on-secondary-container mt-2">
            Acompanhe cobrancas, recebimentos e atrasos das entradas financeiras geradas por contratos e fretes.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Titulos filtrados" value={currency(totalFiltered)} icon={FileText} tone="primary" />
        <KpiCard label="Recebidas" value={currency(totalReceived)} icon={RefreshCw} tone="success" />
        <KpiCard label="Em aberto" value={currency(totalOpen)} icon={Building2} tone="tertiary" />
        <KpiCard label="Em atraso" value={currency(totalOverdue)} icon={MoreVertical} tone="danger" />
      </div>

      <section className="bg-surface-container-lowest rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 bg-surface-container-low/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Buscar conta a receber..."
                className="pl-10 pr-4 py-2 bg-surface rounded-full border-none text-sm font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20 min-w-[240px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2">
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                variant="inline"
                options={[
                  { value: 'all', label: 'Todos os Status' },
                  { value: 'pending', label: 'Pendente' },
                  { value: 'billed', label: 'Cobrada' },
                  { value: 'received', label: 'Recebida' },
                  { value: 'overdue', label: 'Em atraso' },
                  { value: 'canceled', label: 'Cancelada' },
                ]}
              />
              <Filter className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="text-sm font-semibold text-on-surface-variant">
            Mostrando <span className="text-primary">{filteredRevenues.length}</span> de {revenues.length} contas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/10">
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Vencimento</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Conta</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Empresa</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Tipo</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant text-right">Valor</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant text-center">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-on-surface-variant text-center">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <p className="text-on-surface-variant font-medium">Carregando contas a receber...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRevenues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-on-surface-variant">
                    Nenhuma conta a receber encontrada.
                  </td>
                </tr>
              ) : (
                paginatedRevenues.map((revenue) => (
                  <tr key={revenue.id} className="hover:bg-primary-fixed-dim/5 transition-colors">
                    <td className="px-6 py-5">
                      <div className="text-sm font-semibold text-on-surface">
                        {formatDateOnlyPtBr(revenue.dueDate)}
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        {revenue.chargeReference ? `Ref: ${revenue.chargeReference}` : revenue.competenceLabel}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-primary">
                          <FileText className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="text-sm font-medium text-on-surface">{revenue.contractName}</div>
                          <div className="text-xs text-on-surface-variant">
                            {revenue.sourceType === 'freight' ? 'Cobranca de frete' : 'Cobranca mensal'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface">
                      <div className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-on-surface-variant" />
                        {revenue.companyName}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">
                        {revenue.sourceType === 'freight' ? 'Frete avulso' : revenue.competenceLabel}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-sm text-primary">
                      {currency(Number(revenue.amount || 0))}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${statusBadgeTone(revenue.status)}`}>
                        {statusLabel(revenue.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {(() => {
                        const canCharge = canChargeRevenue(revenue);
                        const canReceive = canReceiveRevenue(revenue);
                        const canMarkOverdue = canMarkRevenueAsOverdue(revenue);
                        const hasActions = canCharge || canReceive || canMarkOverdue;

                        return (
                          <div className="flex justify-center items-center gap-1 whitespace-nowrap min-w-[320px]">
                            {canCharge && (
                              <button
                                type="button"
                                onClick={() => handleCharge(revenue.id)}
                                disabled={processingRevenueId === revenue.id}
                                className="rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-on-primary transition-transform hover:scale-[1.02] disabled:opacity-50 shrink-0"
                              >
                                Cobrar
                              </button>
                            )}
                            {canReceive && (
                              <button
                                type="button"
                                onClick={() => handleReceive(revenue.id)}
                                disabled={processingRevenueId === revenue.id}
                                className="rounded-full bg-secondary-container px-3 py-2 text-[11px] font-bold text-on-secondary-container transition-colors hover:opacity-90 disabled:opacity-50 shrink-0"
                              >
                                Recebida
                              </button>
                            )}
                            {canMarkOverdue && (
                              <button
                                type="button"
                                onClick={() => handleOverdue(revenue.id)}
                                disabled={processingRevenueId === revenue.id}
                                className="rounded-full bg-error/10 px-3 py-2 text-[11px] font-bold text-error transition-colors hover:bg-error/15 disabled:opacity-50 shrink-0"
                              >
                                Em atraso
                              </button>
                            )}
                            {hasActions ? (
                              <button
                                type="button"
                                className="p-2 hover:bg-surface-container text-on-surface-variant rounded-full transition-colors shrink-0"
                                aria-label="Mais opcoes"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-xs font-medium text-on-surface-variant">Sem acoes</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-surface-container-low/30 border-t border-outline-variant/10 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">Mostrando {paginatedRevenues.length} resultado(s)</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors disabled:opacity-30"
              disabled={safeCurrentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-on-primary text-xs font-bold">
              {safeCurrentPage}
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors disabled:opacity-30"
              disabled={safeCurrentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function statusLabel(status: Revenue['status']) {
  switch (status) {
    case 'billed':
      return 'Cobrada';
    case 'received':
      return 'Recebida';
    case 'overdue':
      return 'Em atraso';
    case 'canceled':
      return 'Cancelada';
    default:
      return 'Pendente';
  }
}

function statusBadgeTone(status: Revenue['status']) {
  switch (status) {
    case 'billed':
      return 'bg-secondary-container text-on-secondary-container';
    case 'received':
      return 'bg-primary-fixed text-primary';
    case 'overdue':
      return 'bg-error/10 text-error';
    case 'canceled':
      return 'bg-surface-container text-on-surface-variant';
    default:
      return 'bg-tertiary/10 text-tertiary';
  }
}

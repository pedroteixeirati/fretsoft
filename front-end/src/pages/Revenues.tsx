import React, { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { Building2, FileText, Filter, MoreVertical, RefreshCw, Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import KpiCard from '../components/KpiCard';
import { revenuesApi } from '../lib/api';
import { canAccess } from '../lib/permissions';
import { formatDateOnlyPtBr } from '../lib/date';
import { Revenue } from '../types';
import DataTable, { DataTableColumn } from '../shared/ui/DataTable';
import FormDatePicker from '../shared/forms/FormDatePicker';
import { useFirebase } from '../context/FirebaseContext';

function currency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function canReceiveRevenue(revenue: Revenue) {
  return revenue.status === 'pending' || revenue.status === 'billed' || revenue.status === 'overdue';
}

function canMarkRevenueAsOverdue(revenue: Revenue) {
  return revenue.status === 'pending' || revenue.status === 'billed';
}

function revenueSourceLabel(revenue: Revenue) {
  if (revenue.sourceType === 'novalog_billing_item') return 'CT-e Novalog';
  if (revenue.sourceType === 'freight') return 'Cobranca de frete';
  return 'Cobranca mensal';
}

function receivableLabel(revenue: Revenue) {
  if (revenue.sourceType === 'novalog_billing_item') {
    const cteMatch = revenue.description.match(/CT-e\s+([^\s-]+)/i);
    return cteMatch ? `CT-e ${cteMatch[1]}` : revenue.contractName;
  }

  return revenue.contractName;
}

export default function Revenues() {
  const { userProfile } = useFirebase();
  const itemsPerPage = 10;
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedRevenueIdFilter = searchParams.get('revenueId') || '';
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [processingRevenueId, setProcessingRevenueId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('');
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
    const querySearch = searchParams.get('search') || '';
    setSearchTerm(querySearch);
  }, [searchParams]);

  useEffect(() => {
    const handleFocus = () => {
      void loadData('refresh');
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

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
        const normalizedCompany = revenue.companyName.toLowerCase();
        const matchesSearch =
          revenue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          normalizedCompany.includes(searchTerm.toLowerCase()) ||
          revenue.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          revenue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          revenue.competenceLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (revenue.chargeReference || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLinkedRevenue = !linkedRevenueIdFilter || revenue.id === linkedRevenueIdFilter;
        const matchesStatus = statusFilter === 'all' || revenue.status === statusFilter;
        const matchesCompany = companyFilter === 'all' || normalizedCompany === companyFilter;
        const matchesDueDate = !dueDateFilter || revenue.dueDate === dueDateFilter;

        return matchesSearch && matchesLinkedRevenue && matchesStatus && matchesCompany && matchesDueDate;
      }),
    [revenues, searchTerm, linkedRevenueIdFilter, statusFilter, companyFilter, dueDateFilter]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, companyFilter, dueDateFilter, revenues.length]);

  const companyOptions = useMemo(() => {
    const companies = Array.from(new Set(revenues.map((revenue) => revenue.companyName).filter(Boolean))).sort((first, second) =>
      first.localeCompare(second, 'pt-BR'),
    );

    return [
      { value: 'all', label: 'Todos os clientes' },
      ...companies.map((company) => ({ value: company.toLowerCase(), label: company })),
    ];
  }, [revenues]);

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
  const hasActiveFilters = Boolean(searchTerm || linkedRevenueIdFilter || statusFilter !== 'all' || companyFilter !== 'all' || dueDateFilter);
  const canUpdateRevenues = canAccess(userProfile, 'revenues', 'create');

  const clearFilters = () => {
    setSearchTerm('');
    setCompanyFilter('all');
    setStatusFilter('all');
    setDueDateFilter('');
    setSearchParams({});
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    if (linkedRevenueIdFilter || searchParams.get('search')) {
      setSearchParams(value ? { search: value } : {});
    }
  };

  const renderActions = (revenue: Revenue) => {
    if (!canUpdateRevenues) {
      return <span className="text-xs font-medium text-on-surface-variant">Somente leitura</span>;
    }

    const canReceive = canReceiveRevenue(revenue);
    const canMarkOverdue = canMarkRevenueAsOverdue(revenue);
    const isProcessing = processingRevenueId === revenue.id;

    if (!canReceive && !canMarkOverdue) {
      return <span className="text-xs font-medium text-on-surface-variant">Sem acoes</span>;
    }

    return (
      <div className="flex items-center justify-end gap-1">
        {canReceive ? (
          <button
            type="button"
            onClick={() => handleReceive(revenue.id)}
            disabled={isProcessing}
            className="rounded-full bg-secondary-container px-3 py-1.5 text-[11px] font-bold text-on-secondary-container transition hover:brightness-105 disabled:opacity-50"
          >
            Recebida
          </button>
        ) : null}
        {canMarkOverdue ? (
          <button
            type="button"
            onClick={() => handleOverdue(revenue.id)}
            disabled={isProcessing}
            className="rounded-full bg-error/10 px-3 py-1.5 text-[11px] font-bold text-error transition-colors hover:bg-error/15 disabled:opacity-50"
          >
            Em atraso
          </button>
        ) : null}
      </div>
    );
  };

  const columns: Array<DataTableColumn<Revenue>> = [
    {
      id: 'dueDate',
      header: 'Vencimento',
      cell: (revenue) => (
        <div>
          <div className="text-sm font-bold text-on-surface">{formatDateOnlyPtBr(revenue.dueDate)}</div>
          <div className="text-xs text-on-surface-variant">
            {revenue.chargeReference ? `Ref: ${revenue.chargeReference}` : revenue.competenceLabel}
          </div>
        </div>
      ),
    },
    {
      id: 'account',
      header: 'Recebivel',
      cell: (revenue) => (
        <div className="flex min-w-[220px] items-center gap-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed/50 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-on-surface">{receivableLabel(revenue)}</div>
            <div className="text-xs text-on-surface-variant">{revenueSourceLabel(revenue)}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'company',
      header: 'Cliente',
      cell: (revenue) => (
        <div className="inline-flex max-w-[180px] items-center gap-1.5 text-sm text-on-surface">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-on-surface-variant" />
          <span className="truncate">{revenue.companyName}</span>
        </div>
      ),
    },
    {
      id: 'amount',
      header: 'Valor',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (revenue) => (
        <span className="whitespace-nowrap text-sm font-black text-primary">{currency(Number(revenue.amount || 0))}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      headerClassName: 'text-center',
      className: 'text-center',
      cell: (revenue) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusBadgeTone(revenue.status)}`}>
          {statusLabel(revenue.status)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Acoes',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: renderActions,
    },
  ];

  const toolbar = (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex h-12 w-[13.25rem] items-center gap-2 rounded-full bg-surface px-4 ring-1 ring-primary/5 transition focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="h-4 w-4 shrink-0 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Recebivel"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-primary outline-none placeholder:text-on-surface-variant"
            value={searchTerm}
            onChange={(event) => handleSearchTermChange(event.target.value)}
          />
        </div>
        <div className="flex h-12 items-center gap-2 rounded-full bg-surface px-4 ring-1 ring-primary/5">
          <CustomSelect
            value={companyFilter}
            onChange={setCompanyFilter}
            variant="inline"
            options={companyOptions}
            menuClassName="w-[18rem]"
          />
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex h-12 items-center gap-2 rounded-full bg-surface px-4 ring-1 ring-primary/5">
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
          <Filter className="h-4 w-4 text-primary" />
        </div>
        <FormDatePicker
          label="Vencimento"
          value={dueDateFilter}
          onChange={setDueDateFilter}
          required={false}
          showLabel={false}
          placeholder="Vencimento"
          containerClassName="space-y-0"
          buttonClassName="h-12 min-w-[12rem] rounded-full border-0 bg-surface px-4 py-0 ring-1 ring-primary/5 grid-cols-[minmax(0,1fr)_1rem_1rem] [&>svg:first-child]:order-3 [&>span]:order-1 [&>svg:last-child]:order-2"
        />
        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-surface px-4 text-sm font-bold text-on-surface-variant ring-1 ring-primary/5 transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-4 w-4" />
          Limpar
        </button>
      </div>
      <div className="shrink-0 whitespace-nowrap text-sm font-semibold text-on-surface-variant">
        Mostrando <span className="text-primary">{filteredRevenues.length}</span> de {revenues.length} contas
      </div>
    </div>
  );

  const renderMobileRow = (revenue: Revenue) => (
    <article className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-on-surface">{receivableLabel(revenue)}</div>
          <div className="mt-1 text-xs text-on-surface-variant">{revenue.companyName}</div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusBadgeTone(revenue.status)}`}>
          {statusLabel(revenue.status)}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Vencimento</p>
          <p className="mt-1 font-semibold text-on-surface">{formatDateOnlyPtBr(revenue.dueDate)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Valor</p>
          <p className="mt-1 font-black text-primary">{currency(Number(revenue.amount || 0))}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end border-t border-outline-variant/10 pt-3">{renderActions(revenue)}</div>
    </article>
  );

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

      <DataTable
        rows={paginatedRevenues}
        columns={columns}
        getRowKey={(revenue) => revenue.id}
        loading={loading}
        loadingLabel="Carregando contas a receber..."
        emptyLabel="Nenhuma conta a receber encontrada."
        toolbar={toolbar}
        summary={`Mostrando ${paginatedRevenues.length} resultado(s)`}
        renderMobileRow={renderMobileRow}
        pagination={{
          currentPage: safeCurrentPage,
          totalPages,
          onPreviousPage: () => setCurrentPage((page) => Math.max(1, page - 1)),
          onNextPage: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
        }}
      />
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

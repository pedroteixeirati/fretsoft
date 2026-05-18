import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CalendarDays, Check, ChevronDown, Download, FileText, ReceiptText, RefreshCcw, Users, WalletCards } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import CustomSelect from '../../../components/CustomSelect';
import KpiCard from '../../../components/KpiCard';
import DataTable, { DataTableColumn } from '../../../shared/ui/DataTable';
import FormDatePicker from '../../../shared/forms/FormDatePicker';
import { formatDateOnlyPtBr } from '../../../lib/date';
import { useFirebase } from '../../../context/FirebaseContext';
import { canAccessNovalogOperations } from '../utils/novalog.visibility';
import { queryKeys } from '../../../shared/lib/query-keys';
import { novalogApi } from '../services/novalog.api';
import { revenuesApi } from '../../revenues/services/revenues.api';
import { useNovalogBillingsQuery } from '../hooks/useNovalogBillingsQuery';
import { useNovalogReportPaymentsQuery } from '../hooks/useNovalogReportsQuery';
import { getNovalogLiveQueryOptions } from '../hooks/novalogLiveQueryOptions';
import { novalogReportsApi } from '../services/novalog-reports.api';
import { formatNovalogCurrency } from '../utils/novalog.calculations';
import type { Revenue } from '../../revenues/types/revenue.types';
import type { NovalogReportPayment } from '../types/novalog-report.types';

type ActiveTab = 'balance' | 'receipts' | 'operations';

type ClientBalanceRow = {
  id: string;
  companyName: string;
  billedAmount: number;
  receivedAmount: number;
  balanceAmount: number;
  overdueAmount: number;
  cteCount: number;
};

type RecentPaymentRow = NovalogReportPayment;

function getCurrentReferenceMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatReferenceMonthLabel(value: string) {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

function getReferenceMonthRange(value: string) {
  const [year, month] = value.split('-').map(Number);
  const start = new Date(year, (month || 1) - 1, 1);
  const end = new Date(year, month || 1, 0);
  return {
    start: start.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }),
    end: end.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }),
  };
}

function withinRange(value: string | undefined, start: string, end: string) {
  if (!value) return false;
  return (!start || value >= start) && (!end || value <= end);
}

function matchesStatus(revenue: Revenue, status: string) {
  return status === 'all' || revenue.status === status;
}

function getActiveTabLabel(tab: ActiveTab) {
  const labels: Record<ActiveTab, string> = {
    balance: 'Saldo a receber por cliente',
    receipts: 'Recebimentos',
    operations: 'Operacao',
  };
  return labels[tab];
}

function makeClientBalanceRows(revenues: Revenue[]) {
  const grouped = new Map<string, ClientBalanceRow>();

  revenues.forEach((revenue) => {
    const key = revenue.companyId || revenue.companyName;
    const current = grouped.get(key) ?? {
      id: key,
      companyName: revenue.companyName || 'Cliente nao informado',
      billedAmount: 0,
      receivedAmount: 0,
      balanceAmount: 0,
      overdueAmount: 0,
      cteCount: 0,
    };

    current.billedAmount += Number(revenue.amount || 0);
    current.receivedAmount += Number(revenue.receivedAmount || 0);
    current.balanceAmount += Number(revenue.balanceAmount || 0);
    if (revenue.status === 'overdue') current.overdueAmount += Number(revenue.balanceAmount || 0);
    current.cteCount += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.values()).sort((left, right) => right.balanceAmount - left.balanceAmount || left.companyName.localeCompare(right.companyName, 'pt-BR'));
}

export default function NovalogReportsPage() {
  const itemsPerPage = 10;
  const { userProfile } = useFirebase();
  const canAccessNovalogModule = canAccessNovalogOperations(userProfile);
  const [activeTab, setActiveTab] = useState<ActiveTab>('balance');
  const [referenceMonth, setReferenceMonth] = useState(getCurrentReferenceMonth);
  const [knownReferenceMonths, setKnownReferenceMonths] = useState<string[]>(() => [getCurrentReferenceMonth()]);
  const initialRange = getReferenceMonthRange(referenceMonth);
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [companyFilter, setCompanyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [balanceCurrentPage, setBalanceCurrentPage] = useState(1);
  const [receiptsCurrentPage, setReceiptsCurrentPage] = useState(1);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const referenceMonthsQuery = useQuery({
    queryKey: queryKeys.novalog.referenceMonths(),
    queryFn: novalogApi.listReferenceMonths,
    enabled: canAccessNovalogModule,
    ...getNovalogLiveQueryOptions(canAccessNovalogModule),
  });
  const canLoadReferenceMonthData = canAccessNovalogModule && Boolean(referenceMonth);
  const entriesQuery = useQuery({
    queryKey: queryKeys.novalog.list({ referenceMonth }),
    queryFn: () => novalogApi.list({ referenceMonth }),
    enabled: canLoadReferenceMonthData,
    ...getNovalogLiveQueryOptions(canLoadReferenceMonthData),
  });
  const revenuesQuery = useQuery({
    queryKey: ['revenues', 'novalogReports'],
    queryFn: revenuesApi.list,
    enabled: canAccessNovalogModule,
    ...getNovalogLiveQueryOptions(canAccessNovalogModule),
  });
  const { billings } = useNovalogBillingsQuery(canAccessNovalogModule);
  const { payments, isLoading: isLoadingPayments } = useNovalogReportPaymentsQuery(canAccessNovalogModule);

  useEffect(() => {
    const nextRange = getReferenceMonthRange(referenceMonth);
    setStartDate(nextRange.start);
    setEndDate(nextRange.end);
    setKnownReferenceMonths((current) => Array.from(new Set([referenceMonth, ...current])));
  }, [referenceMonth]);

  const referenceMonthOptions = useMemo(() => {
    const months = new Set<string>(knownReferenceMonths);
    (referenceMonthsQuery.data ?? []).forEach((month) => months.add(month));
    months.add(referenceMonth);
    return Array.from(months)
      .filter(Boolean)
      .sort((left, right) => right.localeCompare(left))
      .map((month) => ({ value: month, label: formatReferenceMonthLabel(month) }));
  }, [knownReferenceMonths, referenceMonth, referenceMonthsQuery.data]);

  const novalogRevenues = useMemo(
    () => (revenuesQuery.data ?? []).filter((revenue) => revenue.sourceType === 'novalog_billing_item' && revenue.status !== 'canceled'),
    [revenuesQuery.data],
  );

  const companyOptions = useMemo(() => {
    const companies = Array.from(new Set(novalogRevenues.map((revenue) => revenue.companyName).filter(Boolean))).sort((left, right) => left.localeCompare(right, 'pt-BR'));
    return [{ value: 'all', label: 'Todos os clientes' }, ...companies.map((company) => ({ value: company, label: company }))];
  }, [novalogRevenues]);

  const filteredRevenues = useMemo(
    () =>
      novalogRevenues.filter((revenue) => {
        const matchesCompany = companyFilter === 'all' || revenue.companyName === companyFilter;
        return matchesCompany && matchesStatus(revenue, statusFilter) && withinRange(revenue.dueDate, startDate, endDate);
      }),
    [companyFilter, endDate, novalogRevenues, startDate, statusFilter],
  );

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const matchesCompany = companyFilter === 'all' || payment.companyName === companyFilter;
        return matchesCompany && withinRange(payment.paymentDate, startDate, endDate);
      }),
    [companyFilter, endDate, payments, startDate],
  );

  const filteredBillings = useMemo(
    () =>
      billings.filter((billing) => {
        const matchesCompany = companyFilter === 'all' || billing.companyName === companyFilter;
        const matchesBillingStatus = statusFilter === 'all' || billing.status === statusFilter;
        return matchesCompany && matchesBillingStatus && withinRange(billing.dueDate, startDate, endDate);
      }),
    [billings, companyFilter, endDate, startDate, statusFilter],
  );

  const clientBalanceRows = useMemo(() => makeClientBalanceRows(filteredRevenues), [filteredRevenues]);
  const rankingRows = clientBalanceRows.filter((row) => row.balanceAmount > 0).slice(0, 5);
  const maximumBalance = Math.max(...rankingRows.map((row) => row.balanceAmount), 1);
  const operationEntries = entriesQuery.data ?? [];
  const balanceTotalPages = Math.max(1, Math.ceil(clientBalanceRows.length / itemsPerPage));
  const safeBalanceCurrentPage = Math.min(balanceCurrentPage, balanceTotalPages);
  const paginatedClientBalanceRows = clientBalanceRows.slice(
    (safeBalanceCurrentPage - 1) * itemsPerPage,
    safeBalanceCurrentPage * itemsPerPage,
  );
  const receiptsTotalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
  const safeReceiptsCurrentPage = Math.min(receiptsCurrentPage, receiptsTotalPages);
  const paginatedPayments = filteredPayments.slice(
    (safeReceiptsCurrentPage - 1) * itemsPerPage,
    safeReceiptsCurrentPage * itemsPerPage,
  );

  useEffect(() => {
    setBalanceCurrentPage(1);
  }, [referenceMonth, companyFilter, statusFilter, startDate, endDate, clientBalanceRows.length]);

  useEffect(() => {
    setReceiptsCurrentPage(1);
  }, [referenceMonth, companyFilter, startDate, endDate, filteredPayments.length]);

  const kpis = useMemo(() => {
    const balanceAmount = filteredRevenues.reduce((sum, revenue) => sum + Number(revenue.balanceAmount || 0), 0);
    const overdueAmount = filteredRevenues.filter((revenue) => revenue.status === 'overdue').reduce((sum, revenue) => sum + Number(revenue.balanceAmount || 0), 0);
    const clientsWithBalance = new Set(filteredRevenues.filter((revenue) => Number(revenue.balanceAmount || 0) > 0).map((revenue) => revenue.companyId || revenue.companyName)).size;
    const openCtes = filteredRevenues.filter((revenue) => Number(revenue.balanceAmount || 0) > 0).length;
    const receivedAmount = filteredPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const billedAmount = filteredBillings.reduce((sum, billing) => sum + Number(billing.totalAmount || 0), 0);
    const operationCompanyTotal = operationEntries.reduce((sum, entry) => sum + Number(entry.companyGrossAmount || 0), 0);

    return {
      balanceAmount,
      overdueAmount,
      clientsWithBalance,
      openCtes,
      receivedAmount,
      paymentCount: filteredPayments.length,
      billedAmount,
      billingCount: filteredBillings.length,
      operationCompanyTotal,
      operationCount: operationEntries.length,
    };
  }, [filteredBillings, filteredPayments, filteredRevenues, operationEntries]);

  const clientColumns: Array<DataTableColumn<ClientBalanceRow>> = [
    { id: 'client', header: 'Cliente', cell: (row) => <span className="text-sm font-semibold text-on-surface">{row.companyName}</span> },
    { id: 'billed', header: 'Total faturado', className: 'text-right', headerClassName: 'text-right', cell: (row) => <span className="whitespace-nowrap text-sm text-on-surface">{formatNovalogCurrency(row.billedAmount)}</span> },
    { id: 'received', header: 'Total recebido', className: 'text-right', headerClassName: 'text-right', cell: (row) => <span className="whitespace-nowrap text-sm text-on-surface">{formatNovalogCurrency(row.receivedAmount)}</span> },
    { id: 'balance', header: 'Saldo em aberto', className: 'text-right', headerClassName: 'text-right', cell: (row) => <span className="whitespace-nowrap text-sm font-black text-primary">{formatNovalogCurrency(row.balanceAmount)}</span> },
    { id: 'overdue', header: 'Em atraso', className: 'text-right', headerClassName: 'text-right', cell: (row) => <span className="whitespace-nowrap text-sm font-bold text-error">{formatNovalogCurrency(row.overdueAmount)}</span> },
    { id: 'ctes', header: 'CT-es', className: 'text-center', headerClassName: 'text-center', cell: (row) => <span className="text-sm font-semibold text-on-surface">{row.cteCount}</span> },
  ];

  const paymentColumns: Array<DataTableColumn<RecentPaymentRow>> = [
    { id: 'client', header: 'Cliente', cell: (payment) => <span className="text-sm font-semibold text-on-surface">{payment.companyName}</span> },
    { id: 'cte', header: 'CT-e', cell: (payment) => <span className="text-sm text-on-surface">{payment.cteNumber}</span> },
    { id: 'amount', header: 'Valor recebido', className: 'text-right', headerClassName: 'text-right', cell: (payment) => <span className="whitespace-nowrap text-sm font-black text-primary">{formatNovalogCurrency(payment.amount)}</span> },
    { id: 'paymentDate', header: 'Data do recebimento', cell: (payment) => <span className="whitespace-nowrap text-sm text-on-surface">{formatDateOnlyPtBr(payment.paymentDate)}</span> },
    { id: 'notes', header: 'Observacao', cell: (payment) => <span className="text-sm text-on-surface-variant">{payment.notes || '-'}</span> },
  ];

  const resetFilters = () => {
    setCompanyFilter('all');
    setStatusFilter('all');
    const nextRange = getReferenceMonthRange(referenceMonth);
    setStartDate(nextRange.start);
    setEndDate(nextRange.end);
  };

  const handleExport = async (type: 'tab' | 'complete') => {
    setIsExporting(true);
    setIsExportMenuOpen(false);
    try {
      const result = await novalogReportsApi.exportWorkbook({
        type,
        tab: activeTab,
        referenceMonth,
        startDate,
        endDate,
        companyName: companyFilter,
        status: statusFilter,
      });
      if (!result) return;
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  if (!canAccessNovalogModule) {
    return (
      <div className="rounded-[2rem] border border-error/15 bg-error/5 px-6 py-5 text-sm font-medium text-error">
        Este modulo esta disponivel apenas para a operacao Novalog e para usuarios de desenvolvimento.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-on-surface sm:text-[2.4rem]">Relatorios Novalog</h1>
        <p className="mt-2 text-sm leading-7 text-on-surface-variant sm:text-[15px]">
          Visoes mensais para operacao, faturamento e recebimentos da Novalog.
        </p>
      </div>

      <section className="rounded-[1.5rem] border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.35fr_1fr_auto_auto] xl:items-end">
          <FilterField label="Competencia">
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-outline-variant bg-surface px-4">
              <CalendarDays className="h-4 w-4 text-on-surface-variant" />
              <CustomSelect value={referenceMonth} onChange={setReferenceMonth} options={referenceMonthOptions} variant="inline" />
            </div>
          </FilterField>
          <FilterField label="Cliente">
            <div className="flex h-12 items-center gap-2 rounded-2xl border border-outline-variant bg-surface px-4">
              <Users className="h-4 w-4 text-on-surface-variant" />
              <CustomSelect value={companyFilter} onChange={setCompanyFilter} options={companyOptions} variant="inline" menuClassName="w-[18rem]" />
            </div>
          </FilterField>
          <FilterField label="Periodo complementar">
            <div className="flex h-12 items-center gap-1 rounded-2xl border border-outline-variant bg-surface px-3">
              <FormDatePicker label="Inicio" showLabel={false} value={startDate} onChange={setStartDate} required={false} placeholder="De" containerClassName="space-y-0" buttonClassName="h-10 min-w-[7rem] rounded-xl border-0 bg-transparent px-2 py-0" />
              <span className="text-xs font-bold text-on-surface-variant">ate</span>
              <FormDatePicker label="Fim" showLabel={false} value={endDate} onChange={setEndDate} required={false} placeholder="Ate" containerClassName="space-y-0" buttonClassName="h-10 min-w-[7rem] rounded-xl border-0 bg-transparent px-2 py-0" />
            </div>
          </FilterField>
          <FilterField label="Status">
            <div className={`flex h-12 items-center rounded-2xl border border-outline-variant px-4 ${activeTab === 'balance' ? 'bg-surface' : 'bg-surface-container-low text-on-surface-variant opacity-70'}`}>
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                disabled={activeTab !== 'balance'}
                options={[
                  { value: 'all', label: 'Todos os status' },
                  { value: 'pending', label: 'Pendente' },
                  { value: 'billed', label: 'Cobrada' },
                  { value: 'partially_received', label: 'Parcial' },
                  { value: 'received', label: 'Recebida' },
                  { value: 'overdue', label: 'Em atraso' },
                ]}
                variant="inline"
              />
            </div>
          </FilterField>
          <button type="button" onClick={resetFilters} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-outline-variant bg-surface px-4 text-sm font-bold text-on-surface transition hover:bg-surface-container-low">
            <RefreshCcw className="h-4 w-4" />
            Limpar filtros
          </button>
          <div className="relative">
            <button
              type="button"
              disabled={isExporting}
              onClick={() => setIsExportMenuOpen((current) => !current)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-on-primary shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Exportar'}
              <ChevronDown className="h-4 w-4" />
            </button>
            {isExportMenuOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface shadow-2xl">
                <button type="button" onClick={() => void handleExport('tab')} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-on-surface transition hover:bg-primary/10">
                  <Check className="h-4 w-4 text-primary" />
                  {getActiveTabLabel(activeTab)}
                </button>
                <button type="button" onClick={() => void handleExport('complete')} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-on-surface transition hover:bg-primary/10">
                  <Download className="h-4 w-4 text-primary" />
                  Relatorio completo
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-8 border-b border-outline-variant/20 px-3">
        <ReportTabButton active={activeTab === 'balance'} label="Saldo a receber por cliente" onClick={() => setActiveTab('balance')} />
        <ReportTabButton active={activeTab === 'receipts'} label="Recebimentos" onClick={() => setActiveTab('receipts')} />
        <ReportTabButton active={activeTab === 'operations'} label="Operacao" onClick={() => setActiveTab('operations')} />
      </div>

      {activeTab === 'balance' ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Saldo total a receber" value={formatNovalogCurrency(kpis.balanceAmount)} icon={WalletCards} tone="primary" />
            <KpiCard label="Clientes com saldo" value={kpis.clientsWithBalance} icon={Users} tone="neutral" />
            <KpiCard label="Em atraso" value={formatNovalogCurrency(kpis.overdueAmount)} icon={AlertTriangle} tone="danger" />
            <KpiCard label="CT-es em aberto" value={kpis.openCtes} icon={FileText} tone="tertiary" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
            <DataTable
              rows={paginatedClientBalanceRows}
              columns={clientColumns}
              getRowKey={(row) => row.id}
              emptyLabel="Nenhum saldo a receber encontrado para os filtros selecionados."
              summary={`${clientBalanceRows.length} cliente(s) no agrupamento`}
              pagination={{
                currentPage: safeBalanceCurrentPage,
                totalPages: balanceTotalPages,
                onPreviousPage: () => setBalanceCurrentPage((page) => Math.max(1, page - 1)),
                onNextPage: () => setBalanceCurrentPage((page) => Math.min(balanceTotalPages, page + 1)),
              }}
            />
            <section className="rounded-[1.5rem] border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
              <h2 className="text-lg font-black text-on-surface">Concentracao do saldo a receber</h2>
              <div className="mt-5 space-y-4">
                {rankingRows.length === 0 ? <p className="text-sm text-on-surface-variant">Sem saldo em aberto no periodo selecionado.</p> : rankingRows.map((row, index) => (
                  <div key={row.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-on-surface">{index + 1}. {row.companyName}</span>
                      <span className="font-semibold text-on-surface">{formatNovalogCurrency(row.balanceAmount)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max((row.balanceAmount / maximumBalance) * 100, 8)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <DataTable
            rows={filteredPayments.slice(0, 8)}
            columns={paymentColumns}
            getRowKey={(payment) => payment.id}
            loading={isLoadingPayments}
            loadingLabel="Carregando pagamentos Novalog..."
            emptyLabel="Nenhum pagamento efetivo encontrado no periodo selecionado."
            summary={`${Math.min(filteredPayments.length, 8)} de ${filteredPayments.length} pagamento(s) exibido(s)`}
          />
        </>
      ) : null}

      {activeTab === 'receipts' ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Recebido no periodo" value={formatNovalogCurrency(kpis.receivedAmount)} icon={WalletCards} tone="success" />
            <KpiCard label="Pagamentos registrados" value={kpis.paymentCount} icon={ReceiptText} tone="neutral" />
            <KpiCard label="Faturado no periodo" value={formatNovalogCurrency(kpis.billedAmount)} icon={FileText} tone="primary" />
            <KpiCard label="Faturamentos considerados" value={kpis.billingCount} icon={BarChart3} tone="tertiary" />
          </div>
          <DataTable
            rows={paginatedPayments}
            columns={paymentColumns}
            getRowKey={(payment) => payment.id}
            loading={isLoadingPayments}
            loadingLabel="Carregando pagamentos Novalog..."
            emptyLabel="Nenhum pagamento efetivo encontrado no periodo selecionado."
            summary={`${filteredPayments.length} pagamento(s) encontrado(s)`}
            pagination={{
              currentPage: safeReceiptsCurrentPage,
              totalPages: receiptsTotalPages,
              onPreviousPage: () => setReceiptsCurrentPage((page) => Math.max(1, page - 1)),
              onNextPage: () => setReceiptsCurrentPage((page) => Math.min(receiptsTotalPages, page + 1)),
            }}
          />
        </>
      ) : null}

      {activeTab === 'operations' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <KpiCard label="Lancamentos na competencia" value={kpis.operationCount} icon={ReceiptText} tone="neutral" />
          <KpiCard label="Total empresa" value={formatNovalogCurrency(kpis.operationCompanyTotal)} icon={WalletCards} tone="primary" />
          <KpiCard label="Competencia analisada" value={formatReferenceMonthLabel(referenceMonth)} icon={CalendarDays} tone="tertiary" />
        </div>
      ) : null}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}

function ReportTabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative pb-4 text-sm font-black transition ${active ? 'text-primary' : 'text-on-surface'}`}
    >
      {label}
      {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" /> : null}
    </button>
  );
}

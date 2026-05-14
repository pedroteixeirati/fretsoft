import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, FileText, Filter, PackagePlus, Pickaxe, Search, WalletCards } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CustomSelect from '../../../components/CustomSelect';
import KpiCard from '../../../components/KpiCard';
import { useFirebase } from '../../../context/FirebaseContext';
import { canAccess } from '../../../lib/permissions';
import { formatDateOnlyPtBr } from '../../../lib/date';
import { ConfirmDialog } from '../../../shared/ui';
import { queryKeys } from '../../../shared/lib/query-keys';
import { companiesApi } from '../../companies/services/companies.api';
import RevenuePaymentModal from '../../revenues/components/RevenuePaymentModal';
import { revenuesApi } from '../../revenues/services/revenues.api';
import type { Revenue, RevenuePayment } from '../../revenues/types/revenue.types';
import DataTable, { type DataTableColumn } from '../../../shared/ui/DataTable';
import NovalogBillingDetailsModal from '../components/NovalogBillingDetailsModal';
import NovalogBillingFormModal from '../components/NovalogBillingFormModal';
import NovalogBillingItemEditModal from '../components/NovalogBillingItemEditModal';
import { useNovalogBillingsMutations } from '../hooks/useNovalogBillingsMutations';
import { useNovalogBillingsQuery } from '../hooks/useNovalogBillingsQuery';
import { novalogBillingsApi } from '../services/novalog-billings.api';
import { NovalogBilling, NovalogBillingItem, NovalogBillingItemUpdatePayload, NovalogBillingPayload } from '../types/novalog-billing.types';
import { formatNovalogCurrency } from '../utils/novalog.calculations';
import { novalogBillingStatusClass, novalogBillingStatusLabel } from '../utils/novalog-billing-status';
import { canAccessNovalogOperations } from '../utils/novalog.visibility';

const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'open', label: 'Aberto' },
  { value: 'partially_received', label: 'Parcial' },
  { value: 'received', label: 'Recebido' },
  { value: 'overdue', label: 'Em atraso' },
  { value: 'canceled', label: 'Cancelado' },
];

const itemsPerPage = 10;

interface PendingCloseSubmission {
  payload: NovalogBillingPayload;
  billingId: string | null;
}

export default function NovalogBillingsPage() {
  const queryClient = useQueryClient();
  const { userProfile } = useFirebase();
  const canAccessNovalogModule = canAccessNovalogOperations(userProfile);
  const canReadCompanies = canAccessNovalogModule && canAccess(userProfile, 'companies', 'read');
  const { billings, isLoading, error } = useNovalogBillingsQuery(canAccessNovalogModule);
  const companiesQuery = useQuery({
    queryKey: queryKeys.companies.list(),
    queryFn: companiesApi.list,
    enabled: canReadCompanies,
  });
  const {
    createBilling,
    updateBilling,
    updateItem,
    deleteItem,
    closeBilling,
    markItemReceived,
    markItemOverdue,
    isSubmitting,
  } = useNovalogBillingsMutations();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<NovalogBilling | null>(null);
  const [editingItem, setEditingItem] = useState<NovalogBillingItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<NovalogBillingItem | null>(null);
  const [selectedBilling, setSelectedBilling] = useState<NovalogBilling | null>(null);
  const [detailsError, setDetailsError] = useState('');
  const [paymentRevenue, setPaymentRevenue] = useState<Revenue | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }));
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [payments, setPayments] = useState<RevenuePayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [closingBilling, setClosingBilling] = useState<NovalogBilling | null>(null);
  const [pendingCloseSubmission, setPendingCloseSubmission] = useState<PendingCloseSubmission | null>(null);
  const [overdueItem, setOverdueItem] = useState<NovalogBillingItem | null>(null);

  const filteredBillings = useMemo(
    () =>
      billings.filter((billing) => {
        const haystack = [
          String(billing.displayId ?? ''),
          billing.companyName,
          billing.status,
          billing.dueDate,
        ].join(' ').toLowerCase();

        const matchesSearch = haystack.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || billing.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [billings, searchTerm, statusFilter],
  );

  const kpis = useMemo(() => {
    const total = filteredBillings.reduce((sum, billing) => sum + billing.totalAmount, 0);
    const received = filteredBillings.reduce((sum, billing) => sum + billing.receivedAmount, 0);
    const open = filteredBillings.reduce((sum, billing) => sum + billing.openAmount, 0);
    const overdue = filteredBillings.reduce((sum, billing) => sum + billing.overdueAmount, 0);
    const ctes = filteredBillings.reduce((sum, billing) => sum + billing.cteCount, 0);

    return { total, received, open, overdue, ctes };
  }, [filteredBillings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, billings.length]);

  const totalPages = Math.max(1, Math.ceil(filteredBillings.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedBillings = filteredBillings.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  useEffect(() => {
    if (!isDetailsOpen || !selectedBilling?.id) return;
    const refreshed = billings.find((billing) => billing.id === selectedBilling.id);
    if (refreshed && !selectedBilling.items) {
      setSelectedBilling((current) => (current ? { ...current, ...refreshed } : current));
    }
  }, [billings, isDetailsOpen, selectedBilling]);

  const openCreateModal = () => {
    setEditingBilling(null);
    setIsFormOpen(true);
  };

  const openDetails = async (billing: NovalogBilling) => {
    setDetailsError('');
    setSelectedBilling(billing);
    setIsDetailsOpen(true);
    try {
      setSelectedBilling(await novalogBillingsApi.get(billing.id));
    } catch {
      setDetailsError('Nao foi possivel carregar os detalhes do faturamento.');
    }
  };

  const persistBilling = async (payload: NovalogBillingPayload, billingId?: string | null) => (
    billingId
      ? updateBilling.mutateAsync({ id: billingId, payload })
      : createBilling.mutateAsync(payload)
  );

  const handleSubmit = async (payload: NovalogBillingPayload, action: 'draft' | 'close') => {
    if (action === 'close') {
      setPendingCloseSubmission({
        payload,
        billingId: editingBilling?.id ?? null,
      });
      return;
    }

    await persistBilling(payload, editingBilling?.id);
    setIsFormOpen(false);
    setEditingBilling(null);
  };

  const handleEdit = (billing: NovalogBilling) => {
    setIsDetailsOpen(false);
    setEditingBilling(billing);
    setIsFormOpen(true);
  };

  const refreshSelectedBilling = async (billingId: string) => {
    setSelectedBilling(await novalogBillingsApi.get(billingId));
  };

  const handleCloseBilling = async (billing: NovalogBilling) => {
    const closed = await closeBilling.mutateAsync(billing.id);
    setSelectedBilling(closed);
    setClosingBilling(null);
  };

  const handleReceiveItem = async (itemId: string) => {
    const billing = await markItemReceived.mutateAsync(itemId);
    await refreshSelectedBilling(billing.id);
  };

  const handleOverdueItem = async (itemId: string) => {
    const billing = await markItemOverdue.mutateAsync(itemId);
    await refreshSelectedBilling(billing.id);
    setOverdueItem(null);
  };

  const handleRequestOverdueItem = (itemId: string) => {
    const item = selectedBilling?.items?.find((current) => current.id === itemId);
    if (!item) return;
    setOverdueItem(item);
  };

  const handleConfirmCloseSubmission = async () => {
    if (!pendingCloseSubmission) return;
    const savedBilling = await persistBilling(pendingCloseSubmission.payload, pendingCloseSubmission.billingId);
    if (savedBilling?.id) {
      await closeBilling.mutateAsync(savedBilling.id);
    }
    setPendingCloseSubmission(null);
    setIsFormOpen(false);
    setEditingBilling(null);
    setSelectedBilling(null);
    setIsDetailsOpen(false);
  };

  useEffect(() => {
    if (!paymentRevenue) return undefined;

    let isMounted = true;
    setLoadingPayments(true);
    void revenuesApi.listPayments(paymentRevenue.id)
      .then((result) => {
        if (isMounted) setPayments(result);
      })
      .catch(() => {
        if (isMounted) setPayments([]);
      })
      .finally(() => {
        if (isMounted) setLoadingPayments(false);
      });

    return () => {
      isMounted = false;
    };
  }, [paymentRevenue]);

  const openRevenuePayment = async (item: NovalogBillingItem) => {
    if (!item.linkedRevenueId) {
      setDetailsError('Recebivel vinculado a este CT-e ainda nao foi gerado.');
      return;
    }

    setDetailsError('');
    setLoadingPayments(true);
    try {
      const tenantRevenues = await revenuesApi.list();
      const revenue = tenantRevenues.find((current) => current.id === item.linkedRevenueId);
      if (!revenue) {
        setDetailsError('Nao foi possivel localizar o recebivel vinculado a este CT-e.');
        return;
      }
      setPaymentRevenue(revenue);
      setPaymentAmount(String(Number(revenue.balanceAmount || revenue.amount || 0).toFixed(2)).replace('.', ','));
      setPaymentDate(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }));
      setPaymentNotes('');
      setPaymentError('');
    } catch {
      setDetailsError('Nao foi possivel carregar o recebivel vinculado a este CT-e.');
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleRegisterRevenuePayment = async () => {
    if (!paymentRevenue) return;
    const normalizedAmount = Number(paymentAmount.replace(/\./g, '').replace(',', '.'));
    setPaymentError('');
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      setPaymentError('Informe um valor recebido maior que zero.');
      return;
    }
    if (normalizedAmount - Number(paymentRevenue.balanceAmount || 0) > 0.009) {
      setPaymentError('O valor recebido nao pode ultrapassar o saldo em aberto.');
      return;
    }

    await revenuesApi.registerPayment(paymentRevenue.id, {
      amount: normalizedAmount,
      paymentDate,
      notes: paymentNotes,
    });

    if (selectedBilling?.id) {
      await refreshSelectedBilling(selectedBilling.id);
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.novalogBillings.all });
    await queryClient.invalidateQueries({ queryKey: ['revenues'] });
    setPaymentRevenue(null);
  };

  const handleUpdateItem = async (itemId: string, payload: NovalogBillingItemUpdatePayload) => {
    const billing = await updateItem.mutateAsync({ id: itemId, payload });
    setEditingItem(null);
    setSelectedBilling(billing);
  };

  const handleConfirmDeleteItem = async () => {
    if (!deletingItem) return;
    setDetailsError('');
    try {
      const billing = await deleteItem.mutateAsync(deletingItem.id);
      setDeletingItem(null);
      setSelectedBilling(billing);
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: string }).code || '') : '';
      const message = error instanceof Error && error.message
        ? error.message
        : 'Nao foi possivel excluir este CT-e.';
      setDetailsError(code === 'novalog_billing_requires_item' || message.includes('Faturamento deve manter ao menos um CT-e')
        ? 'O faturamento deve manter ao menos um CT-e. Para remover este CT-e, cancele ou exclua o faturamento inteiro.'
        : message);
    }
  };

  const billingColumns: Array<DataTableColumn<NovalogBilling>> = [
    {
      id: 'billing',
      header: 'Faturamento',
      cell: (billing) => (
        <span className="text-sm font-black text-on-surface">{billing.displayId ? `#${billing.displayId}` : '-'}</span>
      ),
    },
    {
      id: 'client',
      header: 'Cliente',
      cell: (billing) => <span className="text-sm text-on-surface">{billing.companyName}</span>,
    },
    {
      id: 'dueDate',
      header: 'Vencimento',
      cell: (billing) => <span className="text-sm text-on-surface-variant">{formatDateOnlyPtBr(billing.dueDate)}</span>,
    },
    {
      id: 'ctes',
      header: 'CT-es',
      headerClassName: 'text-center',
      className: 'text-center',
      cell: (billing) => <span className="text-sm font-bold text-on-surface">{billing.cteCount}</span>,
    },
    {
      id: 'total',
      header: 'Total',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (billing) => <span className="text-sm font-black text-primary">{formatNovalogCurrency(billing.totalAmount)}</span>,
    },
    {
      id: 'received',
      header: 'Recebido',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (billing) => <span className="text-sm font-bold text-on-surface">{formatNovalogCurrency(billing.receivedAmount)}</span>,
    },
    {
      id: 'open',
      header: 'Aberto',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (billing) => <span className="text-sm font-bold text-on-surface">{formatNovalogCurrency(billing.openAmount + billing.overdueAmount)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      headerClassName: 'text-center',
      className: 'text-center',
      cell: (billing) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${novalogBillingStatusClass(billing.status)}`}>
          {novalogBillingStatusLabel(billing.status)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Acoes',
      headerClassName: 'text-center',
      className: 'text-center',
      cell: (billing) => (
        <div className="flex justify-center">
          <button type="button" onClick={() => openDetails(billing)} className="rounded-full border border-outline-variant bg-surface px-4 py-2 text-xs font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5">
            Ver detalhes
          </button>
        </div>
      ),
    },
  ];

  if (!canAccessNovalogModule) {
    return (
      <div className="rounded-[2rem] border border-error/15 bg-error/5 px-6 py-5 text-sm font-medium text-error">
        Este modulo esta disponivel apenas para a operacao Novalog e para usuarios de desenvolvimento.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-primary">
            <Pickaxe className="h-3.5 w-3.5" />
            Novalog
          </span>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-on-surface sm:text-[2.45rem]">
              Faturamentos Novalog
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-on-surface-variant sm:text-[15px]">
              Monte faturamentos com CT-es emitidos no Bsoft e acompanhe recebimento individual por documento.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:scale-[1.01] active:scale-95"
        >
          <PackagePlus className="h-4 w-4" />
          Novo faturamento
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total faturado" value={formatNovalogCurrency(kpis.total)} icon={WalletCards} tone="primary" />
        <KpiCard label="Recebido" value={formatNovalogCurrency(kpis.received)} icon={CheckCircle2} tone="success" />
        <KpiCard label="Em aberto" value={formatNovalogCurrency(kpis.open)} icon={FileText} tone="tertiary" />
        <KpiCard label="Em atraso" value={formatNovalogCurrency(kpis.overdue)} icon={AlertTriangle} tone="danger" />
        <KpiCard label="CT-es" value={kpis.ctes} icon={FileSpreadsheet} tone="neutral" />
      </div>

      <section className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar faturamento..."
                className="min-w-[260px] rounded-full bg-surface py-3 pl-11 pr-4 text-sm font-medium text-on-surface outline-none ring-1 ring-primary/5 transition focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 ring-1 ring-primary/5">
              <CustomSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} variant="inline" />
              <Filter className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-sm font-semibold text-on-surface-variant">
            Mostrando <span className="text-primary">{filteredBillings.length}</span> de {billings.length} faturamentos
          </p>
        </div>

        {error || detailsError ? (
          <div className="mt-5 rounded-[1.4rem] border border-error/15 bg-error/5 px-5 py-4 text-sm font-medium text-error">
            {detailsError || 'Nao foi possivel carregar os faturamentos Novalog agora.'}
          </div>
        ) : null}

        <DataTable
          className="mt-5 rounded-[1.8rem]"
          rows={paginatedBillings}
          columns={billingColumns}
          getRowKey={(billing) => billing.id}
          loading={isLoading}
          loadingLabel="Carregando faturamentos..."
          emptyLabel="Nenhum faturamento Novalog encontrado."
          summary={`Mostrando ${paginatedBillings.length} resultado(s)`}
          pagination={{
            currentPage: safeCurrentPage,
            totalPages,
            onPreviousPage: () => setCurrentPage((page) => Math.max(1, page - 1)),
            onNextPage: () => setCurrentPage((page) => Math.min(totalPages, page + 1)),
          }}
        />
      </section>

      <NovalogBillingFormModal
        isOpen={isFormOpen}
        companies={companiesQuery.data ?? []}
        draftBilling={editingBilling}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBilling(null);
        }}
        onSubmit={handleSubmit}
      />

      <NovalogBillingDetailsModal
        isOpen={isDetailsOpen}
        billing={selectedBilling}
        isSubmitting={isSubmitting}
        onClose={() => setIsDetailsOpen(false)}
        onCloseBilling={setClosingBilling}
        onEdit={handleEdit}
        onReceiveItem={handleReceiveItem}
        onOverdueItem={handleRequestOverdueItem}
        onEditItem={setEditingItem}
        onDeleteItem={setDeletingItem}
        onOpenRevenue={openRevenuePayment}
      />

      <RevenuePaymentModal
        revenue={paymentRevenue}
        title={paymentRevenue ? `Recebimento ${paymentRevenue.description}` : 'Recebimento'}
        amount={paymentAmount}
        paymentDate={paymentDate}
        notes={paymentNotes}
        error={paymentError}
        payments={payments}
        loadingPayments={loadingPayments}
        isSubmitting={false}
        onAmountChange={setPaymentAmount}
        onPaymentDateChange={setPaymentDate}
        onNotesChange={setPaymentNotes}
        onClose={() => setPaymentRevenue(null)}
        onSubmit={handleRegisterRevenuePayment}
      />

      <NovalogBillingItemEditModal
        isOpen={Boolean(editingItem)}
        item={editingItem}
        isSubmitting={isSubmitting}
        onClose={() => setEditingItem(null)}
        onSubmit={handleUpdateItem}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        title="Excluir CT-e"
        description={(
          <>
            Deseja excluir o CT-e <strong className="font-bold text-on-surface">{deletingItem?.cteNumber}</strong>? Esta acao remove o CT-e do faturamento e cancela o recebivel vinculado, se ele ainda nao tiver pagamentos.
          </>
        )}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        tone="danger"
        isLoading={deleteItem.isPending}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDeleteItem}
      />

      <ConfirmDialog
        isOpen={Boolean(closingBilling)}
        title="Fechar faturamento?"
        description="Esta acao gera os recebiveis dos CT-es em Contas a receber e transforma o faturamento em aberto para acompanhamento financeiro."
        confirmLabel="Fechar e gerar"
        cancelLabel="Cancelar"
        tone="warning"
        isLoading={closeBilling.isPending}
        onClose={() => setClosingBilling(null)}
        onConfirm={() => {
          if (closingBilling) void handleCloseBilling(closingBilling);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(pendingCloseSubmission)}
        title="Salvar e gerar recebiveis?"
        description="O faturamento sera salvo e os recebiveis dos CT-es serao criados em Contas a receber. Revise cliente, valores e vencimentos antes de confirmar."
        confirmLabel="Salvar e gerar"
        cancelLabel="Voltar para edicao"
        tone="warning"
        isLoading={createBilling.isPending || updateBilling.isPending || closeBilling.isPending}
        onClose={() => setPendingCloseSubmission(null)}
        onConfirm={handleConfirmCloseSubmission}
      />

      <ConfirmDialog
        isOpen={Boolean(overdueItem)}
        title="Marcar CT-e em atraso?"
        description={(
          <>
            O CT-e <strong className="font-bold text-on-surface">{overdueItem?.cteNumber}</strong> sera marcado como em atraso e os indicadores financeiros serao recalculados.
          </>
        )}
        confirmLabel="Marcar em atraso"
        cancelLabel="Cancelar"
        tone="danger"
        isLoading={markItemOverdue.isPending}
        onClose={() => setOverdueItem(null)}
        onConfirm={() => {
          if (overdueItem) void handleOverdueItem(overdueItem.id);
        }}
      />
    </div>
  );
}

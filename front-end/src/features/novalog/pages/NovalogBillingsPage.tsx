import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, FileText, Filter, Loader2, PackagePlus, Pickaxe, Search, WalletCards } from 'lucide-react';
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

  const handleSubmit = async (payload: NovalogBillingPayload, action: 'draft' | 'close') => {
    const savedBilling = editingBilling
      ? await updateBilling.mutateAsync({ id: editingBilling.id, payload })
      : await createBilling.mutateAsync(payload);

    setIsFormOpen(false);
    setEditingBilling(null);

    if (action === 'close' && savedBilling?.id) {
      await closeBilling.mutateAsync(savedBilling.id);
      setSelectedBilling(null);
      setIsDetailsOpen(false);
    }
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
  };

  const handleReceiveItem = async (itemId: string) => {
    const billing = await markItemReceived.mutateAsync(itemId);
    await refreshSelectedBilling(billing.id);
  };

  const handleOverdueItem = async (itemId: string) => {
    const billing = await markItemOverdue.mutateAsync(itemId);
    await refreshSelectedBilling(billing.id);
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
    const billing = await deleteItem.mutateAsync(deletingItem.id);
    setDeletingItem(null);
    setSelectedBilling(billing);
  };

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

        <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Faturamento</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Cliente</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Vencimento</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-center">CT-es</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Total</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Recebido</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Aberto</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-center">Status</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-center">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium">Carregando faturamentos...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredBillings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center text-sm text-on-surface-variant">
                      Nenhum faturamento Novalog encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredBillings.map((billing) => (
                    <tr key={billing.id} className="transition hover:bg-primary-fixed-dim/5">
                      <td className="px-5 py-4 text-sm font-black text-on-surface">
                        {billing.displayId ? `#${billing.displayId}` : '-'}
                      </td>
                      <td className="px-5 py-4 text-sm text-on-surface">{billing.companyName}</td>
                      <td className="px-5 py-4 text-sm text-on-surface-variant">{formatDateOnlyPtBr(billing.dueDate)}</td>
                      <td className="px-5 py-4 text-center text-sm font-bold text-on-surface">{billing.cteCount}</td>
                      <td className="px-5 py-4 text-right text-sm font-black text-primary">{formatNovalogCurrency(billing.totalAmount)}</td>
                      <td className="px-5 py-4 text-right text-sm font-bold text-on-surface">{formatNovalogCurrency(billing.receivedAmount)}</td>
                      <td className="px-5 py-4 text-right text-sm font-bold text-on-surface">{formatNovalogCurrency(billing.openAmount + billing.overdueAmount)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${novalogBillingStatusClass(billing.status)}`}>
                          {novalogBillingStatusLabel(billing.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <button type="button" onClick={() => openDetails(billing)} className="rounded-full border border-outline-variant bg-surface px-4 py-2 text-xs font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5">
                            Ver detalhes
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
        onCloseBilling={handleCloseBilling}
        onEdit={handleEdit}
        onReceiveItem={handleReceiveItem}
        onOverdueItem={handleOverdueItem}
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
            Deseja excluir o CT-e <strong className="font-bold text-on-surface">{deletingItem?.cteNumber}</strong>? O recebivel vinculado sera cancelado se ainda nao estiver recebido.
          </>
        )}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        tone="danger"
        isLoading={deleteItem.isPending}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDeleteItem}
      />
    </div>
  );
}

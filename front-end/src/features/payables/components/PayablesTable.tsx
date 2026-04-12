import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Payable } from '../types/payable.types';
import { formatDateOnlyPtBr } from '../../../lib/date';

interface PayablesTableProps {
  payables: Payable[];
  loading: boolean;
  processingId: string | null;
  currentPage: number;
  totalPages: number;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (payable: Payable) => void;
  onDelete: (id: string) => void;
  onPay: (id: string) => void;
  onMarkOverdue: (id: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
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

function currency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export default function PayablesTable({
  payables,
  loading,
  processingId,
  currentPage,
  totalPages,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onPay,
  onMarkOverdue,
  onPreviousPage,
  onNextPage,
}: PayablesTableProps) {
  const pagination = (
    <div className="flex gap-2">
      <button
        type="button"
        aria-label="Pagina anterior"
        onClick={onPreviousPage}
        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container disabled:opacity-30"
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={`Pagina ${currentPage}`}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary"
      >
        {currentPage}
      </button>
      <button
        type="button"
        aria-label="Proxima pagina"
        onClick={onNextPage}
        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container disabled:opacity-30"
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  if (loading) {
    return (
      <>
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest px-6 py-10 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-medium text-on-surface-variant">Carregando contas a pagar...</p>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-[24px] border border-outline-variant/10 bg-surface-container-low/30 px-4 py-4 sm:px-6">
          <p className="text-xs text-on-surface-variant">Mostrando {payables.length} resultado(s)</p>
          {pagination}
        </div>
      </>
    );
  }

  if (payables.length === 0) {
    return (
      <>
        <div className="flex min-h-[240px] items-center justify-center rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest px-6 py-10 text-center text-on-surface-variant">
          Nenhuma conta a pagar encontrada.
        </div>
        <div className="mt-4 flex items-center justify-between rounded-[24px] border border-outline-variant/10 bg-surface-container-low/30 px-4 py-4 sm:px-6">
          <p className="text-xs text-on-surface-variant">Mostrando {payables.length} resultado(s)</p>
          {pagination}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {payables.map((payable) => {
          const canPay = payable.status === 'open' || payable.status === 'overdue';
          const canMarkOverdue = payable.status === 'open';

          return (
            <article key={payable.id} className="rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-on-surface">{formatDateOnlyPtBr(payable.dueDate)}</div>
                  <div className="text-xs text-on-surface-variant">
                    {payable.paidAt ? `Pago em ${formatDateOnlyPtBr(payable.paidAt)}` : 'Aguardando baixa'}
                  </div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeTone(payable.status)}`}>
                  {statusLabel(payable.status)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Conta</p>
                  <p className="mt-1 font-medium text-on-surface">{payable.description}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{payable.providerName || 'Sem fornecedor informado'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Origem</p>
                    <span className="mt-1 inline-flex rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-medium text-on-secondary-container">
                      {payable.sourceType === 'expense' ? 'Custo operacional' : 'Manual'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Veiculo</p>
                    <p className="mt-1 text-on-surface">{payable.vehicleName || 'Nao vinculado'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Valor</p>
                  <p className="mt-1 text-sm font-bold text-primary">{currency(Number(payable.amount || 0))}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-outline-variant/10 pt-4">
                {canPay ? (
                  <button
                    type="button"
                    onClick={() => onPay(payable.id)}
                    disabled={processingId === payable.id}
                    className="rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-on-primary disabled:opacity-50"
                  >
                    Pagar
                  </button>
                ) : null}
                {canMarkOverdue ? (
                  <button
                    type="button"
                    onClick={() => onMarkOverdue(payable.id)}
                    disabled={processingId === payable.id}
                    className="rounded-full bg-error/10 px-3 py-2 text-[11px] font-bold text-error disabled:opacity-50"
                  >
                    Em atraso
                  </button>
                ) : null}
                {canUpdate ? (
                  <button
                    type="button"
                    onClick={() => onEdit(payable)}
                    className="rounded-full bg-surface-container px-3 py-2 text-[11px] font-bold text-on-surface"
                  >
                    Editar
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => onDelete(payable.id)}
                    className="rounded-full bg-surface-container px-3 py-2 text-[11px] font-bold text-error"
                  >
                    Excluir
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
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
            {payables.map((payable) => {
              const canPay = payable.status === 'open' || payable.status === 'overdue';
              const canMarkOverdue = payable.status === 'open';

              return (
                <tr key={payable.id} className="transition-colors hover:bg-primary-fixed-dim/5">
                  <td className="px-6 py-5">
                    <div className="text-sm font-semibold text-on-surface">
                      {formatDateOnlyPtBr(payable.dueDate)}
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      {payable.paidAt
                        ? `Pago em ${formatDateOnlyPtBr(payable.paidAt)}`
                        : 'Aguardando baixa'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-medium text-on-surface">{payable.description}</div>
                    <div className="text-xs text-on-surface-variant">
                      {payable.providerName || 'Sem fornecedor informado'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-medium text-on-secondary-container">
                      {payable.sourceType === 'expense' ? 'Custo operacional' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-on-surface">{payable.vehicleName || 'Nao vinculado'}</td>
                  <td className="px-6 py-5 text-right text-sm font-bold text-primary">
                    {currency(Number(payable.amount || 0))}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeTone(payable.status)}`}>
                      {statusLabel(payable.status)}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex min-w-[320px] items-center justify-center gap-1 whitespace-nowrap">
                      {canPay ? (
                        <button
                          type="button"
                          onClick={() => onPay(payable.id)}
                          disabled={processingId === payable.id}
                          className="rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-on-primary disabled:opacity-50"
                        >
                          Pagar
                        </button>
                      ) : null}
                      {canMarkOverdue ? (
                        <button
                          type="button"
                          onClick={() => onMarkOverdue(payable.id)}
                          disabled={processingId === payable.id}
                          className="rounded-full bg-error/10 px-3 py-2 text-[11px] font-bold text-error disabled:opacity-50"
                        >
                          Em atraso
                        </button>
                      ) : null}
                      {canUpdate ? (
                        <button
                          type="button"
                          onClick={() => onEdit(payable)}
                          className="rounded-full bg-surface-container px-3 py-2 text-[11px] font-bold text-on-surface"
                        >
                          Editar
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => onDelete(payable.id)}
                          className="rounded-full bg-surface-container px-3 py-2 text-[11px] font-bold text-error"
                        >
                          Excluir
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[24px] border border-outline-variant/10 bg-surface-container-low/30 px-4 py-4 sm:px-6">
        <p className="text-xs text-on-surface-variant">Mostrando {payables.length} resultado(s)</p>
        {pagination}
      </div>
    </>
  );
}

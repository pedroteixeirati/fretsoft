import React from 'react';
import { History } from 'lucide-react';
import Modal from '../../../components/Modal';
import FormDatePicker from '../../../shared/forms/FormDatePicker';
import { formatDateOnlyPtBr } from '../../../lib/date';
import type { Revenue, RevenuePayment } from '../types/revenue.types';

function currency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

interface RevenuePaymentModalProps {
  revenue: Revenue | null;
  title: string;
  amount: string;
  paymentDate: string;
  notes: string;
  error: string;
  payments: RevenuePayment[];
  loadingPayments: boolean;
  isSubmitting: boolean;
  onAmountChange: (value: string) => void;
  onPaymentDateChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function RevenuePaymentModal({
  revenue,
  title,
  amount,
  paymentDate,
  notes,
  error,
  payments,
  loadingPayments,
  isSubmitting,
  onAmountChange,
  onPaymentDateChange,
  onNotesChange,
  onClose,
  onSubmit,
}: RevenuePaymentModalProps) {
  if (!revenue) return null;
  const canRegisterPayment = Number(revenue.balanceAmount || 0) > 0 && revenue.status !== 'received' && revenue.status !== 'canceled';

  return (
    <Modal
      isOpen={Boolean(revenue)}
      onClose={onClose}
      title={title}
      panelClassName="max-w-[min(94vw,760px)]"
    >
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Valor</p>
            <p className="mt-2 text-lg font-black text-primary">{currency(Number(revenue.amount || 0))}</p>
          </article>
          <article className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Recebido</p>
            <p className="mt-2 text-lg font-black text-on-surface">{currency(Number(revenue.receivedAmount || 0))}</p>
          </article>
          <article className="rounded-2xl border border-tertiary/15 bg-tertiary/5 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Saldo</p>
            <p className="mt-2 text-lg font-black text-on-surface">{currency(Number(revenue.balanceAmount || 0))}</p>
          </article>
        </section>

        {canRegisterPayment ? (
          <section className="space-y-4 border-t border-outline-variant/10 pt-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
              <label className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Valor recebido</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => onAmountChange(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-outline-variant bg-surface px-4 text-sm font-semibold text-on-surface outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
              </label>
              <FormDatePicker
                label="Data do recebimento"
                value={paymentDate}
                onChange={onPaymentDateChange}
                required
                placeholder="dd/mm/aaaa"
              />
            </div>
            <label className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Observacoes</span>
              <textarea
                value={notes}
                onChange={(event) => onNotesChange(event.target.value)}
                placeholder="Opcional"
                rows={3}
                className="w-full resize-none rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </label>
            {error ? <p className="rounded-2xl border border-error/15 bg-error/10 px-4 py-3 text-sm font-semibold text-error">{error}</p> : null}
          </section>
        ) : null}

        <section className="border-t border-outline-variant/10 pt-5">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-on-surface">Historico</h3>
          </div>
          <div className="overflow-hidden rounded-2xl border border-outline-variant/10">
            {loadingPayments ? (
              <p className="px-4 py-4 text-sm text-on-surface-variant">Carregando pagamentos...</p>
            ) : payments.length > 0 ? (
              <div className="divide-y divide-outline-variant/10">
                {payments.map((payment) => (
                  <div key={payment.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[8rem_1fr_8rem] sm:items-center">
                    <span className="text-sm font-bold text-on-surface">{formatDateOnlyPtBr(payment.paymentDate)}</span>
                    <span className="text-sm text-on-surface-variant">{payment.notes || '-'}</span>
                    <span className="text-right text-sm font-black text-primary">{currency(payment.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-4 text-sm text-on-surface-variant">Nenhum pagamento registrado.</p>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-outline-variant/10 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-outline-variant bg-surface px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary/20 hover:bg-primary/5"
          >
            Fechar
          </button>
          {canRegisterPayment ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:scale-[1.01] active:scale-95 disabled:opacity-60"
            >
              Registrar recebimento
            </button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

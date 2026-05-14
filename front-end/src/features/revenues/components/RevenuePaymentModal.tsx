import React from 'react';
import { History, RotateCcw } from 'lucide-react';
import Modal from '../../../components/Modal';
import FormDatePicker from '../../../shared/forms/FormDatePicker';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import { formatDateOnlyPtBr } from '../../../lib/date';
import type { Revenue, RevenuePayment } from '../types/revenue.types';

function currency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function parseCurrencyInput(value: string) {
  return Number(value.replace(/\./g, '').replace(',', '.'));
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
  reversingPaymentId?: string | null;
  onAmountChange: (value: string) => void;
  onPaymentDateChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
  onReversePayment?: (payment: RevenuePayment, reason: string) => Promise<void> | void;
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
  reversingPaymentId,
  onAmountChange,
  onPaymentDateChange,
  onNotesChange,
  onClose,
  onSubmit,
  onReversePayment,
}: RevenuePaymentModalProps) {
  const [paymentToReverse, setPaymentToReverse] = React.useState<RevenuePayment | null>(null);
  const [isPaymentConfirmationOpen, setIsPaymentConfirmationOpen] = React.useState(false);
  const [reversalReason, setReversalReason] = React.useState('');
  const [reversalError, setReversalError] = React.useState('');

  if (!revenue) return null;
  const canRegisterPayment = Number(revenue.balanceAmount || 0) > 0 && revenue.status !== 'received' && revenue.status !== 'canceled';
  const paymentAmountValue = parseCurrencyInput(amount);
  const currentBalance = Number(revenue.balanceAmount || 0);
  const remainingBalance = Math.max(0, currentBalance - (Number.isFinite(paymentAmountValue) ? paymentAmountValue : 0));
  const canConfirmPayment =
    Number.isFinite(paymentAmountValue) &&
    paymentAmountValue > 0 &&
    paymentAmountValue - currentBalance <= 0.009 &&
    Boolean(paymentDate);

  const handleRequestReversal = (payment: RevenuePayment) => {
    setPaymentToReverse(payment);
    setReversalReason('');
    setReversalError('');
  };

  const handleConfirmReversal = async () => {
    if (!paymentToReverse || !onReversePayment) return;
    if (reversalReason.trim().length < 3) {
      setReversalError('Informe o motivo do estorno.');
      return;
    }

    try {
      await onReversePayment(paymentToReverse, reversalReason.trim());
      setPaymentToReverse(null);
      setReversalReason('');
      setReversalError('');
    } catch {
      setReversalError('Nao foi possivel estornar este pagamento agora.');
    }
  };

  const handleRequestPaymentConfirmation = () => {
    if (!canConfirmPayment) {
      void onSubmit();
      return;
    }

    setIsPaymentConfirmationOpen(true);
  };

  const handleConfirmPayment = async () => {
    await onSubmit();
    setIsPaymentConfirmationOpen(false);
  };

  return (
    <>
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
                  <div key={payment.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[8rem_1fr_8rem_7rem] sm:items-center">
                    <div>
                      <span className="text-sm font-bold text-on-surface">{formatDateOnlyPtBr(payment.paymentDate)}</span>
                      {payment.status === 'reversed' ? (
                        <span className="mt-1 inline-flex rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-error">
                          Estornado
                        </span>
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm text-on-surface-variant">{payment.notes || '-'}</span>
                      {payment.status === 'reversed' ? (
                        <span className="mt-1 block text-xs text-error">{payment.reversalReason || 'Pagamento estornado.'}</span>
                      ) : null}
                    </div>
                    <span className={payment.status === 'reversed' ? 'text-right text-sm font-black text-on-surface-variant line-through' : 'text-right text-sm font-black text-primary'}>
                      {currency(payment.amount)}
                    </span>
                    <div className="flex justify-end">
                      {payment.status === 'active' && onReversePayment ? (
                        <button
                          type="button"
                          onClick={() => handleRequestReversal(payment)}
                          disabled={Boolean(reversingPaymentId)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-error/15 px-3 py-1.5 text-[11px] font-bold text-error transition hover:bg-error/10 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Estornar
                        </button>
                      ) : null}
                    </div>
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
              onClick={handleRequestPaymentConfirmation}
              disabled={isSubmitting}
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:scale-[1.01] active:scale-95 disabled:opacity-60"
            >
              Registrar recebimento
            </button>
          ) : null}
          </div>
        </div>
      </Modal>

      {paymentToReverse ? (
        <ConfirmDialog
          isOpen={Boolean(paymentToReverse)}
          title="Estornar pagamento?"
          variant="danger"
          confirmLabel="Estornar pagamento"
          cancelLabel="Voltar"
          isLoading={reversingPaymentId === paymentToReverse.id}
          onCancel={() => {
            if (reversingPaymentId) return;
            setPaymentToReverse(null);
            setReversalReason('');
            setReversalError('');
          }}
          onConfirm={() => void handleConfirmReversal()}
          message={(
            <div className="space-y-3">
              <p>
                Esta acao remove o pagamento de {currency(paymentToReverse.amount)} dos calculos do recebivel,
                mas mantem o historico registrado.
              </p>
              <label className="block space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Motivo do estorno</span>
                <textarea
                  value={reversalReason}
                  onChange={(event) => {
                    setReversalReason(event.target.value);
                    setReversalError('');
                  }}
                  rows={3}
                  placeholder="Ex: valor informado incorretamente"
                  className="w-full resize-none rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                />
              </label>
              {reversalError ? <p className="text-sm font-semibold text-error">{reversalError}</p> : null}
            </div>
          )}
        />
      ) : null}

      {isPaymentConfirmationOpen ? (
        <ConfirmDialog
          isOpen={isPaymentConfirmationOpen}
          title="Registrar recebimento?"
          variant="warning"
          confirmLabel="Registrar recebimento"
          cancelLabel="Voltar"
          isLoading={isSubmitting}
          onCancel={() => {
            if (isSubmitting) return;
            setIsPaymentConfirmationOpen(false);
          }}
          onConfirm={() => void handleConfirmPayment()}
          message={(
            <div className="space-y-3">
              <p>
                Confirme o recebimento de <strong className="font-bold text-on-surface">{currency(paymentAmountValue)}</strong> para este recebivel.
              </p>
              <dl className="grid gap-2 rounded-2xl bg-surface-container-low px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-on-surface-variant">Data do recebimento</dt>
                  <dd className="font-bold text-on-surface">{formatDateOnlyPtBr(paymentDate)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-on-surface-variant">Saldo atual</dt>
                  <dd className="font-bold text-on-surface">{currency(currentBalance)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-on-surface-variant">Saldo apos pagamento</dt>
                  <dd className="font-black text-primary">{currency(remainingBalance)}</dd>
                </div>
              </dl>
              {notes ? <p className="text-xs text-on-surface-variant">Observacao: {notes}</p> : null}
            </div>
          )}
        />
      ) : null}
    </>
  );
}

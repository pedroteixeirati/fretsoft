import React from 'react';
import { CheckCircle2, FileText, Loader2, Wallet, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { NfeReceipt, NfeReceiptStatus, nfeNumberFromKey, nfeReceiptStatusLabels } from '../types/nfe-inbox.types';

interface NfeReceiptListProps {
  receipts: NfeReceipt[];
  loading: boolean;
  canCreatePayable: boolean;
  generatingId: string | null;
  emptyIcon: React.ElementType;
  onGeneratePayable: (receipt: NfeReceipt) => void;
  onIgnore: (receipt: NfeReceipt) => void;
}

const statusStyles: Record<NfeReceiptStatus, string> = {
  pending: 'bg-tertiary-container text-on-tertiary-container',
  validated: 'bg-secondary-container text-on-secondary-container',
  used: 'bg-primary/10 text-primary',
  ignored: 'bg-surface-container text-on-surface-variant',
  error: 'bg-error/10 text-error',
};

function formatDate(value: string) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return 'Valor nao informado';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function NfeReceiptList({
  receipts,
  loading,
  canCreatePayable,
  generatingId,
  emptyIcon: EmptyIcon,
  onGeneratePayable,
  onIgnore,
}: NfeReceiptListProps) {
  return (
    <div className="rounded-xl bg-surface-container-low p-1">
      <div className="h-full min-h-[400px] rounded-lg bg-surface-container-lowest p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-headline text-lg font-bold text-on-surface">NF-es Recebidas</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium text-on-surface-variant">Carregando NF-es...</p>
          </div>
        ) : receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-outline/40">
              <EmptyIcon className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-bold text-on-surface">Nenhuma NF-e recebida</h4>
            <p className="mt-2 max-w-sm text-on-surface-variant">
              Importe o XML da NF-e do fornecedor para gerar a conta a pagar correspondente.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {receipts.map((receipt) => {
              const number = nfeNumberFromKey(receipt.nfeKey);
              const isUsed = receipt.status === 'used';
              const isGenerating = generatingId === receipt.id;
              return (
                <div
                  key={receipt.id}
                  className="group flex flex-col gap-3 rounded-xl p-3 transition-all hover:bg-primary-fixed-dim/10 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3 sm:flex-1 sm:items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                      <FileText className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold font-headline text-on-surface">
                          {receipt.senderSnapshot?.name || 'Fornecedor'}
                        </span>
                        {number ? (
                          <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                            NF-e {number}
                          </span>
                        ) : null}
                        <span className={cn('rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider', statusStyles[receipt.status])}>
                          {nfeReceiptStatusLabels[receipt.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-on-secondary-container">
                        {formatDate(receipt.issueDate)}
                        {receipt.productSnapshot?.predominantProduct ? ` • ${receipt.productSnapshot.predominantProduct}` : ''}
                        {' • '}
                        chave {receipt.nfeKey.slice(-6)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:mr-4 sm:block sm:text-right">
                    <span className="text-sm font-bold text-on-surface">{formatCurrency(receipt.totalsSnapshot?.invoiceAmount ?? null)}</span>
                    <p className="text-[10px] uppercase text-on-secondary-container">Valor da NF-e</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 self-end sm:self-auto">
                    {isUsed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                        <CheckCircle2 className="h-4 w-4" /> Conta a pagar gerada
                      </span>
                    ) : canCreatePayable ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onGeneratePayable(receipt)}
                          disabled={isGenerating}
                          className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary transition-all hover:shadow-md disabled:opacity-50"
                        >
                          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                          Gerar conta a pagar
                        </button>
                        <button
                          type="button"
                          aria-label={`Ignorar NF-e ${number}`}
                          onClick={() => onIgnore(receipt)}
                          className="p-2 text-outline transition-colors hover:text-error"
                          title="Ignorar"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

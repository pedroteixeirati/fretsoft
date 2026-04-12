import React from 'react';
import { ChevronLeft, ChevronRight, Edit2, Loader2, Trash2 } from 'lucide-react';
import { Expense } from '../types/expense.types';
import { formatDateOnlyPtBr } from '../../../lib/date';
import { cn } from '../../../lib/utils';

interface ExpensesTableProps {
  expenses: Expense[];
  loading: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpensesTable({
  expenses,
  loading,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: ExpensesTableProps) {
  const summaryText = `Mostrando ${expenses.length} resultado(s)`;

  if (loading) {
    return (
      <>
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest px-6 py-10 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="font-medium text-on-surface-variant">Carregando custos operacionais...</p>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-[24px] border border-outline-variant/10 bg-surface-container-low/30 px-4 py-4 sm:px-6">
          <p className="text-xs text-on-surface-variant">{summaryText}</p>
        </div>
      </>
    );
  }

  if (expenses.length === 0) {
    return (
      <>
        <div className="flex min-h-[240px] items-center justify-center rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest px-6 py-10 text-center text-on-surface-variant">
          Nenhum custo operacional encontrado.
        </div>
        <div className="mt-4 flex items-center justify-between rounded-[24px] border border-outline-variant/10 bg-surface-container-low/30 px-4 py-4 sm:px-6">
          <p className="text-xs text-on-surface-variant">{summaryText}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {expenses.map((expense) => (
          <article key={expense.id} className="rounded-[24px] border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-on-surface">{formatDateOnlyPtBr(expense.date)}</div>
                <div className="text-xs text-on-surface-variant">{expense.time}</div>
              </div>
              <span className="text-sm font-bold text-primary">
                R$ {Number(expense.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Veiculo</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', expense.status === 'approved' ? 'bg-primary' : expense.status === 'review' ? 'bg-tertiary' : 'bg-error')} />
                  <span className="font-medium text-on-surface">{expense.vehicleName}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Fornecedor</p>
                <p className="mt-1 text-on-surface">{expense.provider}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Categoria</p>
                <span className="mt-1 inline-flex items-center rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-medium text-on-secondary-container">
                  {expense.category}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Odometro</p>
                <p className="mt-1 text-on-surface">{expense.odometer || '-'} km</p>
              </div>
            </div>

            {(canUpdate || canDelete) ? (
              <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-outline-variant/10 pt-4">
                {canUpdate ? (
                  <button
                    type="button"
                    aria-label={`Editar custo de ${expense.vehicleName}`}
                    onClick={() => onEdit(expense)}
                    className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-2 text-xs font-bold text-on-surface transition-colors hover:bg-primary-fixed"
                  >
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    aria-label={`Excluir custo de ${expense.vehicleName}`}
                    onClick={() => onDelete(expense.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-error/10 px-3 py-2 text-xs font-bold text-error transition-colors hover:bg-error-container"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </button>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant/10 bg-surface-container-low">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Data e Hora</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Veiculo</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Fornecedor</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Categoria</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-right">Valor</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-right">Odometro</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-center">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {expenses.map((expense) => (
              <tr key={expense.id} className="group transition-colors hover:bg-primary-fixed-dim/5">
                <td className="px-6 py-5">
                  <div className="text-sm font-semibold text-on-surface">{formatDateOnlyPtBr(expense.date)}</div>
                  <div className="text-xs text-on-surface-variant">{expense.time}</div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', expense.status === 'approved' ? 'bg-primary' : expense.status === 'review' ? 'bg-tertiary' : 'bg-error')} />
                    <span className="text-sm font-medium text-on-surface">{expense.vehicleName}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-on-surface">{expense.provider}</td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-medium text-on-secondary-container">
                    {expense.category}
                  </span>
                </td>
                <td className="px-6 py-5 text-right text-sm font-bold text-primary">
                  R$ {Number(expense.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-5 text-right text-sm">{expense.odometer || '-'} km</td>
                <td className="px-6 py-5">
                  {(canUpdate || canDelete) ? (
                    <div className="flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {canUpdate ? (
                        <button
                          type="button"
                          aria-label={`Editar custo de ${expense.vehicleName}`}
                          onClick={() => onEdit(expense)}
                          className="rounded-full p-2 text-primary transition-colors hover:bg-primary-fixed"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          aria-label={`Excluir custo de ${expense.vehicleName}`}
                          onClick={() => onDelete(expense.id)}
                          className="rounded-full p-2 text-error transition-colors hover:bg-error-container"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[24px] border border-outline-variant/10 bg-surface-container-low/30 px-4 py-4 sm:px-6">
        <p className="text-xs text-on-surface-variant">{summaryText}</p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Pagina anterior"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-container disabled:opacity-30"
            disabled
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Pagina 1" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
            1
          </button>
          <button
            type="button"
            aria-label="Proxima pagina"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-container disabled:opacity-30"
            disabled
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

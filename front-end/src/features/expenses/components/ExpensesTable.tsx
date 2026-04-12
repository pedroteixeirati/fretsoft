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
  return (
    <>
      <div className="overflow-x-auto">
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
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="font-medium text-on-surface-variant">Carregando custos operacionais...</p>
                  </div>
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-on-surface-variant">
                  Nenhum custo operacional encontrado.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-low/30 p-6">
        <p className="text-xs text-on-surface-variant">Mostrando {expenses.length} resultado(s)</p>
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

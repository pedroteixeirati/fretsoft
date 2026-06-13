import React from 'react';
import { CalendarDays, Loader2, Pencil, Repeat, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { RecurringPayable, recurringPayableStatusLabels } from '../types/recurring-payable.types';

interface RecurringPayablesListProps {
  recurringPayables: RecurringPayable[];
  loading: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (recurringPayable: RecurringPayable) => void;
  onDelete: (recurringPayable: RecurringPayable) => void;
}

function formatAmount(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPeriod(startsOn: string, endsOn: string) {
  const format = (value: string) => {
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  };

  if (startsOn && endsOn) return `${format(startsOn)} a ${format(endsOn)}`;
  if (startsOn) return `Desde ${format(startsOn)}`;
  if (endsOn) return `Ate ${format(endsOn)}`;
  return 'Sem prazo definido';
}

export default function RecurringPayablesList({
  recurringPayables,
  loading,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: RecurringPayablesListProps) {
  return (
    <div className="rounded-xl bg-surface-container-low p-1 lg:col-span-12">
      <div className="h-full min-h-[400px] rounded-lg bg-surface-container-lowest p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-headline text-lg font-bold text-on-surface">Despesas Fixas Cadastradas</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium text-on-surface-variant">Carregando despesas recorrentes...</p>
          </div>
        ) : recurringPayables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-outline/40">
              <Repeat className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-bold text-on-surface">Nenhuma despesa recorrente cadastrada</h4>
            <p className="mt-2 max-w-xs text-on-surface-variant">
              Cadastre despesas fixas como aluguel e tributos para gerar as contas a pagar de cada mes automaticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {recurringPayables.map((recurringPayable) => (
              <div
                key={recurringPayable.id}
                className="group flex flex-col gap-3 rounded-xl p-3 transition-all hover:bg-primary-fixed-dim/10 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3 sm:flex-1 sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                    <Repeat className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold font-headline text-on-surface">
                        {recurringPayable.description}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
                          recurringPayable.status === 'active'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-container text-on-surface-variant',
                        )}
                      >
                        {recurringPayableStatusLabels[recurringPayable.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-on-secondary-container">
                      {recurringPayable.providerName ? `${recurringPayable.providerName} • ` : ''}
                      <CalendarDays className="mr-1 inline h-3 w-3" />
                      Vence todo dia {recurringPayable.dueDay} • {formatPeriod(recurringPayable.startsOn, recurringPayable.endsOn)}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:mr-6 sm:block sm:text-right">
                  <span className="text-sm font-bold text-on-surface">{formatAmount(recurringPayable.amount)}</span>
                  <p className="text-[10px] uppercase text-on-secondary-container">por mes</p>
                </div>

                {canDelete || canUpdate ? (
                  <div className="flex items-center justify-end gap-2 self-end sm:self-auto">
                    {canDelete ? (
                      <button
                        type="button"
                        aria-label={`Excluir despesa recorrente ${recurringPayable.description}`}
                        onClick={() => onDelete(recurringPayable)}
                        className="p-2 text-outline transition-colors hover:text-error"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    ) : null}
                    {canUpdate ? (
                      <button
                        type="button"
                        aria-label={`Editar despesa recorrente ${recurringPayable.description}`}
                        onClick={() => onEdit(recurringPayable)}
                        className="p-2 text-outline transition-colors hover:text-on-surface"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Loader2, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { MaintenanceInspection } from '../types/maintenance-inspection.types';
import { NextDueState, getNextDueState, nextDueStateLabels } from '../utils/next-due';

interface MaintenanceInspectionsListProps {
  inspections: MaintenanceInspection[];
  loading: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (inspection: MaintenanceInspection) => void;
  onDelete: (inspection: MaintenanceInspection) => void;
}

const dueStyles: Record<NextDueState, string> = {
  overdue: 'bg-error/10 text-error',
  upcoming: 'bg-tertiary-container text-on-tertiary-container',
  ok: 'bg-primary/10 text-primary',
  none: 'bg-surface-container text-on-surface-variant',
};

function formatDate(value: string) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export default function MaintenanceInspectionsList({
  inspections,
  loading,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: MaintenanceInspectionsListProps) {
  return (
    <div className="rounded-xl bg-surface-container-low p-1 lg:col-span-12">
      <div className="h-full min-h-[400px] rounded-lg bg-surface-container-lowest p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-headline text-lg font-bold text-on-surface">Inspecoes Preventivas</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium text-on-surface-variant">Carregando inspecoes...</p>
          </div>
        ) : inspections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-outline/40">
              <ClipboardCheck className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-bold text-on-surface">Nenhuma inspecao registrada</h4>
            <p className="mt-2 max-w-sm text-on-surface-variant">
              Registre a primeira inspecao preventiva com o checklist da frota e defina o proximo vencimento.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {inspections.map((inspection) => {
              const dueState = getNextDueState(inspection.nextDueOn);
              return (
                <div
                  key={inspection.id}
                  className="group flex flex-col gap-3 rounded-xl p-3 transition-all hover:bg-primary-fixed-dim/10 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3 sm:flex-1 sm:items-center">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                        inspection.attentionCount > 0 ? 'bg-error/10 text-error' : 'bg-surface-container text-primary',
                      )}
                    >
                      {inspection.attentionCount > 0 ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold font-headline text-on-surface">
                          {inspection.vehicleName || 'Veiculo'}
                        </span>
                        <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                          {inspection.vehiclePlate || 'Sem placa'}
                        </span>
                        {inspection.nextDueOn ? (
                          <span className={cn('rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider', dueStyles[dueState])}>
                            {nextDueStateLabels[dueState]}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-on-secondary-container">
                        {formatDate(inspection.inspectedOn)}
                        {inspection.mechanicName ? ` • ${inspection.mechanicName}` : ''}
                        {' • '}
                        {inspection.okCount} OK
                        {inspection.attentionCount > 0 ? `, ${inspection.attentionCount} atencao` : ''}
                        {inspection.nextDueOn ? ` • proximo: ${formatDate(inspection.nextDueOn)}` : ''}
                      </p>
                    </div>
                  </div>

                  {canDelete || canUpdate ? (
                    <div className="flex items-center justify-end gap-2 self-end sm:self-auto">
                      {canDelete ? (
                        <button
                          type="button"
                          aria-label={`Excluir inspecao do veiculo ${inspection.vehiclePlate}`}
                          onClick={() => onDelete(inspection)}
                          className="p-2 text-outline transition-colors hover:text-error"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      ) : null}
                      {canUpdate ? (
                        <button
                          type="button"
                          aria-label={`Editar inspecao do veiculo ${inspection.vehiclePlate}`}
                          onClick={() => onEdit(inspection)}
                          className="p-2 text-outline transition-colors hover:text-on-surface"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

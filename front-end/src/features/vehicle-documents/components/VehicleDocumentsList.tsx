import React from 'react';
import { Archive, CalendarClock, Loader2, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  VehicleDocument,
  getVehicleDocumentDueState,
  vehicleDocumentDueStateLabels,
  vehicleDocumentTypeLabels,
} from '../types/vehicle-document.types';

interface VehicleDocumentsListProps {
  documents: VehicleDocument[];
  loading: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (document: VehicleDocument) => void;
  onDelete: (document: VehicleDocument) => void;
}

function formatDate(value: string) {
  if (!value) return 'N/A';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatAmount(value: number | null) {
  if (value === null || value === undefined) return '';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function DueBadge({ document }: { document: VehicleDocument }) {
  if (document.status === 'archived') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        <Archive className="h-3 w-3" />
        Arquivado
      </span>
    );
  }

  const dueState = getVehicleDocumentDueState(document.dueDate);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
        dueState === 'expired' && 'bg-error/10 text-error',
        dueState === 'expiring' && 'bg-tertiary-container text-on-tertiary-container',
        dueState === 'ok' && 'bg-primary/10 text-primary',
      )}
    >
      <CalendarClock className="h-3 w-3" />
      {vehicleDocumentDueStateLabels[dueState]}
    </span>
  );
}

export default function VehicleDocumentsList({
  documents,
  loading,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: VehicleDocumentsListProps) {
  return (
    <div className="rounded-xl bg-surface-container-low p-1 lg:col-span-12">
      <div className="h-full min-h-[400px] rounded-lg bg-surface-container-lowest p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-headline text-lg font-bold text-on-surface">Documentos e Vencimentos</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium text-on-surface-variant">Carregando documentos...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-outline/40">
              <CalendarClock className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-bold text-on-surface">Nenhum documento encontrado</h4>
            <p className="mt-2 max-w-xs text-on-surface-variant">
              Cadastre os documentos da frota para acompanhar os vencimentos em um so lugar.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="group flex flex-col gap-3 rounded-xl p-3 transition-all hover:bg-primary-fixed-dim/10 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3 sm:flex-1 sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                    <CalendarClock className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold font-headline text-on-surface">
                        {vehicleDocumentTypeLabels[document.documentType]}
                      </span>
                      <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                        {document.vehiclePlate || 'Sem placa'}
                      </span>
                      <DueBadge document={document} />
                    </div>
                    <p className="mt-1 text-xs text-on-secondary-container">
                      {document.vehicleName || 'Veiculo'}
                      {document.identifier ? ` • ${document.identifier}` : ''}
                      {document.notes ? ` • ${document.notes}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:mr-6 sm:block sm:text-right">
                  <span className="text-sm font-bold text-on-surface">{formatDate(document.dueDate)}</span>
                  <p className="text-[10px] uppercase text-on-secondary-container">
                    {document.amount !== null ? formatAmount(document.amount) : 'Vencimento'}
                  </p>
                </div>

                {canDelete || canUpdate ? (
                  <div className="flex items-center justify-end gap-2 self-end sm:self-auto">
                    {canDelete ? (
                      <button
                        type="button"
                        aria-label={`Excluir documento ${vehicleDocumentTypeLabels[document.documentType]} do veiculo ${document.vehiclePlate}`}
                        onClick={() => onDelete(document)}
                        className="p-2 text-outline transition-colors hover:text-error"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    ) : null}
                    {canUpdate ? (
                      <button
                        type="button"
                        aria-label={`Editar documento ${vehicleDocumentTypeLabels[document.documentType]} do veiculo ${document.vehiclePlate}`}
                        onClick={() => onEdit(document)}
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

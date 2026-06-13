import React from 'react';
import { Loader2, Pencil, Trash2, Wrench } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ServiceOrder, ServiceOrderStatus, serviceOrderStatusLabels } from '../types/service-order.types';

interface ServiceOrdersListProps {
  serviceOrders: ServiceOrder[];
  loading: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (serviceOrder: ServiceOrder) => void;
  onDelete: (serviceOrder: ServiceOrder) => void;
}

const statusStyles: Record<ServiceOrderStatus, string> = {
  open: 'bg-tertiary-container text-on-tertiary-container',
  in_progress: 'bg-secondary-container text-on-secondary-container',
  completed: 'bg-primary/10 text-primary',
  canceled: 'bg-surface-container text-on-surface-variant',
};

function formatDate(value: string) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ServiceOrdersList({
  serviceOrders,
  loading,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: ServiceOrdersListProps) {
  return (
    <div className="rounded-xl bg-surface-container-low p-1 lg:col-span-12">
      <div className="h-full min-h-[400px] rounded-lg bg-surface-container-lowest p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-headline text-lg font-bold text-on-surface">Ordens de Servico</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium text-on-surface-variant">Carregando ordens de servico...</p>
          </div>
        ) : serviceOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-outline/40">
              <Wrench className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-bold text-on-surface">Nenhuma ordem de servico encontrada</h4>
            <p className="mt-2 max-w-sm text-on-surface-variant">
              Registre a primeira manutencao da frota detalhando pecas, mao de obra e fornecedores.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {serviceOrders.map((serviceOrder) => {
              const partsCount = serviceOrder.items.filter((item) => item.itemType === 'part').length;
              const laborCount = serviceOrder.items.filter((item) => item.itemType === 'labor').length;

              return (
                <div
                  key={serviceOrder.id}
                  className="group flex flex-col gap-3 rounded-xl p-3 transition-all hover:bg-primary-fixed-dim/10 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3 sm:flex-1 sm:items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                      <Wrench className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold font-headline text-on-surface">{serviceOrder.description}</span>
                        <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                          {serviceOrder.vehiclePlate || 'Sem placa'}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
                            statusStyles[serviceOrder.status],
                          )}
                        >
                          {serviceOrderStatusLabels[serviceOrder.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-on-secondary-container">
                        {serviceOrder.vehicleName || 'Veiculo'} • {formatDate(serviceOrder.openedOn)}
                        {serviceOrder.providerName ? ` • ${serviceOrder.providerName}` : ''} • {partsCount} peca(s), {laborCount} mao de obra
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:mr-6 sm:block sm:text-right">
                    <span className="text-sm font-bold text-on-surface">{formatCurrency(serviceOrder.totalAmount)}</span>
                    <p className="text-[10px] uppercase text-on-secondary-container">Custo total</p>
                  </div>

                  {canDelete || canUpdate ? (
                    <div className="flex items-center justify-end gap-2 self-end sm:self-auto">
                      {canDelete ? (
                        <button
                          type="button"
                          aria-label={`Excluir ordem de servico do veiculo ${serviceOrder.vehiclePlate}`}
                          onClick={() => onDelete(serviceOrder)}
                          className="p-2 text-outline transition-colors hover:text-error"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      ) : null}
                      {canUpdate ? (
                        <button
                          type="button"
                          aria-label={`Editar ordem de servico do veiculo ${serviceOrder.vehiclePlate}`}
                          onClick={() => onEdit(serviceOrder)}
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

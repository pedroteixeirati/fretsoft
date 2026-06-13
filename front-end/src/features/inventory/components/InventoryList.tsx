import React from 'react';
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, History, Loader2, Package, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { InventoryItem } from '../types/inventory.types';

interface InventoryListProps {
  items: InventoryItem[];
  loading: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onEntry: (item: InventoryItem) => void;
  onExit: (item: InventoryItem) => void;
  onHistory: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

export default function InventoryList({
  items,
  loading,
  canUpdate,
  canDelete,
  onEntry,
  onExit,
  onHistory,
  onEdit,
  onDelete,
}: InventoryListProps) {
  return (
    <div className="rounded-xl bg-surface-container-low p-1 lg:col-span-12">
      <div className="h-full min-h-[400px] rounded-lg bg-surface-container-lowest p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-headline text-lg font-bold text-on-surface">Pecas em Estoque</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium text-on-surface-variant">Carregando almoxarifado...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-outline/40">
              <Package className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-bold text-on-surface">Nenhuma peca cadastrada</h4>
            <p className="mt-2 max-w-sm text-on-surface-variant">
              Cadastre as pecas do almoxarifado com saldo e valor para controlar entradas e saidas.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col gap-3 rounded-xl p-3 transition-all hover:bg-primary-fixed-dim/10 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3 sm:flex-1 sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                    <Package className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold font-headline text-on-surface">{item.name}</span>
                      {item.code ? (
                        <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                          {item.code}
                        </span>
                      ) : null}
                      {item.belowMinimum ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-error">
                          <AlertTriangle className="h-3 w-3" />
                          Estoque baixo
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-on-secondary-container">
                      {item.category ? `${item.category} • ` : ''}
                      {formatCurrency(item.unitCost)} / un
                      {item.minQuantity !== null ? ` • minimo ${formatNumber(item.minQuantity)}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:mr-4 sm:block sm:text-right">
                  <span className={cn('text-sm font-bold', item.belowMinimum ? 'text-error' : 'text-on-surface')}>
                    {formatNumber(item.quantity)} un
                  </span>
                  <p className="text-[10px] uppercase text-on-secondary-container">{formatCurrency(item.totalValue)} em estoque</p>
                </div>

                <div className="flex items-center justify-end gap-1 self-end sm:self-auto">
                  {canUpdate ? (
                    <>
                      <button
                        type="button"
                        aria-label={`Registrar entrada de ${item.name}`}
                        onClick={() => onEntry(item)}
                        className="p-2 text-outline transition-colors hover:text-primary"
                        title="Entrada"
                      >
                        <ArrowDownCircle className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Registrar saida de ${item.name}`}
                        onClick={() => onExit(item)}
                        className="p-2 text-outline transition-colors hover:text-tertiary"
                        title="Saida"
                      >
                        <ArrowUpCircle className="h-5 w-5" />
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Historico de ${item.name}`}
                    onClick={() => onHistory(item)}
                    className="p-2 text-outline transition-colors hover:text-on-surface"
                    title="Historico"
                  >
                    <History className="h-5 w-5" />
                  </button>
                  {canUpdate ? (
                    <button
                      type="button"
                      aria-label={`Editar ${item.name}`}
                      onClick={() => onEdit(item)}
                      className="p-2 text-outline transition-colors hover:text-on-surface"
                      title="Editar"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      aria-label={`Excluir ${item.name}`}
                      onClick={() => onDelete(item)}
                      className="p-2 text-outline transition-colors hover:text-error"
                      title="Excluir"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

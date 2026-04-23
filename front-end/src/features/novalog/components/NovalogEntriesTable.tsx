import React from 'react';
import { ChevronLeft, ChevronRight, Edit2, Layers3, Trash2 } from 'lucide-react';
import { NovalogEntry } from '../types/novalog.types';
import { formatDateOnlyPtBr } from '../../../lib/date';
import { formatNovalogCurrency } from '../utils/novalog.calculations';
import NovalogFilters from './NovalogFilters';

interface NovalogEntriesTableProps {
  entries: NovalogEntry[];
  searchTerm: string;
  originFilter: string;
  destinationFilter: string;
  filteredCount: number;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onSearchChange: (value: string) => void;
  onOriginFilterChange: (value: string) => void;
  onDestinationFilterChange: (value: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onEdit: (entry: NovalogEntry) => void;
  onDelete: (entry: NovalogEntry) => void;
}

function getIdentifier(entry: NovalogEntry) {
  return `#${entry.displayId ?? '...'}`;
}

export default function NovalogEntriesTable({
  entries,
  searchTerm,
  originFilter,
  destinationFilter,
  filteredCount,
  totalCount,
  currentPage,
  totalPages,
  onSearchChange,
  onOriginFilterChange,
  onDestinationFilterChange,
  onPreviousPage,
  onNextPage,
  onEdit,
  onDelete,
}: NovalogEntriesTableProps) {
  const summaryText = `Mostrando ${entries.length} de ${filteredCount} resultado(s)`;
  const pagination = (
    <div className="flex gap-2">
      <button
        type="button"
        aria-label="Pagina anterior"
        onClick={onPreviousPage}
        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container disabled:opacity-30"
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={`Pagina ${currentPage}`}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary"
      >
        {currentPage}
      </button>
      <button
        type="button"
        aria-label="Proxima pagina"
        onClick={onNextPage}
        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container disabled:opacity-30"
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <section className="overflow-hidden rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
      <div className="border-b border-outline-variant/10 bg-surface-container-low/50 p-5 sm:p-6">
        <NovalogFilters
          searchTerm={searchTerm}
          originFilter={originFilter}
          destinationFilter={destinationFilter}
          filteredCount={filteredCount}
          totalCount={totalCount}
          onSearchChange={onSearchChange}
          onOriginFilterChange={onOriginFilterChange}
          onDestinationFilterChange={onDestinationFilterChange}
        />
      </div>

      {entries.length === 0 ? (
        <div className="px-6 py-16 text-center text-sm text-on-surface-variant">
          Nenhum lancamento encontrado para os filtros selecionados.
        </div>
      ) : (
        <>
          <div className="space-y-4 p-4 xl:hidden">
            {entries.map((entry) => (
              <article key={entry.id} className="rounded-[2rem] border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-on-surface">{getIdentifier(entry)}</div>
                    <div className="mt-1 text-xs text-on-surface-variant">{formatDateOnlyPtBr(entry.operationDate)}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Origem</p>
                    <p className="mt-1 font-medium text-on-surface">{entry.originName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Destino</p>
                    <p className="mt-1 font-medium text-on-surface">{entry.destinationName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Peso</p>
                    <p className="mt-1 font-medium text-on-surface">{entry.weight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} t</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Total empresa</p>
                    <p className="mt-1 font-bold text-primary">{formatNovalogCurrency(entry.companyGrossAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Ticket</p>
                    <p className="mt-1 font-medium text-on-surface">{entry.ticketNumber || '-'}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-outline-variant/10 pt-4">
                  <button type="button" onClick={() => onEdit(entry)} aria-label={`Editar ${getIdentifier(entry)}`} className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-2 text-xs font-bold text-on-surface transition hover:bg-primary-fixed">
                    <Edit2 className="h-4 w-4" />
                    Editar
                  </button>
                  <button type="button" onClick={() => onDelete(entry)} aria-label={`Excluir ${getIdentifier(entry)}`} className="inline-flex items-center gap-2 rounded-full bg-error/10 px-3 py-2 text-xs font-bold text-error transition hover:bg-error-container">
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Data</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Origem</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Destino</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Peso</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Valor frete empresa</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Ganho empresa</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Valor frete terceiro</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-right">Ganho terceiro</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Ticket</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">Abastecimento</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant text-center">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {entries.map((entry) => (
                  <tr key={entry.id} className="group transition-colors hover:bg-primary-fixed-dim/5">
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-on-surface">{getIdentifier(entry)}</span>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-on-surface">{formatDateOnlyPtBr(entry.operationDate)}</td>
                    <td className="px-6 py-5 text-sm text-on-surface">{entry.originName}</td>
                    <td className="px-6 py-5 text-sm text-on-surface">{entry.destinationName}</td>
                    <td className="px-6 py-5 text-right text-sm font-medium text-on-surface">
                      {entry.weight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5 text-right text-sm text-on-surface">{formatNovalogCurrency(entry.companyRatePerTon)}</td>
                    <td className="px-6 py-5 text-right text-sm font-bold text-primary">{formatNovalogCurrency(entry.companyGrossAmount)}</td>
                    <td className="px-6 py-5 text-right text-sm text-on-surface">{formatNovalogCurrency(entry.aggregatedRatePerTon)}</td>
                    <td className="px-6 py-5 text-right text-sm font-bold text-secondary">{formatNovalogCurrency(entry.aggregatedGrossAmount)}</td>
                    <td className="px-6 py-5 text-sm text-on-surface">{entry.ticketNumber || '-'}</td>
                    <td className="px-6 py-5 text-sm text-on-surface">{entry.fuelStationName || '-'}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(entry)}
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-on-primary transition hover:scale-[1.02]"
                          aria-label={`Editar ${getIdentifier(entry)}`}
                        >
                          <Edit2 className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(entry)}
                          className="rounded-full p-2 text-error transition-colors hover:bg-error-container"
                          aria-label={`Excluir ${getIdentifier(entry)}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex items-center justify-between border-t border-outline-variant/10 bg-surface-container-low/30 px-4 py-4 sm:px-6">
        <p className="text-xs text-on-surface-variant">{summaryText}</p>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary sm:inline-flex">
            <Layers3 className="h-3.5 w-3.5" />
            Preparado para lote
          </div>
          {pagination}
        </div>
      </div>
    </section>
  );
}

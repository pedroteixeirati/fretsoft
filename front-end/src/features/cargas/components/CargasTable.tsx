import React from 'react';
import { Edit2, Package, Trash2 } from 'lucide-react';
import { Cargo } from '../types/cargo.types';

interface CargasTableProps {
  cargas: Cargo[];
  loading: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (cargo: Cargo) => void;
  onDelete: (id: string) => void;
}

function cargoStatusLabel(status: Cargo['status']) {
  switch (status) {
    case 'loading':
      return 'Carregando';
    case 'in_transit':
      return 'Em transito';
    case 'delivered':
      return 'Entregue';
    case 'cancelled':
      return 'Cancelada';
    default:
      return 'Planejada';
  }
}

function cargoStatusTone(status: Cargo['status']) {
  switch (status) {
    case 'loading':
      return 'bg-secondary-container text-on-secondary-container';
    case 'in_transit':
      return 'bg-primary-fixed text-primary';
    case 'delivered':
      return 'bg-tertiary-container text-on-tertiary-container';
    case 'cancelled':
      return 'bg-error/10 text-error';
    default:
      return 'bg-surface-container text-on-surface';
  }
}

export default function CargasTable({
  cargas,
  loading,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: CargasTableProps) {
  if (loading) {
    return (
      <div className="rounded-[28px] border border-outline-variant/30 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
        Carregando cargas...
      </div>
    );
  }

  if (cargas.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-outline-variant/60 bg-surface-container-lowest p-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-outline/60">
          <Package className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-on-surface">Nenhuma carga encontrada</h3>
        <p className="mt-2 text-sm text-on-surface-variant">
          Cadastre a primeira carga para acompanhar a operacao vinculada aos fretes.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
      <div className="space-y-4 p-4 md:hidden">
        {cargas.map((cargo) => (
          <article key={cargo.id} className="rounded-[24px] border border-outline-variant/20 bg-surface-container-low p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-on-surface">{cargo.cargoNumber || `Carga #${cargo.displayId ?? cargo.id.slice(0, 6)}`}</div>
                <div className="mt-1 text-xs text-on-surface-variant">{cargo.description}</div>
              </div>
              <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold ${cargoStatusTone(cargo.status)}`}>
                {cargoStatusLabel(cargo.status)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Cliente</p>
                <p className="mt-1 text-on-surface">{cargo.companyName || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Tipo</p>
                <p className="mt-1 text-on-surface">{cargo.cargoType}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Frete</p>
                <p className="mt-1 font-medium text-on-surface">{cargo.freightDisplayId ? `Frete #${cargo.freightDisplayId}` : 'Frete vinculado'}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{cargo.freightRoute || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Rota</p>
                <p className="mt-1 text-on-surface">{cargo.origin}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{cargo.destination}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Peso</p>
                <p className="mt-1 text-on-surface">{cargo.weight ? `${cargo.weight} kg` : '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Valor</p>
                <p className="mt-1 text-on-surface">
                  {cargo.merchandiseValue
                    ? cargo.merchandiseValue.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    : '-'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-outline-variant/10 pt-4">
              {canUpdate ? (
                <button
                  type="button"
                  aria-label={`Editar carga ${cargo.cargoNumber || cargo.description}`}
                  onClick={() => onEdit(cargo)}
                  className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-2 text-xs font-bold text-on-surface transition hover:bg-primary-fixed"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  aria-label={`Excluir carga ${cargo.cargoNumber || cargo.description}`}
                  onClick={() => onDelete(cargo.id)}
                  className="inline-flex items-center gap-2 rounded-full bg-error/10 px-3 py-2 text-xs font-bold text-error transition hover:bg-error-container"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-outline-variant/20">
          <thead className="bg-surface-container-low">
            <tr className="text-left text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              <th className="px-5 py-4">Carga</th>
              <th className="px-5 py-4">Cliente</th>
              <th className="px-5 py-4">Frete</th>
              <th className="px-5 py-4">Tipo</th>
              <th className="px-5 py-4">Origem / Destino</th>
              <th className="px-5 py-4">Peso</th>
              <th className="px-5 py-4">Valor</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {cargas.map((cargo) => (
              <tr key={cargo.id} className="align-top text-sm text-on-surface">
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <div className="font-bold">{cargo.cargoNumber || `Carga #${cargo.displayId ?? cargo.id.slice(0, 6)}`}</div>
                    <div className="text-xs text-on-surface-variant">{cargo.description}</div>
                  </div>
                </td>
                <td className="px-5 py-4">{cargo.companyName || '-'}</td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <div className="font-semibold">{cargo.freightDisplayId ? `Frete #${cargo.freightDisplayId}` : 'Frete vinculado'}</div>
                    <div className="text-xs text-on-surface-variant">{cargo.freightRoute || '-'}</div>
                  </div>
                </td>
                <td className="px-5 py-4">{cargo.cargoType}</td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <div>{cargo.origin}</div>
                    <div className="text-xs text-on-surface-variant">{cargo.destination}</div>
                  </div>
                </td>
                <td className="px-5 py-4">{cargo.weight ? `${cargo.weight} kg` : '-'}</td>
                <td className="px-5 py-4">
                  {cargo.merchandiseValue
                    ? cargo.merchandiseValue.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    : '-'}
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${cargoStatusTone(cargo.status)}`}>
                    {cargoStatusLabel(cargo.status)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    {canUpdate ? (
                      <button
                        type="button"
                        aria-label={`Editar carga ${cargo.cargoNumber || cargo.description}`}
                        onClick={() => onEdit(cargo)}
                        className="rounded-full p-2 text-outline transition hover:bg-surface-container hover:text-on-surface"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        aria-label={`Excluir carga ${cargo.cargoNumber || cargo.description}`}
                        onClick={() => onDelete(cargo.id)}
                        className="rounded-full p-2 text-outline transition hover:bg-error/10 hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

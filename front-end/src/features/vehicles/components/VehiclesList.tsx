import React from 'react';
import { Car, Loader2, MoreVertical, Trash2, Truck } from 'lucide-react';
import { Vehicle } from '../types/vehicle.types';

interface VehiclesListProps {
  vehicles: Vehicle[];
  loading: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
}

export default function VehiclesList({
  vehicles,
  loading,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: VehiclesListProps) {
  return (
    <div className="rounded-xl bg-surface-container-low p-1 lg:col-span-12">
      <div className="h-full min-h-[400px] rounded-lg bg-surface-container-lowest p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-headline text-lg font-bold text-on-surface">Ativos da Frota</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium text-on-surface-variant">Carregando veiculos...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-outline/40">
              <Truck className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-bold text-on-surface">Nenhum veiculo encontrado</h4>
            <p className="mt-2 max-w-xs text-on-surface-variant">
              Comece adicionando seu primeiro veiculo a frota.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="group flex flex-col gap-3 rounded-xl p-3 transition-all hover:bg-primary-fixed-dim/10 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-3 sm:flex-1 sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                    {vehicle.type === 'Carga Pesada' || vehicle.type === 'Longo Percurso' ? (
                      <Truck className="h-6 w-6" />
                    ) : (
                      <Car className="h-6 w-6" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold font-headline text-on-surface">{vehicle.name}</span>
                      <span className="rounded bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-secondary-container">
                        {vehicle.plate}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-on-secondary-container">
                      Motorista: {vehicle.driver} • {vehicle.type}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:mr-6 sm:block sm:text-right">
                  <span className="text-sm font-bold text-on-surface">{vehicle.km.toLocaleString()} km</span>
                  <p className="text-[10px] uppercase text-on-secondary-container">
                    Proxima manutencao: {vehicle.nextMaintenance || 'N/A'}
                  </p>
                </div>

                {canDelete || canUpdate ? (
                  <div className="flex items-center justify-end gap-2 self-end sm:self-auto">
                    {canDelete ? (
                      <button
                        type="button"
                        aria-label={`Excluir veiculo ${vehicle.name}`}
                        onClick={() => onDelete(vehicle.id)}
                        className="p-2 text-outline transition-colors hover:text-error"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    ) : null}
                    {canUpdate ? (
                      <button
                        type="button"
                        aria-label={`Editar veiculo ${vehicle.name}`}
                        onClick={() => onEdit(vehicle)}
                        className="p-2 text-outline transition-colors hover:text-on-surface"
                      >
                        <MoreVertical className="h-5 w-5" />
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

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
    <div className="lg:col-span-12 bg-surface-container-low rounded-xl p-1">
      <div className="bg-surface-container-lowest rounded-lg p-6 h-full min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline font-bold text-lg text-on-surface">Ativos da Frota</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-on-surface-variant font-medium">Carregando veiculos...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center text-outline/40 mb-4">
              <Truck className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-on-surface">Nenhum veiculo encontrado</h4>
            <p className="text-on-surface-variant max-w-xs mt-2">
              Comece adicionando seu primeiro veiculo a frota.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="group flex items-center p-3 rounded-xl hover:bg-primary-fixed-dim/10 transition-all"
              >
                <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center text-primary">
                  {vehicle.type === 'Carga Pesada' || vehicle.type === 'Longo Percurso' ? (
                    <Truck className="w-6 h-6" />
                  ) : (
                    <Car className="w-6 h-6" />
                  )}
                </div>

                <div className="ml-4 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-headline text-on-surface">{vehicle.name}</span>
                    <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                      {vehicle.plate}
                    </span>
                  </div>
                  <p className="text-xs text-on-secondary-container">
                    Motorista: {vehicle.driver} • {vehicle.type}
                  </p>
                </div>

                <div className="hidden sm:block text-right mr-6">
                  <span className="text-sm font-bold text-on-surface">{vehicle.km.toLocaleString()} km</span>
                  <p className="text-[10px] text-on-secondary-container uppercase">
                    Proxima manutencao: {vehicle.nextMaintenance || 'N/A'}
                  </p>
                </div>

                {canDelete || canUpdate ? (
                  <div className="flex items-center gap-2">
                    {canDelete ? (
                      <button
                        type="button"
                        aria-label={`Excluir veiculo ${vehicle.name}`}
                        onClick={() => onDelete(vehicle.id)}
                        className="p-2 text-outline hover:text-error transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    ) : null}
                    {canUpdate ? (
                      <button
                        type="button"
                        aria-label={`Editar veiculo ${vehicle.name}`}
                        onClick={() => onEdit(vehicle)}
                        className="p-2 text-outline hover:text-on-surface transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
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

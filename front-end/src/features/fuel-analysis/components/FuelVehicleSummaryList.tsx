import React from 'react';
import { ChevronRight, Fuel, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { VehicleFuelSummary } from '../utils/fuel-analysis';

interface FuelVehicleSummaryListProps {
  summaries: VehicleFuelSummary[];
  loading: boolean;
  selectedVehicleId: string | null;
  onSelect: (vehicleId: string) => void;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(value: number, decimals = 0) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function FuelVehicleSummaryList({
  summaries,
  loading,
  selectedVehicleId,
  onSelect,
}: FuelVehicleSummaryListProps) {
  return (
    <div className="rounded-xl bg-surface-container-low p-1 lg:col-span-12">
      <div className="h-full min-h-[300px] rounded-lg bg-surface-container-lowest p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-headline text-lg font-bold text-on-surface">Consumo por Veiculo</h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-medium text-on-surface-variant">Calculando consumo...</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-outline/40">
              <Fuel className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-bold text-on-surface">Nenhum abastecimento encontrado</h4>
            <p className="mt-2 max-w-sm text-on-surface-variant">
              Lance custos operacionais na categoria Combustivel informando litros e odometro para acompanhar a media km/l de cada veiculo.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {summaries.map((summary) => (
              <button
                key={summary.vehicleId}
                type="button"
                onClick={() => onSelect(summary.vehicleId)}
                aria-label={`Ver abastecimentos do veiculo ${summary.vehicleName}`}
                className={cn(
                  'group flex w-full flex-col gap-3 rounded-xl p-3 text-left transition-all sm:flex-row sm:items-center',
                  selectedVehicleId === summary.vehicleId
                    ? 'bg-primary-fixed/40'
                    : 'hover:bg-primary-fixed-dim/10',
                )}
              >
                <div className="flex items-start gap-3 sm:flex-1 sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary">
                    <Fuel className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold font-headline text-on-surface">{summary.vehicleName || 'Veiculo'}</span>
                    <p className="mt-1 text-xs text-on-secondary-container">
                      {summary.fuelingCount} abastecimento{summary.fuelingCount === 1 ? '' : 's'} • {formatNumber(summary.totalLiters)} L • {formatNumber(summary.totalKm)} km medidos
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-left sm:mr-4 sm:text-right">
                  <div>
                    <span className="text-sm font-bold text-on-surface">
                      {summary.avgKmPerLiter !== null ? `${formatNumber(summary.avgKmPerLiter, 2)} km/l` : '—'}
                    </span>
                    <p className="text-[10px] uppercase text-on-secondary-container">Media</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-on-surface">
                      {summary.avgCostPerKm !== null ? `${formatCurrency(summary.avgCostPerKm)}/km` : '—'}
                    </span>
                    <p className="text-[10px] uppercase text-on-secondary-container">Custo</p>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-on-surface">{formatCurrency(summary.totalAmount)}</span>
                    <p className="text-[10px] uppercase text-on-secondary-container">Gasto total</p>
                  </div>
                </div>

                <ChevronRight
                  className={cn(
                    'hidden h-5 w-5 shrink-0 text-outline transition-transform sm:block',
                    selectedVehicleId === summary.vehicleId ? 'rotate-90 text-primary' : 'group-hover:translate-x-1',
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

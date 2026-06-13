import React, { useMemo, useState } from 'react';
import { Fuel, Gauge, Route, Wallet } from 'lucide-react';
import { getErrorMessage } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { useFirebase } from '../../../context/FirebaseContext';
import KpiCard from '../../../shared/ui/KpiCard';
import { useExpensesQuery } from '../../expenses/hooks/useExpensesQuery';
import FuelAnalysisHeader from '../components/FuelAnalysisHeader';
import FuelAnalysisFilters from '../components/FuelAnalysisFilters';
import FuelVehicleSummaryList from '../components/FuelVehicleSummaryList';
import FuelEntriesTable from '../components/FuelEntriesTable';
import { buildFleetFuelSummary } from '../utils/fuel-analysis';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(value: number, decimals = 0) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function resolvePeriodCutoff(periodFilter: string) {
  const days = Number(periodFilter);
  if (!Number.isFinite(days) || days <= 0) return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff.toISOString().slice(0, 10);
}

export default function FuelAnalysisPage() {
  const { userProfile } = useFirebase();

  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const { expenses, isLoading: loading, error: loadQueryError } = useExpensesQuery({
    enabled: Boolean(userProfile),
    canReadProviders: canAccess(userProfile, 'providers', 'read'),
  });

  const loadError = loadQueryError
    ? getErrorMessage(loadQueryError, 'Nao foi possivel carregar os dados de abastecimento.')
    : '';

  const fleetSummary = useMemo(() => {
    const cutoff = resolvePeriodCutoff(periodFilter);
    const periodExpenses = cutoff ? expenses.filter((expense) => (expense.date || '') >= cutoff) : expenses;
    return buildFleetFuelSummary(periodExpenses);
  }, [expenses, periodFilter]);

  const filteredSummaries = useMemo(() => {
    const search = searchTerm.toLowerCase();
    if (!search) return fleetSummary.vehicles;
    return fleetSummary.vehicles.filter((summary) => summary.vehicleName.toLowerCase().includes(search));
  }, [fleetSummary.vehicles, searchTerm]);

  const selectedSummary = useMemo(
    () => filteredSummaries.find((summary) => summary.vehicleId === selectedVehicleId) || null,
    [filteredSummaries, selectedVehicleId],
  );

  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicleId((current) => (current === vehicleId ? null : vehicleId));
  };

  return (
    <div className="space-y-10">
      <FuelAnalysisHeader />

      {loadError ? (
        <div className="rounded-2xl border border-error/20 bg-error/5 px-5 py-4 text-sm font-medium text-error">
          {loadError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Gasto com combustivel"
          value={formatCurrency(fleetSummary.totalAmount)}
          icon={Wallet}
          tone="primary"
        />
        <KpiCard
          label="Litros abastecidos"
          value={`${formatNumber(fleetSummary.totalLiters)} L`}
          icon={Fuel}
          tone="secondary"
        />
        <KpiCard
          label="Km medidos"
          value={`${formatNumber(fleetSummary.totalKm)} km`}
          icon={Route}
          tone="tertiary"
        />
        <KpiCard
          label="Media da frota"
          value={fleetSummary.avgKmPerLiter !== null ? `${formatNumber(fleetSummary.avgKmPerLiter, 2)} km/l` : '—'}
          helperText={fleetSummary.avgCostPerKm !== null ? `${formatCurrency(fleetSummary.avgCostPerKm)} por km` : undefined}
          icon={Gauge}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <FuelAnalysisFilters
            searchTerm={searchTerm}
            periodFilter={periodFilter}
            onSearchChange={setSearchTerm}
            onPeriodChange={setPeriodFilter}
          />
        </div>

        <FuelVehicleSummaryList
          summaries={filteredSummaries}
          loading={loading}
          selectedVehicleId={selectedVehicleId}
          onSelect={handleSelectVehicle}
        />

        {selectedSummary ? <FuelEntriesTable summary={selectedSummary} /> : null}
      </div>
    </div>
  );
}

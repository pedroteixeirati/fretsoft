import { Expense } from '../../expenses/types/expense.types';

export interface FuelEntry {
  expenseId: string;
  date: string;
  provider: string;
  liters: number;
  amount: number;
  odometer: number | null;
  kmRun: number | null;
  kmPerLiter: number | null;
  costPerKm: number | null;
}

export interface VehicleFuelSummary {
  vehicleId: string;
  vehicleName: string;
  fuelingCount: number;
  totalLiters: number;
  totalAmount: number;
  totalKm: number;
  avgKmPerLiter: number | null;
  avgCostPerKm: number | null;
  entries: FuelEntry[];
}

export interface FleetFuelSummary {
  totalAmount: number;
  totalLiters: number;
  totalKm: number;
  avgKmPerLiter: number | null;
  avgCostPerKm: number | null;
  vehicles: VehicleFuelSummary[];
}

// Protecao contra erros de digitacao do odometro (ex: digito a mais):
// nenhum intervalo entre abastecimentos deveria passar disso.
const MAX_REASONABLE_KM_RUN = 50000;

function normalizeCategory(value: string) {
  return (value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

export function isFuelExpense(expense: Pick<Expense, 'category'>) {
  return normalizeCategory(expense.category) === 'combustivel';
}

function parseNumeric(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  let normalized = String(value).trim();
  if (normalized.includes(',')) {
    // Formato pt-BR: "1.234,56" -> "1234.56"
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  }
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric;
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function buildVehicleFuelSummaries(expenses: Expense[]): VehicleFuelSummary[] {
  const byVehicle = new Map<string, Expense[]>();

  for (const expense of expenses) {
    if (!isFuelExpense(expense) || !expense.vehicleId) continue;
    const group = byVehicle.get(expense.vehicleId) || [];
    group.push(expense);
    byVehicle.set(expense.vehicleId, group);
  }

  const summaries: VehicleFuelSummary[] = [];

  for (const [vehicleId, group] of byVehicle) {
    const sorted = [...group].sort((a, b) => {
      const odometerA = parseNumeric(a.odometer);
      const odometerB = parseNumeric(b.odometer);
      if (odometerA !== null && odometerB !== null && odometerA !== odometerB) {
        return odometerA - odometerB;
      }
      return `${a.date || ''}T${a.time || '00:00'}`.localeCompare(`${b.date || ''}T${b.time || '00:00'}`);
    });

    const entries: FuelEntry[] = [];
    let previousOdometer: number | null = null;

    for (const expense of sorted) {
      const liters = parseNumeric(expense.quantity);
      const odometer = parseNumeric(expense.odometer);
      const amount = Number(expense.amount || 0);

      let kmRun: number | null = null;
      if (odometer !== null && previousOdometer !== null) {
        const diff = odometer - previousOdometer;
        if (diff > 0 && diff <= MAX_REASONABLE_KM_RUN) {
          kmRun = diff;
        }
      }
      if (odometer !== null) {
        previousOdometer = odometer;
      }

      entries.push({
        expenseId: expense.id,
        date: expense.date || '',
        provider: expense.provider || '',
        liters: liters ?? 0,
        amount,
        odometer,
        kmRun,
        kmPerLiter: kmRun !== null && liters ? round(kmRun / liters, 2) : null,
        costPerKm: kmRun !== null && kmRun > 0 && amount > 0 ? round(amount / kmRun, 2) : null,
      });
    }

    const totalLiters = entries.reduce((sum, entry) => sum + entry.liters, 0);
    const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const measuredEntries = entries.filter((entry) => entry.kmRun !== null);
    const totalKm = measuredEntries.reduce((sum, entry) => sum + (entry.kmRun || 0), 0);
    const measuredLiters = measuredEntries.reduce((sum, entry) => sum + entry.liters, 0);
    const measuredAmount = measuredEntries.reduce((sum, entry) => sum + entry.amount, 0);

    summaries.push({
      vehicleId,
      vehicleName: group[0]?.vehicleName || '',
      fuelingCount: entries.length,
      totalLiters: round(totalLiters, 2),
      totalAmount: round(totalAmount, 2),
      totalKm: round(totalKm, 0),
      avgKmPerLiter: totalKm > 0 && measuredLiters > 0 ? round(totalKm / measuredLiters, 2) : null,
      avgCostPerKm: totalKm > 0 && measuredAmount > 0 ? round(measuredAmount / totalKm, 2) : null,
      entries: [...entries].reverse(),
    });
  }

  return summaries.sort((a, b) => b.totalAmount - a.totalAmount);
}

export function buildFleetFuelSummary(expenses: Expense[]): FleetFuelSummary {
  const vehicles = buildVehicleFuelSummaries(expenses);

  const totalAmount = round(vehicles.reduce((sum, vehicle) => sum + vehicle.totalAmount, 0), 2);
  const totalLiters = round(vehicles.reduce((sum, vehicle) => sum + vehicle.totalLiters, 0), 2);
  const totalKm = round(vehicles.reduce((sum, vehicle) => sum + vehicle.totalKm, 0), 0);

  const measuredVehicles = vehicles.filter((vehicle) => vehicle.avgKmPerLiter !== null);
  const measuredKm = measuredVehicles.reduce((sum, vehicle) => sum + vehicle.totalKm, 0);
  const measuredLiters = measuredVehicles.reduce(
    (sum, vehicle) => sum + (vehicle.avgKmPerLiter ? vehicle.totalKm / vehicle.avgKmPerLiter : 0),
    0,
  );

  return {
    totalAmount,
    totalLiters,
    totalKm,
    avgKmPerLiter: measuredKm > 0 && measuredLiters > 0 ? round(measuredKm / measuredLiters, 2) : null,
    avgCostPerKm: totalKm > 0 && totalAmount > 0 ? round(totalAmount / totalKm, 2) : null,
    vehicles,
  };
}

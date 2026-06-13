import { describe, expect, it } from 'vitest';
import { Expense } from '../../expenses/types/expense.types';
import { buildFleetFuelSummary, buildVehicleFuelSummaries, isFuelExpense } from './fuel-analysis';

function makeFuelExpense(overrides: Partial<Expense>): Expense {
  return {
    id: 'expense-1',
    date: '2026-01-10',
    time: '08:00',
    vehicleId: 'vehicle-1',
    vehicleName: 'Onibus 01',
    provider: 'Posto Mamore',
    category: 'Combustivel',
    quantity: '100',
    amount: 500,
    odometer: '10000',
    status: 'approved',
    observations: '',
    ...overrides,
  };
}

describe('isFuelExpense', () => {
  it('reconhece a categoria combustivel com e sem acento', () => {
    expect(isFuelExpense({ category: 'Combustivel' })).toBe(true);
    expect(isFuelExpense({ category: 'Combustível' })).toBe(true);
    expect(isFuelExpense({ category: 'COMBUSTIVEL ' })).toBe(true);
    expect(isFuelExpense({ category: 'Manutencao' })).toBe(false);
  });
});

describe('buildVehicleFuelSummaries', () => {
  it('calcula km rodado, media km/l e custo por km entre abastecimentos', () => {
    const expenses: Expense[] = [
      makeFuelExpense({ id: 'a', date: '2026-01-01', odometer: '10000', quantity: '100', amount: 600 }),
      makeFuelExpense({ id: 'b', date: '2026-01-05', odometer: '10500', quantity: '125', amount: 750 }),
      makeFuelExpense({ id: 'c', date: '2026-01-09', odometer: '11000', quantity: '100', amount: 650 }),
    ];

    const [summary] = buildVehicleFuelSummaries(expenses);

    expect(summary.fuelingCount).toBe(3);
    expect(summary.totalLiters).toBe(325);
    expect(summary.totalAmount).toBe(2000);
    expect(summary.totalKm).toBe(1000);
    // 1000 km / (125 + 100) litros dos abastecimentos com km medido
    expect(summary.avgKmPerLiter).toBe(4.44);
    // (750 + 650) / 1000 km
    expect(summary.avgCostPerKm).toBe(1.4);

    const [latest, middle, first] = summary.entries;
    expect(first.kmRun).toBeNull();
    expect(middle.kmRun).toBe(500);
    expect(middle.kmPerLiter).toBe(4);
    expect(latest.kmRun).toBe(500);
    expect(latest.kmPerLiter).toBe(5);
    expect(latest.costPerKm).toBe(1.3);
  });

  it('ignora odometro zerado, aceita virgula decimal e descarta saltos absurdos de km', () => {
    const expenses: Expense[] = [
      makeFuelExpense({ id: 'a', odometer: '0', quantity: '50', amount: 250 }),
      makeFuelExpense({ id: 'b', date: '2026-01-02', odometer: '10000', quantity: '80,5', amount: 400 }),
      makeFuelExpense({ id: 'c', date: '2026-01-03', odometer: '910000', quantity: '90', amount: 450 }),
    ];

    const [summary] = buildVehicleFuelSummaries(expenses);

    expect(summary.totalKm).toBe(0);
    expect(summary.avgKmPerLiter).toBeNull();
    expect(summary.totalLiters).toBe(220.5);
  });

  it('agrupa por veiculo e ignora despesas que nao sao combustivel', () => {
    const expenses: Expense[] = [
      makeFuelExpense({ id: 'a', vehicleId: 'v1', vehicleName: 'Onibus 01' }),
      makeFuelExpense({ id: 'b', vehicleId: 'v2', vehicleName: 'Onibus 02', odometer: '5000' }),
      makeFuelExpense({ id: 'c', vehicleId: 'v1', category: 'Manutencao' }),
      makeFuelExpense({ id: 'd', vehicleId: '', vehicleName: '' }),
    ];

    const summaries = buildVehicleFuelSummaries(expenses);

    expect(summaries).toHaveLength(2);
    expect(summaries.map((item) => item.vehicleId).sort()).toEqual(['v1', 'v2']);
  });
});

describe('buildFleetFuelSummary', () => {
  it('consolida totais da frota', () => {
    const expenses: Expense[] = [
      makeFuelExpense({ id: 'a', vehicleId: 'v1', odometer: '1000', quantity: '100', amount: 500 }),
      makeFuelExpense({ id: 'b', vehicleId: 'v1', date: '2026-01-05', odometer: '1500', quantity: '100', amount: 550 }),
      makeFuelExpense({ id: 'c', vehicleId: 'v2', odometer: '2000', quantity: '50', amount: 300 }),
    ];

    const fleet = buildFleetFuelSummary(expenses);

    expect(fleet.totalAmount).toBe(1350);
    expect(fleet.totalLiters).toBe(250);
    expect(fleet.totalKm).toBe(500);
    expect(fleet.avgKmPerLiter).toBe(5);
    expect(fleet.vehicles).toHaveLength(2);
  });
});

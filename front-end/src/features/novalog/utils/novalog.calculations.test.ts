import { describe, expect, it } from 'vitest';
import { calculateNovalogEntryAmounts, getNovalogWeekNumberFromDate } from './novalog.calculations';

describe('calculateNovalogEntryAmounts', () => {
  it('calcula os valores principais da operacao Novalog', () => {
    expect(calculateNovalogEntryAmounts(36.25, 11, 10)).toEqual({
      companyGrossAmount: 398.75,
      aggregatedGrossAmount: 362.5,
      driverShareAmount: 145,
      driverNetAmount: 217.5,
    });
  });

  it('retorna zero para entradas invalidas', () => {
    expect(calculateNovalogEntryAmounts(Number.NaN, 10, 10)).toEqual({
      companyGrossAmount: 0,
      aggregatedGrossAmount: 0,
      driverShareAmount: 0,
      driverNetAmount: 0,
    });
  });

  it('deriva a semana operacional pela data para compatibilidade com o backend', () => {
    expect(getNovalogWeekNumberFromDate('2026-05-01')).toBe(1);
    expect(getNovalogWeekNumberFromDate('2026-05-08')).toBe(2);
    expect(getNovalogWeekNumberFromDate('2026-05-15')).toBe(3);
    expect(getNovalogWeekNumberFromDate('2026-05-22')).toBe(4);
  });
});

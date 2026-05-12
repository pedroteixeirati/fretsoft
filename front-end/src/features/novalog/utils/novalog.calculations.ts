export function formatNovalogCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseNovalogDecimal(value: string) {
  if (!value) return 0;

  const normalized = value.replace(/\./g, '').replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNovalogDecimalInput(value: string) {
  const digits = value.replace(/\D/g, '');

  if (!digits) return '';

  const integerPart = digits.slice(0, -2) || '0';
  const decimalPart = digits.slice(-2).padStart(2, '0');
  return `${String(Number(integerPart))},${decimalPart}`;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateNovalogEntryAmounts(weight: number, companyRatePerTon: number, aggregatedRatePerTon: number) {
  if (![weight, companyRatePerTon, aggregatedRatePerTon].every((value) => Number.isFinite(value) && value >= 0)) {
    return {
      companyGrossAmount: 0,
      aggregatedGrossAmount: 0,
      driverShareAmount: 0,
      driverNetAmount: 0,
    };
  }

  const companyGrossAmount = roundCurrency(weight * companyRatePerTon);
  const aggregatedGrossAmount = roundCurrency(weight * aggregatedRatePerTon);
  const driverShareAmount = roundCurrency(aggregatedGrossAmount * 0.4);
  const driverNetAmount = roundCurrency(aggregatedGrossAmount - driverShareAmount);

  return {
    companyGrossAmount,
    aggregatedGrossAmount,
    driverShareAmount,
    driverNetAmount,
  };
}

export function getNovalogWeekNumberFromDate(value: string) {
  const day = Number(value.slice(8, 10));

  if (!Number.isFinite(day) || day <= 0) return 1;
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

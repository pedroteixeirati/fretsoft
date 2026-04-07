export function formatDateLabel(dateValue: string) {
  const parsed = parseDateInput(dateValue);
  return parsed ? parsed.toLocaleDateString('pt-BR') : dateValue;
}

export function parseDateInput(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function monthDiff(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

export function formatCompetenceLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function formatDueDate(referenceMonth: Date, contractStartDate: Date | null) {
  const fallbackDay = 5;
  const dueDay = Math.min(Math.max(contractStartDate?.getDate() || fallbackDay, 1), endOfMonth(referenceMonth).getDate());
  return new Date(referenceMonth.getFullYear(), referenceMonth.getMonth(), dueDay).toISOString().split('T')[0];
}

export function shouldGenerateContractRevenue(remunerationType: 'recurring' | 'per_trip', monthlyValue: number) {
  return remunerationType === 'recurring' && monthlyValue > 0;
}

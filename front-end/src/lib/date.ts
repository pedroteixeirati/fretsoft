export function parseDateOnly(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateOnlyPtBr(value: string, fallback = '-') {
  const parsed = parseDateOnly(value);
  if (!parsed) return fallback;
  return parsed.toLocaleDateString('pt-BR');
}

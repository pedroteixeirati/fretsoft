export type ReportTab = 'financial' | 'operational' | 'managerial';

export const REPORT_TABS: { id: ReportTab; label: string; description: string }[] = [
  { id: 'financial', label: 'Relatorio Financeiro', description: 'Contas a receber, custos operacionais, contas a pagar e saldo realizado.' },
  { id: 'operational', label: 'Relatorio Operacional', description: 'Viagens, rotas, uso da frota e manutencao.' },
  { id: 'managerial', label: 'Relatorio Gerencial', description: 'Visao consolidada de empresas, contratos e desempenho.' },
];

export function toDateInputValue(date: Date) {
  return date.toISOString().split('T')[0];
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function formatDatePtBr(value: string) {
  if (!value) return 'dd/mm/aaaa';
  const parsed = parseLocalDate(value);
  if (Number.isNaN(parsed.getTime())) return 'dd/mm/aaaa';
  return parsed.toLocaleDateString('pt-BR');
}

export function getMonthLabel(reference: Date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(reference);
}

export function getCalendarDays(reference: Date) {
  const firstDay = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const lastDay = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  const days: Date[] = [];

  for (let index = firstDay.getDay(); index > 0; index -= 1) {
    days.push(new Date(reference.getFullYear(), reference.getMonth(), 1 - index));
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(reference.getFullYear(), reference.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    const nextDay = days.length - lastDay.getDate() - firstDay.getDay() + 1;
    days.push(new Date(reference.getFullYear(), reference.getMonth() + 1, nextDay));
  }

  return days;
}

export function getCurrentMonthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

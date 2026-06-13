export type NextDueState = 'overdue' | 'upcoming' | 'ok' | 'none';

const UPCOMING_WINDOW_DAYS = 30;

export function getNextDueState(nextDueOn: string, referenceDate = new Date()): NextDueState {
  if (!nextDueOn) return 'none';
  const due = new Date(`${nextDueOn}T00:00:00`);
  const reference = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const diffDays = Math.floor((due.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= UPCOMING_WINDOW_DAYS) return 'upcoming';
  return 'ok';
}

export const nextDueStateLabels: Record<NextDueState, string> = {
  overdue: 'Vencida',
  upcoming: 'A vencer',
  ok: 'Em dia',
  none: 'Sem proxima',
};

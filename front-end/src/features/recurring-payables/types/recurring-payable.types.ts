export type RecurringPayableStatus = 'active' | 'paused';

export interface RecurringPayable {
  id: string;
  displayId?: number;
  description: string;
  providerName: string;
  amount: number;
  dueDay: number;
  startsOn: string;
  endsOn: string;
  status: RecurringPayableStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const recurringPayableStatusLabels: Record<RecurringPayableStatus, string> = {
  active: 'Ativa',
  paused: 'Pausada',
};

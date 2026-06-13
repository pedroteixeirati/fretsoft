import { apiRequest, createCrudApi } from '../../../shared/lib/api-client';
import { OperationType } from '../../../firebase';
import { RecurringPayable } from '../types/recurring-payable.types';

export const recurringPayablesApi = {
  ...createCrudApi<RecurringPayable>('/api/recurring-payables'),
  generate: () =>
    apiRequest<{ created: number }>(
      '/api/recurring-payables/generate',
      { method: 'POST', body: JSON.stringify({}) },
      OperationType.CREATE,
    ),
};

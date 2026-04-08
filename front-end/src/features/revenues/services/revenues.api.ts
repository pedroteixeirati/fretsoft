import { OperationType } from '../../../firebase';
import { apiRequest } from '../../../shared/lib/api-client';
import { Revenue } from '../types/revenue.types';

export const revenuesApi = {
  list: () => apiRequest<Revenue[]>('/api/revenues', {}, OperationType.LIST),
  generate: () => apiRequest<{ generated: number }>('/api/revenues/generate', { method: 'POST' }, OperationType.CREATE),
  generateCharge: (id: string) => apiRequest<Revenue>(`/api/revenues/${id}/charge`, { method: 'POST' }, OperationType.UPDATE),
  markReceived: (id: string) => apiRequest<Revenue>(`/api/revenues/${id}/receive`, { method: 'POST' }, OperationType.UPDATE),
  markOverdue: (id: string) => apiRequest<Revenue>(`/api/revenues/${id}/overdue`, { method: 'POST' }, OperationType.UPDATE),
};

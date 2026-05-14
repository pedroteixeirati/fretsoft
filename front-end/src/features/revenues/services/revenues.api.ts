import { OperationType } from '../../../firebase';
import { apiRequest } from '../../../shared/lib/api-client';
import { Revenue, RevenuePayment } from '../types/revenue.types';

export const revenuesApi = {
  list: () => apiRequest<Revenue[]>('/api/revenues', {}, OperationType.LIST),
  generate: () => apiRequest<{ generated: number }>('/api/revenues/generate', { method: 'POST' }, OperationType.CREATE),
  generateCharge: (id: string) => apiRequest<Revenue>(`/api/revenues/${id}/charge`, { method: 'POST' }, OperationType.UPDATE),
  markReceived: (id: string) => apiRequest<Revenue>(`/api/revenues/${id}/receive`, { method: 'POST' }, OperationType.UPDATE),
  listPayments: (id: string) => apiRequest<RevenuePayment[]>(`/api/revenues/${id}/payments`, {}, OperationType.LIST),
  registerPayment: (id: string, payload: { amount: number; paymentDate: string; notes?: string }) =>
    apiRequest<Revenue>(`/api/revenues/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, OperationType.UPDATE),
  reversePayment: (id: string, paymentId: string, payload: { reason: string }) =>
    apiRequest<Revenue>(`/api/revenues/${id}/payments/${paymentId}/reverse`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, OperationType.UPDATE),
  markOverdue: (id: string) => apiRequest<Revenue>(`/api/revenues/${id}/overdue`, { method: 'POST' }, OperationType.UPDATE),
};

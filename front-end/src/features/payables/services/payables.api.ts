import { OperationType } from '../../../firebase';
import { apiRequest } from '../../../shared/lib/api-client';
import { Payable } from '../types/payable.types';

export const payablesApi = {
  list: () => apiRequest<Payable[]>('/api/payables', {}, OperationType.LIST),
  create: (payload: Omit<Payable, 'id'>) => apiRequest<Payable>('/api/payables', { method: 'POST', body: JSON.stringify(payload) }, OperationType.CREATE),
  update: (id: string, payload: Partial<Omit<Payable, 'id'>>) => apiRequest<Payable>(`/api/payables/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, OperationType.UPDATE),
  remove: (id: string) => apiRequest<void>(`/api/payables/${id}`, { method: 'DELETE' }, OperationType.DELETE),
  markPaid: (id: string) => apiRequest<Payable>(`/api/payables/${id}/pay`, { method: 'POST' }, OperationType.UPDATE),
  markOverdue: (id: string) => apiRequest<Payable>(`/api/payables/${id}/overdue`, { method: 'POST' }, OperationType.UPDATE),
};

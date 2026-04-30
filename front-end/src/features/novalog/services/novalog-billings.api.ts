import { apiRequest } from '../../../shared/lib/api-client';
import { NovalogBilling, NovalogBillingItemUpdatePayload, NovalogBillingPayload } from '../types/novalog-billing.types';

export const novalogBillingsApi = {
  list: () => apiRequest<NovalogBilling[]>('/api/novalog/billings'),
  get: (id: string) => apiRequest<NovalogBilling>(`/api/novalog/billings/${id}`),
  create: (payload: NovalogBillingPayload) =>
    apiRequest<NovalogBilling>('/api/novalog/billings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: NovalogBillingPayload) =>
    apiRequest<NovalogBilling>(`/api/novalog/billings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateItem: (id: string, payload: NovalogBillingItemUpdatePayload) =>
    apiRequest<NovalogBilling>(`/api/novalog/billing-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteItem: (id: string) =>
    apiRequest<NovalogBilling>(`/api/novalog/billing-items/${id}`, {
      method: 'DELETE',
    }),
  close: (id: string) =>
    apiRequest<NovalogBilling>(`/api/novalog/billings/${id}/close`, {
      method: 'POST',
    }),
  markItemReceived: (id: string) =>
    apiRequest<NovalogBilling>(`/api/novalog/billing-items/${id}/receive`, {
      method: 'POST',
    }),
  markItemOverdue: (id: string) =>
    apiRequest<NovalogBilling>(`/api/novalog/billing-items/${id}/overdue`, {
      method: 'POST',
    }),
  cancelItem: (id: string) =>
    apiRequest<NovalogBilling>(`/api/novalog/billing-items/${id}/cancel`, {
      method: 'POST',
    }),
};

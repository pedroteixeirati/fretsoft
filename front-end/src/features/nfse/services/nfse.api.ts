import { OperationType } from '../../../firebase';
import { apiRequest } from '../../../shared/lib/api-client';
import { NfseCreatePayload, NfseDocument } from '../types/nfse.types';

export const nfseApi = {
  list: () => apiRequest<NfseDocument[]>('/api/fiscal/nfse', {}, OperationType.LIST),
  create: (payload: NfseCreatePayload) =>
    apiRequest<NfseDocument>('/api/fiscal/nfse', { method: 'POST', body: JSON.stringify(payload) }, OperationType.CREATE),
  emit: (id: string) =>
    apiRequest<NfseDocument>(`/api/fiscal/nfse/${id}/emit`, { method: 'POST' }, OperationType.UPDATE),
  sync: (id: string) =>
    apiRequest<NfseDocument>(`/api/fiscal/nfse/${id}/sync`, { method: 'POST' }, OperationType.UPDATE),
  remove: (id: string) =>
    apiRequest<void>(`/api/fiscal/nfse/${id}`, { method: 'DELETE' }, OperationType.DELETE),
};

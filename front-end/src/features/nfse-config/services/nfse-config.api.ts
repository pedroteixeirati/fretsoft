import { OperationType } from '../../../firebase';
import { apiRequest } from '../../../shared/lib/api-client';
import { NfseConfig, NfseConfigPayload } from '../types/nfse-config.types';

export const nfseConfigApi = {
  get: () => apiRequest<NfseConfig>('/api/fiscal/nfse-config', {}, OperationType.GET),
  save: (payload: NfseConfigPayload) =>
    apiRequest<NfseConfig>(
      '/api/fiscal/nfse-config',
      { method: 'PUT', body: JSON.stringify(payload) },
      OperationType.UPDATE,
    ),
};

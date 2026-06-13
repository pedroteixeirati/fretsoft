import { OperationType } from '../../../firebase';
import { apiRequest } from '../../../shared/lib/api-client';
import { GeneratePayablePayload, NfeReceipt } from '../types/nfe-inbox.types';

export const nfeInboxApi = {
  list: () => apiRequest<NfeReceipt[]>('/api/fiscal/nfe-receipts', {}, OperationType.LIST),
  import: (xml: string) =>
    apiRequest<NfeReceipt>(
      '/api/fiscal/nfe-receipts/import',
      { method: 'POST', body: JSON.stringify({ xml, source: 'upload' }) },
      OperationType.CREATE,
    ),
  generatePayable: (id: string, payload: GeneratePayablePayload) =>
    apiRequest<NfeReceipt>(
      `/api/fiscal/nfe-receipts/${id}/payable`,
      { method: 'POST', body: JSON.stringify(payload) },
      OperationType.CREATE,
    ),
  ignore: (id: string) =>
    apiRequest<NfeReceipt>(
      `/api/fiscal/nfe-receipts/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status: 'ignored' }) },
      OperationType.UPDATE,
    ),
};

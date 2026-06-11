import { OperationType } from '../../../firebase';
import { apiRequest } from '../../../shared/lib/api-client';
import type { FiscalDocument, FiscalDocumentDraft } from '../types/fiscal.types';

export const fiscalApi = {
  listDocuments: () => apiRequest<FiscalDocument[]>('/api/fiscal/documents', {}, OperationType.LIST),
  getDocument: (id: string) => apiRequest<FiscalDocument>(`/api/fiscal/documents/${id}`, {}, OperationType.GET),
  createDocument: (payload: FiscalDocumentDraft) => apiRequest<FiscalDocument>('/api/fiscal/documents', { method: 'POST', body: JSON.stringify(payload) }, OperationType.CREATE),
  updateDocument: (id: string, payload: FiscalDocumentDraft) => apiRequest<FiscalDocument>(`/api/fiscal/documents/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, OperationType.UPDATE),
  removeDocument: (id: string) => apiRequest<void>(`/api/fiscal/documents/${id}`, { method: 'DELETE' }, OperationType.DELETE),
};

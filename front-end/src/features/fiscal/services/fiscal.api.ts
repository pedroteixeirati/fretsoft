import { OperationType } from '../../../firebase';
import { apiRequest } from '../../../shared/lib/api-client';
import type { CargoInsurancePolicy, CargoInsurancePolicyDraft, FiscalCommunicationLog, FiscalCorrectionLetterDraft, FiscalDocument, FiscalDocumentDraft, FiscalDraftFromFreight, FiscalEvent, FiscalMdfeDriverDraft } from '../types/fiscal.types';

export const fiscalApi = {
  listDocuments: () => apiRequest<FiscalDocument[]>('/api/fiscal/documents', {}, OperationType.LIST),
  listDocumentLogs: (id: string) => apiRequest<FiscalCommunicationLog[]>(`/api/fiscal/documents/${id}/logs`, {}, OperationType.LIST),
  listDocumentEvents: (id: string) => apiRequest<FiscalEvent[]>(`/api/fiscal/documents/${id}/events`, {}, OperationType.LIST),
  draftFromFreight: (freightId: string) => apiRequest<FiscalDraftFromFreight>(`/api/fiscal/documents/from-freight/${freightId}`, {}, OperationType.GET),
  getDocument: (id: string) => apiRequest<FiscalDocument>(`/api/fiscal/documents/${id}`, {}, OperationType.GET),
  createDocument: (payload: FiscalDocumentDraft) => apiRequest<FiscalDocument>('/api/fiscal/documents', { method: 'POST', body: JSON.stringify(payload) }, OperationType.CREATE),
  updateDocument: (id: string, payload: FiscalDocumentDraft) => apiRequest<FiscalDocument>(`/api/fiscal/documents/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, OperationType.UPDATE),
  emitDocument: (id: string) => apiRequest<FiscalDocument>(`/api/fiscal/documents/${id}/emit`, { method: 'POST' }, OperationType.UPDATE),
  syncDocument: (id: string) => apiRequest<FiscalDocument>(`/api/fiscal/documents/${id}/sync`, { method: 'POST' }, OperationType.UPDATE),
  closeDocument: (id: string) => apiRequest<FiscalDocument>(`/api/fiscal/documents/${id}/close`, { method: 'POST' }, OperationType.UPDATE),
  cancelDocument: (id: string, justification: string) => apiRequest<FiscalDocument>(`/api/fiscal/documents/${id}/cancel`, { method: 'POST', body: JSON.stringify({ justification }) }, OperationType.UPDATE),
  sendCorrectionLetter: (id: string, payload: FiscalCorrectionLetterDraft) => apiRequest<FiscalDocument>(`/api/fiscal/documents/${id}/correction-letter`, { method: 'POST', body: JSON.stringify(payload) }, OperationType.UPDATE),
  addMdfeDriver: (id: string, payload: FiscalMdfeDriverDraft) => apiRequest<FiscalDocument>(`/api/fiscal/documents/${id}/mdfe-driver`, { method: 'POST', body: JSON.stringify(payload) }, OperationType.UPDATE),
  resendDocument: (id: string, emails: string[]) => apiRequest<FiscalDocument>(`/api/fiscal/documents/${id}/email`, { method: 'POST', body: JSON.stringify({ emails }) }, OperationType.UPDATE),
  removeDocument: (id: string) => apiRequest<void>(`/api/fiscal/documents/${id}`, { method: 'DELETE' }, OperationType.DELETE),
  listCargoInsurancePolicies: () => apiRequest<CargoInsurancePolicy[]>('/api/fiscal/cargo-insurance-policies', {}, OperationType.LIST),
  createCargoInsurancePolicy: (payload: CargoInsurancePolicyDraft) => apiRequest<CargoInsurancePolicy>('/api/fiscal/cargo-insurance-policies', { method: 'POST', body: JSON.stringify(payload) }, OperationType.CREATE),
  updateCargoInsurancePolicy: (id: string, payload: CargoInsurancePolicyDraft) => apiRequest<CargoInsurancePolicy>(`/api/fiscal/cargo-insurance-policies/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, OperationType.UPDATE),
  removeCargoInsurancePolicy: (id: string) => apiRequest<void>(`/api/fiscal/cargo-insurance-policies/${id}`, { method: 'DELETE' }, OperationType.DELETE),
};

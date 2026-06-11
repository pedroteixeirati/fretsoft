import type { FiscalDocumentRow, FiscalPartyRow } from '../dtos/fiscal-document.types';
import { fiscalErrors } from '../errors/fiscal.errors';

export type FiscalProviderOperation = 'emit_document';

export interface FiscalProviderRequest {
  operation: FiscalProviderOperation;
  document: FiscalDocumentRow;
  parties: FiscalPartyRow[];
}

export interface FiscalProviderResponse {
  status: FiscalDocumentRow['status'];
  provider: string;
  providerDocumentId?: string | null;
  accessKey?: string | null;
  protocol?: string | null;
  authorizedAt?: string | null;
  xml?: string | null;
  dacteUrl?: string | null;
  responsePayload?: Record<string, unknown>;
  httpStatus?: number | null;
}

export interface FiscalProviderAdapter {
  name: string;
  emitDocument(request: FiscalProviderRequest): Promise<FiscalProviderResponse>;
}

function providerNameFromEnv() {
  return (process.env.FISCAL_PROVIDER || '').trim().toLowerCase();
}

export function buildFiscalProviderRequest(document: FiscalDocumentRow, parties: FiscalPartyRow[]): FiscalProviderRequest {
  return {
    operation: 'emit_document',
    document,
    parties,
  };
}

export function serializeFiscalProviderRequest(request: FiscalProviderRequest) {
  return {
    operation: request.operation,
    document: {
      id: request.document.id,
      documentType: request.document.document_type,
      model: request.document.model,
      series: request.document.series,
      number: request.document.number,
      issueDate: request.document.issue_date,
      dueDate: request.document.due_date,
      amount: Number(request.document.amount || 0),
      originName: request.document.origin_name,
      destinationName: request.document.destination_name,
      takerName: request.document.taker_name,
      taxData: request.document.tax_data || {},
      emitterSnapshot: request.document.emitter_snapshot || {},
    },
    parties: request.parties.map((party) => ({
      role: party.role,
      name: party.name,
      documentNumber: party.document_number,
      stateRegistration: party.state_registration,
      city: party.city,
      state: party.state,
    })),
  };
}

export function getFiscalProviderAdapter(): FiscalProviderAdapter {
  const providerName = providerNameFromEnv();
  if (!providerName) {
    throw fiscalErrors.providerNotConfigured();
  }

  throw fiscalErrors.providerNotConfigured();
}

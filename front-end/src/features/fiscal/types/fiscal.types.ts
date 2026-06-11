export type FiscalDocumentType = 'cte' | 'cte_os' | 'mdfe';
export type FiscalDocumentStatus = 'draft' | 'processing' | 'authorized' | 'rejected' | 'canceled' | 'denied' | 'inutilized' | 'error';

export interface FiscalParty {
  id?: string;
  role: 'taker' | 'sender' | 'recipient' | 'dispatcher' | 'receiver';
  name: string;
  documentNumber: string;
  stateRegistration: string;
  city: string;
  state: string;
}

export interface FiscalDocument {
  id: string;
  displayId?: number;
  documentType: FiscalDocumentType;
  model: string;
  series: string;
  number: string;
  accessKey: string;
  status: FiscalDocumentStatus;
  issueDate: string;
  dueDate: string;
  amount: number;
  originName: string;
  destinationName: string;
  takerName: string;
  protocol: string;
  authorizedAt: string;
  xml: string;
  dacteUrl: string;
  provider: string;
  providerDocumentId: string;
  idempotencyKey: string;
  taxData: Record<string, unknown>;
  emitterSnapshot: Record<string, unknown>;
  notes: string;
  createdAt: string;
  updatedAt: string;
  parties: FiscalParty[];
}

export type FiscalDocumentDraft = Omit<FiscalDocument, 'id' | 'displayId' | 'createdAt' | 'updatedAt'>;

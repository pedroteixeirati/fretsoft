export type FiscalDocumentType = 'cte' | 'cte_os' | 'mdfe';
export type FiscalDocumentStatus = 'draft' | 'processing' | 'authorized' | 'rejected' | 'canceled' | 'denied' | 'inutilized' | 'error';

export type FiscalExecutionMode = 'own_fleet' | 'third_party';

export interface FiscalParty {
  id?: string;
  role: 'taker' | 'sender' | 'recipient' | 'dispatcher' | 'receiver';
  name: string;
  documentNumber: string;
  stateRegistration: string;
  city: string;
  state: string;
  phone: string;
  street: string;
  number: string;
  district: string;
  zipCode: string;
  cityIbgeCode: string;
}

export interface FiscalCteData {
  cfop?: string;
  naturezaOperacao?: string;
  tipoServico?: string;
  icmsCst?: string;
  icmsBaseCalculo?: number;
  icmsAliquota?: number;
  icmsValor?: number;
  produtoPredominante?: string;
  valorCarga?: number;
  municipioInicioIbge?: string;
  municipioFimIbge?: string;
  nfeKeys?: string[];
}

export interface FiscalPayment {
  id?: string;
  payeeName: string;
  payeeDocument: string;
  componentType: '01' | '02' | '03' | '04';
  amount: number;
  bankName: string;
  bankBranch: string;
  bankAccount: string;
  pixKey: string;
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
  sourceFreightId: string;
  executionMode: FiscalExecutionMode;
  ciot: string;
  rntrc: string;
  cteData: FiscalCteData;
  createdAt: string;
  updatedAt: string;
  parties: FiscalParty[];
  payments: FiscalPayment[];
  warnings?: string[];
}

export type FiscalDocumentDraft = Omit<FiscalDocument, 'id' | 'displayId' | 'createdAt' | 'updatedAt'>;

export interface FiscalDraftFromFreight {
  existingDocumentId: string | null;
  draft: Partial<FiscalDocumentDraft> & { sourceFreightId: string };
}

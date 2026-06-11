export type FiscalDocumentType = 'cte' | 'cte_os' | 'mdfe';
export type FiscalDocumentStatus = 'draft' | 'processing' | 'authorized' | 'rejected' | 'canceled' | 'denied' | 'inutilized' | 'error';
export type FiscalPartyRole = 'taker' | 'sender' | 'recipient' | 'dispatcher' | 'receiver';
export type FiscalExecutionMode = 'own_fleet' | 'third_party';
export type FiscalPaymentComponent = '01' | '02' | '03' | '04';

export interface FiscalPaymentInput {
  payeeName?: string | null;
  payeeDocument?: string | null;
  componentType?: FiscalPaymentComponent | string | null;
  amount?: number | string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccount?: string | null;
  pixKey?: string | null;
}

export interface FiscalPaymentPayload {
  payeeName: string;
  payeeDocument: string;
  componentType: FiscalPaymentComponent;
  amount: number;
  bankName: string;
  bankBranch: string;
  bankAccount: string;
  pixKey: string;
}

export interface FiscalPaymentRow {
  id: string;
  display_id: string | number | null;
  fiscal_document_id: string;
  payee_name: string | null;
  payee_document: string | null;
  component_type: FiscalPaymentComponent;
  amount: string | number;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account: string | null;
  pix_key: string | null;
}

export interface FiscalPartyInput {
  role?: FiscalPartyRole | string | null;
  name?: string | null;
  documentNumber?: string | null;
  stateRegistration?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface FiscalDocumentInput {
  documentType?: FiscalDocumentType | string | null;
  model?: string | null;
  series?: string | null;
  number?: string | null;
  accessKey?: string | null;
  status?: FiscalDocumentStatus | string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  amount?: number | string | null;
  originName?: string | null;
  destinationName?: string | null;
  takerName?: string | null;
  protocol?: string | null;
  authorizedAt?: string | null;
  xml?: string | null;
  dacteUrl?: string | null;
  provider?: string | null;
  providerDocumentId?: string | null;
  idempotencyKey?: string | null;
  taxData?: Record<string, unknown> | null;
  emitterSnapshot?: Record<string, unknown> | null;
  notes?: string | null;
  sourceFreightId?: string | null;
  executionMode?: FiscalExecutionMode | string | null;
  ciot?: string | null;
  rntrc?: string | null;
  transportPartnerId?: string | null;
  payments?: FiscalPaymentInput[] | null;
  parties?: FiscalPartyInput[] | null;
}

export interface FiscalPartyPayload {
  role: FiscalPartyRole;
  name: string;
  documentNumber: string;
  stateRegistration: string;
  city: string;
  state: string;
}

export interface FiscalDocumentPayload {
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
  sourceFreightId: string | null;
  executionMode: FiscalExecutionMode;
  ciot: string;
  rntrc: string;
  payments: FiscalPaymentPayload[];
  parties: FiscalPartyPayload[];
}

export interface FiscalDocumentRow {
  id: string;
  display_id: string | number | null;
  document_type: FiscalDocumentType;
  model: string;
  series: string;
  number: string;
  access_key: string | null;
  status: FiscalDocumentStatus;
  issue_date: string;
  due_date: string | null;
  amount: string | number;
  origin_name: string | null;
  destination_name: string | null;
  taker_name: string | null;
  protocol: string | null;
  authorized_at: string | null;
  xml: string | null;
  dacte_url: string | null;
  provider: string | null;
  provider_document_id: string | null;
  idempotency_key: string | null;
  tax_data: Record<string, unknown> | null;
  emitter_snapshot: Record<string, unknown> | null;
  notes: string | null;
  source_freight_id: string | null;
  execution_mode: FiscalExecutionMode;
  ciot: string | null;
  rntrc: string | null;
  created_at: string;
  updated_at: string;
}

export interface FiscalPartyRow {
  id: string;
  display_id: string | number | null;
  fiscal_document_id: string;
  role: FiscalPartyRole;
  name: string;
  document_number: string | null;
  state_registration: string | null;
  city: string | null;
  state: string | null;
}

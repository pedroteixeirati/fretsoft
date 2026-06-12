export type FiscalDocumentType = 'cte' | 'cte_os' | 'mdfe';
export type FiscalDocumentStatus = 'draft' | 'processing' | 'authorized' | 'rejected' | 'canceled' | 'denied' | 'inutilized' | 'error';

export type FiscalExecutionMode = 'own_fleet' | 'third_party';

export interface CargoInsurancePolicy {
  id: string;
  displayId?: number;
  insuranceCompanyName: string;
  insuranceCompanyDocument: string;
  policyNumber: string;
  endorsementNumbers: string[];
  responsibleType: 'carrier' | 'shipper' | 'taker' | 'other';
  coverageType: 'rctr_c' | 'rcf_dc' | 'other';
  startsAt: string;
  endsAt: string;
  status: 'active' | 'inactive' | 'expired';
  isDefault: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CargoInsurancePolicyDraft = Omit<CargoInsurancePolicy, 'id' | 'displayId' | 'createdAt' | 'updatedAt'>;

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

export interface FiscalMdfeData {
  vehiclePlate?: string;
  vehicleRenavam?: string;
  vehicleUf?: string;
  vehicleTara?: number;
  condutorNome?: string;
  condutorCpf?: string;
  ufInicio?: string;
  ufFim?: string;
  percurso?: string[];
  cteKeys?: string[];
  municipioFimIbge?: string;
  pesoTotal?: number;
  valorTotal?: number;
  produtoPredominante?: string;
  produtoNcm?: string;
  contratanteNome?: string;
  contratanteDocumento?: string;
  cepCarregamento?: string;
  cepDescarregamento?: string;
  encerrado?: boolean;
  encerradoEm?: string;
  condutoresAdicionais?: Array<{ nome: string; cpf: string; adicionadoEm?: string }>;
}

export interface FiscalCteData {
  tomadorTipo?: 'remetente' | 'destinatario' | 'outros' | string;
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
  mdfeData: FiscalMdfeData;
  createdAt: string;
  updatedAt: string;
  parties: FiscalParty[];
  payments: FiscalPayment[];
  warnings?: string[];
}

export type FiscalDocumentDraft = Omit<FiscalDocument, 'id' | 'displayId' | 'createdAt' | 'updatedAt'>;

export interface FiscalCommunicationLog {
  id: string;
  fiscal_document_id?: string | null;
  fiscalDocumentId?: string | null;
  provider: string;
  operation: string;
  request_payload?: Record<string, unknown>;
  requestPayload?: Record<string, unknown>;
  response_payload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  http_status?: number | null;
  httpStatus?: number | null;
  error_message?: string | null;
  errorMessage?: string | null;
  duration_ms?: number | null;
  durationMs?: number | null;
  created_at?: string;
  createdAt?: string;
}

export interface FiscalEvent {
  id: string;
  fiscal_document_id?: string;
  fiscalDocumentId?: string;
  event_type?: string;
  eventType?: string;
  status: string;
  reason?: string | null;
  protocol?: string | null;
  xml?: string | null;
  created_by_user_id?: string | null;
  createdByUserId?: string | null;
  created_at?: string;
  createdAt?: string;
}

export interface FiscalCorrectionLetterDraft {
  correctedField: string;
  correctedValue: string;
  correctedGroup?: string;
  correctedGroupItemNumber?: string;
}

export interface FiscalMdfeDriverDraft {
  name: string;
  cpf: string;
}

export interface FiscalDraftFromFreight {
  existingDocumentId: string | null;
  draft: Partial<FiscalDocumentDraft> & { sourceFreightId: string };
}

export type FiscalNfeReceiptSource = 'upload' | 'email' | 'api' | 'focus';
export type FiscalNfeReceiptStatus = 'pending' | 'validated' | 'used' | 'ignored' | 'error';

export interface FiscalNfePartySnapshot {
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

export interface FiscalNfeTotalsSnapshot {
  invoiceAmount: number | null;
  productAmount: number | null;
  weight: number | null;
}

export interface FiscalNfeProductSnapshot {
  predominantProduct: string;
  ncm: string;
}

export interface FiscalNfeReceiptRow {
  id: string;
  display_id: number | string | null;
  tenant_id: string;
  source: FiscalNfeReceiptSource;
  status: FiscalNfeReceiptStatus;
  nfe_key: string;
  xml: string;
  sender_snapshot: FiscalNfePartySnapshot;
  recipient_snapshot: FiscalNfePartySnapshot;
  totals_snapshot: FiscalNfeTotalsSnapshot;
  product_snapshot: FiscalNfeProductSnapshot;
  issue_date: string | null;
  used_fiscal_document_id: string | null;
  used_payable_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FiscalNfeReceiptPayload {
  source: FiscalNfeReceiptSource;
  status: FiscalNfeReceiptStatus;
  nfeKey: string;
  xml: string;
  senderSnapshot: FiscalNfePartySnapshot;
  recipientSnapshot: FiscalNfePartySnapshot;
  totalsSnapshot: FiscalNfeTotalsSnapshot;
  productSnapshot: FiscalNfeProductSnapshot;
  issueDate: string;
  notes: string | null;
}

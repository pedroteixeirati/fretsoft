export type NfeReceiptStatus = 'pending' | 'validated' | 'used' | 'ignored' | 'error';
export type NfeReceiptSource = 'upload' | 'email' | 'api' | 'focus';

export interface NfePartySnapshot {
  name: string;
  documentNumber: string;
  city: string;
  state: string;
}

export interface NfeTotalsSnapshot {
  invoiceAmount: number | null;
  productAmount: number | null;
  weight: number | null;
}

export interface NfeProductSnapshot {
  predominantProduct: string;
  ncm: string;
}

export interface NfeReceipt {
  id: string;
  displayId?: number;
  source: NfeReceiptSource;
  status: NfeReceiptStatus;
  nfeKey: string;
  senderSnapshot: NfePartySnapshot;
  recipientSnapshot: NfePartySnapshot;
  totalsSnapshot: NfeTotalsSnapshot;
  productSnapshot: NfeProductSnapshot;
  issueDate: string;
  usedFiscalDocumentId: string;
  usedPayableId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const nfeReceiptStatusLabels: Record<NfeReceiptStatus, string> = {
  pending: 'Pendente',
  validated: 'Conferida',
  used: 'Lancada',
  ignored: 'Ignorada',
  error: 'Erro',
};

export interface GeneratePayablePayload {
  amount?: number;
  dueDate?: string;
  notes?: string;
}

// nNF ocupa as posicoes 26-34 (1-indexed) da chave de 44 digitos.
export function nfeNumberFromKey(nfeKey: string) {
  const digits = (nfeKey || '').replace(/\D/g, '');
  if (digits.length !== 44) return '';
  return String(Number(digits.slice(25, 34)));
}

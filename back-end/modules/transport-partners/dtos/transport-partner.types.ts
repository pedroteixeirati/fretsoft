export type TransportPartnerType = 'tac' | 'agregado';
export type TransportPartnerStatus = 'active' | 'inactive';
export type TransportPartnerReceiptMethod = 'pix' | 'bank_transfer' | 'both';

export interface TransportPartnerInput {
  name?: string | null;
  documentNumber?: string | null;
  partnerType?: TransportPartnerType | string | null;
  rntrc?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccount?: string | null;
  bankAccountType?: string | null;
  pixKey?: string | null;
  pixKeyType?: string | null;
  status?: TransportPartnerStatus | string | null;
  notes?: string | null;
}

export interface TransportPartnerPayload {
  name: string;
  documentNumber: string;
  partnerType: TransportPartnerType;
  rntrc: string;
  bankName: string;
  bankBranch: string;
  bankAccount: string;
  bankAccountType: string;
  pixKey: string;
  pixKeyType: string;
  status: TransportPartnerStatus;
  notes: string;
}

export interface TransportPartnerRow {
  id: string;
  display_id: string | number | null;
  tenant_id: string;
  name: string;
  document_number: string;
  partner_type: TransportPartnerType;
  rntrc: string | null;
  phone: string | null;
  receipt_method: TransportPartnerReceiptMethod | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_account: string | null;
  bank_account_type: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  status: TransportPartnerStatus;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by_user_id: string | null;
  approved_at: string | null;
  accepted_responsibility_at: string | null;
  accepted_lgpd_at: string | null;
  public_submitted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicTacRegistrationInput {
  name?: string | null;
  documentNumber?: string | null;
  rntrc?: string | null;
  phone?: string | null;
  receiptMethod?: TransportPartnerReceiptMethod | string | null;
  pixKey?: string | null;
  pixKeyType?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccount?: string | null;
  bankAccountType?: string | null;
  notes?: string | null;
  acceptedResponsibility?: boolean | null;
  acceptedLgpd?: boolean | null;
}

export interface PublicTacRegistrationPayload {
  name: string;
  documentNumber: string;
  rntrc: string;
  phone: string;
  receiptMethod: TransportPartnerReceiptMethod;
  pixKey: string;
  pixKeyType: string;
  bankName: string;
  bankBranch: string;
  bankAccount: string;
  bankAccountType: string;
  notes: string;
}

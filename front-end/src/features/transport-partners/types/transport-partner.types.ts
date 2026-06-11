export type TransportPartnerType = 'tac' | 'agregado';
export type TransportPartnerStatus = 'active' | 'inactive';

export interface TransportPartner {
  id: string;
  displayId?: number;
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

export type TransportPartnerDraft = Omit<TransportPartner, 'id' | 'displayId'>;

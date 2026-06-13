export type NfseStatus = 'draft' | 'processing' | 'authorized' | 'rejected' | 'canceled' | 'error';

export interface NfseDocument {
  id: string;
  displayId?: number;
  companyId: string;
  companyName: string;
  reference: string;
  status: NfseStatus;
  competenceMonth: string;
  serviceAmount: number;
  serviceDescription: string;
  issRate: number | null;
  issRetained: boolean;
  number: string;
  series: string;
  accessKey: string;
  protocol: string;
  authorizedAt: string;
  xmlUrl: string;
  pdfUrl: string;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface NfseCreatePayload {
  companyId: string;
  competenceMonth: string;
  serviceAmount: number;
  serviceDescription: string;
}

export const nfseStatusLabels: Record<NfseStatus, string> = {
  draft: 'Rascunho',
  processing: 'Processando',
  authorized: 'Autorizada',
  rejected: 'Rejeitada',
  canceled: 'Cancelada',
  error: 'Erro',
};

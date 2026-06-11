export type TacReceiptMethod = '' | 'pix' | 'bank_transfer' | 'both';

export interface PublicTacRegistrationPayload {
  name: string;
  documentNumber: string;
  rntrc: string;
  phone: string;
  receiptMethod: Exclude<TacReceiptMethod, ''>;
  pixKey: string;
  pixKeyType: string;
  bankName: string;
  bankBranch: string;
  bankAccount: string;
  bankAccountType: string;
  notes: string;
  acceptedResponsibility: boolean;
  acceptedLgpd: boolean;
}

export interface PublicTacRegistrationResponse {
  id: string;
  tenantName: string;
  name: string;
  documentNumber: string;
  status: 'pending' | 'approved' | 'rejected';
}

export async function submitPublicTacRegistration(tenantSlug: string, payload: PublicTacRegistrationPayload) {
  const response = await fetch(`/api/public/tenants/${encodeURIComponent(tenantSlug)}/tac-registration`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Nao foi possivel enviar o cadastro.');
  }

  return await response.json() as PublicTacRegistrationResponse;
}

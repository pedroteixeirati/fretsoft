export interface Revenue {
  id: string;
  displayId?: number;
  companyId: string;
  companyName: string;
  contractId: string;
  contractName: string;
  freightId?: string;
  novalogBillingId?: string;
  novalogBillingItemId?: string;
  competenceMonth: number;
  competenceYear: number;
  competenceLabel: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'billed' | 'partially_received' | 'received' | 'overdue' | 'canceled';
  sourceType: 'contract' | 'freight' | 'manual' | 'novalog_billing_item';
  receivedAmount: number;
  balanceAmount: number;
  paymentCount: number;
  lastPaymentAt?: string;
  chargeReference?: string;
  chargeGeneratedAt?: string;
  receivedAt?: string;
  createdAt: string;
}

export interface RevenuePayment {
  id: string;
  tenantId: string;
  revenueId: string;
  amount: number;
  paymentDate: string;
  notes: string;
  createdAt: string;
}

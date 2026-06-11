export type NovalogBillingStatus = 'draft' | 'open' | 'partially_received' | 'received' | 'overdue' | 'canceled';
export type NovalogBillingItemStatus = 'pending' | 'billed' | 'partially_received' | 'received' | 'overdue' | 'canceled';

export interface NovalogBillingItem {
  id: string;
  displayId?: number;
  billingId: string;
  fiscalDocumentId?: string;
  cteNumber: string;
  cteKey: string;
  issueDate: string;
  dueDate: string;
  originName: string;
  destinationName: string;
  amount: number;
  receivedAmount: number;
  balanceAmount: number;
  paymentCount: number;
  status: NovalogBillingItemStatus;
  receivedAt?: string;
  lastPaymentAt?: string;
  notes: string;
  linkedRevenueId?: string;
  createdAt: string;
}

export interface NovalogBilling {
  id: string;
  displayId?: number;
  companyId: string;
  companyName: string;
  billingDate: string;
  dueDate: string;
  status: NovalogBillingStatus;
  notes: string;
  cteCount: number;
  totalAmount: number;
  receivedAmount: number;
  openAmount: number;
  overdueAmount: number;
  createdAt: string;
  items?: NovalogBillingItem[];
}

export interface NovalogBillingItemDraft {
  id: string;
  cteNumber: string;
  cteKey: string;
  issueDate: string;
  dueDate: string;
  originName: string;
  destinationName: string;
  amount: string;
  notes: string;
}

export interface NovalogBillingPayload {
  companyId: string;
  billingDate: string;
  dueDate?: string;
  notes?: string;
  items: Array<{
    cteNumber: string;
    cteKey?: string;
    issueDate?: string;
    dueDate?: string;
    originName?: string;
    destinationName?: string;
    amount: number;
    notes?: string;
  }>;
}

export interface NovalogBillingItemUpdatePayload {
  cteNumber: string;
  cteKey?: string;
  issueDate?: string;
  dueDate?: string;
  originName?: string;
  destinationName?: string;
  amount: number;
  notes?: string;
}

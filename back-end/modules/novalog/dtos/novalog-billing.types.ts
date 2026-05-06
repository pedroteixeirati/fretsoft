export type NovalogBillingStatus = 'draft' | 'open' | 'partially_received' | 'received' | 'overdue' | 'canceled';
export type NovalogBillingItemStatus = 'pending' | 'billed' | 'partially_received' | 'received' | 'overdue' | 'canceled';

export type NovalogBillingItemInput = {
  cteNumber?: string | null;
  cteKey?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  originName?: string | null;
  destinationName?: string | null;
  amount?: number | string | null;
  notes?: string | null;
};

export type NovalogBillingInput = {
  companyId?: string | null;
  billingDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  items?: NovalogBillingItemInput[] | null;
};

export type NovalogBillingPayload = {
  companyId: string;
  companyName: string;
  billingDate: string;
  dueDate: string;
  notes: string | null;
  items: NovalogBillingItemPayload[];
};

export type NovalogBillingItemPayload = {
  cteNumber: string;
  cteKey: string | null;
  issueDate: string | null;
  dueDate: string;
  originName: string | null;
  destinationName: string | null;
  amount: number;
  notes: string | null;
};

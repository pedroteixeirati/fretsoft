export interface Payable {
  id: string;
  displayId?: number;
  sourceType: 'expense' | 'manual';
  sourceId?: string | null;
  description: string;
  providerName: string;
  vehicleId?: string | null;
  vehicleName?: string;
  contractId?: string | null;
  amount: number;
  dueDate: string;
  status: 'open' | 'paid' | 'overdue' | 'canceled';
  paidAt?: string;
  paymentMethod?: string;
  proofUrl?: string;
  notes?: string;
  documentNumber?: string;
  invoiceNumber?: string;
  invoiceStatus?: 'informed' | 'missing' | 'not_informed';
  referenceMonth?: string;
  importBatchId?: string | null;
  importSheetName?: string;
  importRowNumber?: number | null;
}

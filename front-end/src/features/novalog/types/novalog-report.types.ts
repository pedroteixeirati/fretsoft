export interface NovalogReportPayment {
  id: string;
  revenueId: string;
  billingId?: string;
  billingItemId?: string;
  companyId: string;
  companyName: string;
  cteNumber: string;
  amount: number;
  paymentDate: string;
  notes: string;
}

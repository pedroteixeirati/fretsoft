import { apiFileRequest, apiRequest } from '../../../shared/lib/api-client';
import type { NovalogReportPayment } from '../types/novalog-report.types';

type ExportNovalogReportParams = {
  type: 'tab' | 'complete';
  tab: 'balance' | 'receipts' | 'operations';
  referenceMonth: string;
  startDate: string;
  endDate: string;
  companyName: string;
  status: string;
};

export const novalogReportsApi = {
  listPayments: () => apiRequest<NovalogReportPayment[]>('/api/novalog/reports/payments'),
  exportWorkbook: (params: ExportNovalogReportParams) => {
    const searchParams = new URLSearchParams(params);
    return apiFileRequest(`/api/novalog/reports/export?${searchParams.toString()}`);
  },
};

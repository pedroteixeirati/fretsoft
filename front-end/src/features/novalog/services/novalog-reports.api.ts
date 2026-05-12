import { apiRequest } from '../../../shared/lib/api-client';
import type { NovalogReportPayment } from '../types/novalog-report.types';

export const novalogReportsApi = {
  listPayments: () => apiRequest<NovalogReportPayment[]>('/api/novalog/reports/payments'),
};

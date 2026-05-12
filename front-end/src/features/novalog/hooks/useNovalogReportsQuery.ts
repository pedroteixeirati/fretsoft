import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { novalogReportsApi } from '../services/novalog-reports.api';

export function useNovalogReportPaymentsQuery(enabled: boolean) {
  const query = useQuery({
    queryKey: queryKeys.novalogReports.payments(),
    queryFn: novalogReportsApi.listPayments,
    enabled,
  });

  return {
    payments: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

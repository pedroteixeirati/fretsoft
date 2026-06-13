import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { recurringPayablesApi } from '../services/recurring-payables.api';

interface UseRecurringPayablesQueryOptions {
  enabled: boolean;
}

export function useRecurringPayablesQuery({ enabled }: UseRecurringPayablesQueryOptions) {
  const recurringPayablesQuery = useQuery({
    queryKey: queryKeys.recurringPayables.list(),
    queryFn: recurringPayablesApi.list,
    enabled,
  });

  const recurringPayables = useMemo(() => recurringPayablesQuery.data ?? [], [recurringPayablesQuery.data]);

  return {
    recurringPayables,
    isLoading: recurringPayablesQuery.isLoading,
    error: recurringPayablesQuery.error ?? null,
    refetch: recurringPayablesQuery.refetch,
  };
}

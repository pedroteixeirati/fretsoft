import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { novalogBillingsApi } from '../services/novalog-billings.api';
import { getNovalogLiveQueryOptions } from './novalogLiveQueryOptions';

export function useNovalogBillingsQuery(enabled: boolean) {
  const query = useQuery({
    queryKey: queryKeys.novalogBillings.list(),
    queryFn: novalogBillingsApi.list,
    enabled,
    ...getNovalogLiveQueryOptions(enabled),
  });

  const billings = useMemo(() => query.data ?? [], [query.data]);

  return {
    billings,
    isLoading: query.isLoading,
    error: query.error,
  };
}

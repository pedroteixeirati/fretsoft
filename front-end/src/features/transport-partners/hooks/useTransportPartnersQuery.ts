import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { transportPartnersApi } from '../services/transport-partners.api';

export function useTransportPartnersQuery(enabled: boolean) {
  const query = useQuery({
    queryKey: queryKeys.transportPartners.list(),
    queryFn: transportPartnersApi.list,
    enabled,
  });

  const partners = useMemo(() => query.data ?? [], [query.data]);

  return {
    partners,
    isLoading: query.isLoading,
    error: query.error ?? null,
  };
}

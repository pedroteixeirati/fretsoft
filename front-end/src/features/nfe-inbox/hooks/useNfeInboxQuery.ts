import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { nfeInboxApi } from '../services/nfe-inbox.api';

interface UseNfeInboxQueryOptions {
  enabled: boolean;
}

export function useNfeInboxQuery({ enabled }: UseNfeInboxQueryOptions) {
  const receiptsQuery = useQuery({
    queryKey: queryKeys.nfeInbox.list(),
    queryFn: nfeInboxApi.list,
    enabled,
  });

  const receipts = useMemo(() => receiptsQuery.data ?? [], [receiptsQuery.data]);

  return {
    receipts,
    isLoading: receiptsQuery.isLoading,
    error: receiptsQuery.error ?? null,
    refetch: receiptsQuery.refetch,
  };
}

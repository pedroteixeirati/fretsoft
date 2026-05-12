import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { novalogApi } from '../services/novalog.api';

export function useNovalogQuery(enabled: boolean, referenceMonth?: string) {
  const query = useQuery({
    queryKey: queryKeys.novalog.list({ referenceMonth }),
    queryFn: () => novalogApi.list({ referenceMonth }),
    enabled: enabled && Boolean(referenceMonth),
  });

  const entries = useMemo(() => {
    const items = query.data ?? [];

    return [...items].sort((left, right) => (left.displayId ?? Number.MAX_SAFE_INTEGER) - (right.displayId ?? Number.MAX_SAFE_INTEGER));
  }, [query.data]);

  return {
    entries,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

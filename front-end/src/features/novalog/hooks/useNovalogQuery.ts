import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { novalogApi } from '../services/novalog.api';

export function useNovalogQuery(enabled: boolean, referenceMonth?: string) {
  const query = useQuery({
    queryKey: queryKeys.novalog.list({ referenceMonth }),
    queryFn: () => novalogApi.list({ referenceMonth }),
    enabled,
  });

  const entries = useMemo(() => {
    const items = query.data ?? [];

    return [...items].sort((left, right) => {
      if (left.createdAt && right.createdAt) {
        return right.createdAt.localeCompare(left.createdAt);
      }

      return (right.displayId ?? 0) - (left.displayId ?? 0);
    });
  }, [query.data]);

  return {
    entries,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

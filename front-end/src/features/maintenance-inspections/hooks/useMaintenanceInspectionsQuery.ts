import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { maintenanceInspectionsApi } from '../services/maintenance-inspections.api';

interface UseMaintenanceInspectionsQueryOptions {
  enabled: boolean;
}

export function useMaintenanceInspectionsQuery({ enabled }: UseMaintenanceInspectionsQueryOptions) {
  const inspectionsQuery = useQuery({
    queryKey: queryKeys.maintenanceInspections.list(),
    queryFn: maintenanceInspectionsApi.list,
    enabled,
  });

  const inspections = useMemo(() => inspectionsQuery.data ?? [], [inspectionsQuery.data]);

  return {
    inspections,
    isLoading: inspectionsQuery.isLoading,
    error: inspectionsQuery.error ?? null,
    refetch: inspectionsQuery.refetch,
  };
}

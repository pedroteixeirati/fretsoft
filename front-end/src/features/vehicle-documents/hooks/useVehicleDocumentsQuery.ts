import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { vehicleDocumentsApi } from '../services/vehicle-documents.api';

interface UseVehicleDocumentsQueryOptions {
  enabled: boolean;
}

export function useVehicleDocumentsQuery({ enabled }: UseVehicleDocumentsQueryOptions) {
  const documentsQuery = useQuery({
    queryKey: queryKeys.vehicleDocuments.list(),
    queryFn: vehicleDocumentsApi.list,
    enabled,
  });

  const documents = useMemo(() => documentsQuery.data ?? [], [documentsQuery.data]);

  return {
    documents,
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error ?? null,
    refetch: documentsQuery.refetch,
  };
}

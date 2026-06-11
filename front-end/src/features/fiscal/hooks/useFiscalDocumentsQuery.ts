import { useQuery } from '@tanstack/react-query';
import { fiscalApi } from '../services/fiscal.api';

export const fiscalQueryKeys = {
  documents: ['fiscal', 'documents'] as const,
};

export function useFiscalDocumentsQuery(enabled = true) {
  const documentsQuery = useQuery({
    queryKey: fiscalQueryKeys.documents,
    queryFn: fiscalApi.listDocuments,
    enabled,
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
  };
}

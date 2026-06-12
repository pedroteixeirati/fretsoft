import { useQuery } from '@tanstack/react-query';
import { fiscalApi } from '../services/fiscal.api';

export const fiscalQueryKeys = {
  documents: ['fiscal', 'documents'] as const,
  cargoInsurancePolicies: ['fiscal', 'cargo-insurance-policies'] as const,
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

export function useCargoInsurancePoliciesQuery(enabled = true) {
  const policiesQuery = useQuery({
    queryKey: fiscalQueryKeys.cargoInsurancePolicies,
    queryFn: fiscalApi.listCargoInsurancePolicies,
    enabled,
  });

  return {
    policies: policiesQuery.data || [],
    isLoading: policiesQuery.isLoading,
    error: policiesQuery.error,
  };
}

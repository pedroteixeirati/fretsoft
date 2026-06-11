import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fiscalApi } from '../services/fiscal.api';
import { fiscalQueryKeys } from './useFiscalDocumentsQuery';
import type { FiscalDocumentDraft } from '../types/fiscal.types';

export function useFiscalDocumentMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: fiscalQueryKeys.documents });

  const createDocument = useMutation({
    mutationFn: (payload: FiscalDocumentDraft) => fiscalApi.createDocument(payload),
    onSuccess: invalidate,
  });

  const updateDocument = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FiscalDocumentDraft }) => fiscalApi.updateDocument(id, payload),
    onSuccess: invalidate,
  });

  const deleteDocument = useMutation({
    mutationFn: (id: string) => fiscalApi.removeDocument(id),
    onSuccess: invalidate,
  });

  return {
    createDocument,
    updateDocument,
    deleteDocument,
    isSubmitting: createDocument.isPending || updateDocument.isPending || deleteDocument.isPending,
  };
}

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

  const emitDocument = useMutation({
    mutationFn: (id: string) => fiscalApi.emitDocument(id),
    onSuccess: invalidate,
  });

  const syncDocument = useMutation({
    mutationFn: (id: string) => fiscalApi.syncDocument(id),
    onSuccess: invalidate,
  });

  return {
    createDocument,
    updateDocument,
    emitDocument,
    syncDocument,
    deleteDocument,
    isSubmitting: createDocument.isPending || updateDocument.isPending || emitDocument.isPending || syncDocument.isPending || deleteDocument.isPending,
  };
}

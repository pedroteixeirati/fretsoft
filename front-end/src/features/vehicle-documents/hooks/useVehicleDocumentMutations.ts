import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { vehicleDocumentsApi } from '../services/vehicle-documents.api';
import { VehicleDocument } from '../types/vehicle-document.types';

export type VehicleDocumentPayload = Pick<
  VehicleDocument,
  'vehicleId' | 'documentType' | 'identifier' | 'amount' | 'dueDate' | 'status' | 'notes'
>;

export function useVehicleDocumentMutations() {
  const queryClient = useQueryClient();

  const invalidateDocuments = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.vehicleDocuments.all });
  };

  const createDocument = useMutation({
    mutationFn: (payload: VehicleDocumentPayload) => vehicleDocumentsApi.create(payload as Omit<VehicleDocument, 'id'>),
    onSuccess: invalidateDocuments,
  });

  const updateDocument = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VehicleDocumentPayload }) =>
      vehicleDocumentsApi.update(id, payload),
    onSuccess: invalidateDocuments,
  });

  const deleteDocument = useMutation({
    mutationFn: (id: string) => vehicleDocumentsApi.remove(id),
    onSuccess: invalidateDocuments,
  });

  return {
    createDocument,
    updateDocument,
    deleteDocument,
    isSubmitting: createDocument.isPending || updateDocument.isPending || deleteDocument.isPending,
  };
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fiscalApi } from '../services/fiscal.api';
import { fiscalQueryKeys } from './useFiscalDocumentsQuery';
import type { CargoInsurancePolicyDraft, FiscalCorrectionLetterDraft, FiscalDocumentDraft, FiscalMdfeDriverDraft, FiscalNfeReceiptStatus } from '../types/fiscal.types';

export function useFiscalDocumentMutations() {
  const queryClient = useQueryClient();
  const invalidateDocuments = () => queryClient.invalidateQueries({ queryKey: fiscalQueryKeys.documents });
  const invalidateNfeReceipts = () => queryClient.invalidateQueries({ queryKey: fiscalQueryKeys.nfeReceipts });
  const invalidateCargoInsurancePolicies = () => queryClient.invalidateQueries({ queryKey: fiscalQueryKeys.cargoInsurancePolicies });

  const createDocument = useMutation({
    mutationFn: (payload: FiscalDocumentDraft) => fiscalApi.createDocument(payload),
    onSuccess: invalidateDocuments,
  });

  const updateDocument = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FiscalDocumentDraft }) => fiscalApi.updateDocument(id, payload),
    onSuccess: invalidateDocuments,
  });

  const deleteDocument = useMutation({
    mutationFn: (id: string) => fiscalApi.removeDocument(id),
    onSuccess: invalidateDocuments,
  });

  const importNfeReceipt = useMutation({
    mutationFn: (payload: { xml: string; source?: 'upload'; notes?: string }) => fiscalApi.importNfeReceipt(payload),
    onSuccess: invalidateNfeReceipts,
  });

  const updateNfeReceiptStatus = useMutation({
    mutationFn: ({ id, status, usedFiscalDocumentId }: { id: string; status: FiscalNfeReceiptStatus; usedFiscalDocumentId?: string }) => fiscalApi.updateNfeReceiptStatus(id, { status, usedFiscalDocumentId }),
    onSuccess: () => {
      invalidateNfeReceipts();
      invalidateDocuments();
    },
  });

  const emitDocument = useMutation({
    mutationFn: (id: string) => fiscalApi.emitDocument(id),
    onSuccess: invalidateDocuments,
  });

  const syncDocument = useMutation({
    mutationFn: (id: string) => fiscalApi.syncDocument(id),
    onSuccess: invalidateDocuments,
  });

  const closeDocument = useMutation({
    mutationFn: (id: string) => fiscalApi.closeDocument(id),
    onSuccess: invalidateDocuments,
  });

  const cancelDocument = useMutation({
    mutationFn: ({ id, justification }: { id: string; justification: string }) => fiscalApi.cancelDocument(id, justification),
    onSuccess: invalidateDocuments,
  });

  const sendCorrectionLetter = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FiscalCorrectionLetterDraft }) => fiscalApi.sendCorrectionLetter(id, payload),
    onSuccess: invalidateDocuments,
  });

  const addMdfeDriver = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FiscalMdfeDriverDraft }) => fiscalApi.addMdfeDriver(id, payload),
    onSuccess: invalidateDocuments,
  });

  const resendDocument = useMutation({
    mutationFn: ({ id, emails }: { id: string; emails: string[] }) => fiscalApi.resendDocument(id, emails),
    onSuccess: invalidateDocuments,
  });

  const createCargoInsurancePolicy = useMutation({
    mutationFn: (payload: CargoInsurancePolicyDraft) => fiscalApi.createCargoInsurancePolicy(payload),
    onSuccess: invalidateCargoInsurancePolicies,
  });

  const updateCargoInsurancePolicy = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CargoInsurancePolicyDraft }) => fiscalApi.updateCargoInsurancePolicy(id, payload),
    onSuccess: invalidateCargoInsurancePolicies,
  });

  const deleteCargoInsurancePolicy = useMutation({
    mutationFn: (id: string) => fiscalApi.removeCargoInsurancePolicy(id),
    onSuccess: invalidateCargoInsurancePolicies,
  });

  return {
    createDocument,
    updateDocument,
    emitDocument,
    syncDocument,
    closeDocument,
    cancelDocument,
    sendCorrectionLetter,
    addMdfeDriver,
    resendDocument,
    deleteDocument,
    importNfeReceipt,
    updateNfeReceiptStatus,
    createCargoInsurancePolicy,
    updateCargoInsurancePolicy,
    deleteCargoInsurancePolicy,
    isSubmitting:
      createDocument.isPending ||
      updateDocument.isPending ||
      emitDocument.isPending ||
      syncDocument.isPending ||
      closeDocument.isPending ||
      cancelDocument.isPending ||
      sendCorrectionLetter.isPending ||
      addMdfeDriver.isPending ||
      resendDocument.isPending ||
      deleteDocument.isPending ||
      importNfeReceipt.isPending ||
      updateNfeReceiptStatus.isPending ||
      createCargoInsurancePolicy.isPending ||
      updateCargoInsurancePolicy.isPending ||
      deleteCargoInsurancePolicy.isPending,
  };
}

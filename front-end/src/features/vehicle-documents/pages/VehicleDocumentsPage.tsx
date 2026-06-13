import React, { useMemo, useState } from 'react';
import { getErrorMessage, resolveFieldError } from '../../../lib/errors';
import { canAccess } from '../../../lib/permissions';
import { isValidDateInput } from '../../../lib/validation';
import { useFirebase } from '../../../context/FirebaseContext';
import { clearFieldError } from '../../../shared/forms';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import { useVehiclesQuery } from '../../vehicles/hooks/useVehiclesQuery';
import { useVehicleDocumentsQuery } from '../hooks/useVehicleDocumentsQuery';
import { useVehicleDocumentMutations } from '../hooks/useVehicleDocumentMutations';
import { useVehicleDocumentForm } from '../hooks/useVehicleDocumentForm';
import VehicleDocumentsHeader from '../components/VehicleDocumentsHeader';
import VehicleDocumentsFilters from '../components/VehicleDocumentsFilters';
import VehicleDocumentsList from '../components/VehicleDocumentsList';
import VehicleDocumentFormModal from '../components/VehicleDocumentFormModal';
import { VehicleDocument, getVehicleDocumentDueState } from '../types/vehicle-document.types';

export default function VehicleDocumentsPage() {
  const { userProfile } = useFirebase();
  const canCreate = canAccess(userProfile, 'vehicleDocuments', 'create');
  const canUpdate = canAccess(userProfile, 'vehicleDocuments', 'update');
  const canDelete = canAccess(userProfile, 'vehicleDocuments', 'delete');

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dueStateFilter, setDueStateFilter] = useState('all');
  const [deletingDocument, setDeletingDocument] = useState<VehicleDocument | null>(null);

  const { documents, isLoading: loading, error: loadQueryError } = useVehicleDocumentsQuery({
    enabled: Boolean(userProfile),
  });
  const { vehicles } = useVehiclesQuery({ enabled: Boolean(userProfile) });
  const { createDocument, updateDocument, deleteDocument, isSubmitting } = useVehicleDocumentMutations();
  const {
    isModalOpen,
    editingDocument,
    formData,
    setFormData,
    fieldErrors,
    setFieldErrors,
    submitError,
    setSubmitError,
    submitSuccess,
    setSubmitSuccess,
    openCreate,
    openEdit,
    closeModal,
  } = useVehicleDocumentForm();

  const loadError = loadQueryError
    ? getErrorMessage(loadQueryError, 'Nao foi possivel carregar os documentos da frota.')
    : '';

  const filteredDocuments = useMemo(
    () =>
      documents.filter((document) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          !search ||
          document.vehiclePlate.toLowerCase().includes(search) ||
          document.vehicleName.toLowerCase().includes(search) ||
          document.identifier.toLowerCase().includes(search);

        const matchesType = typeFilter === 'all' || document.documentType === typeFilter;

        const matchesDueState = (() => {
          if (dueStateFilter === 'all') return document.status === 'active';
          if (dueStateFilter === 'archived') return document.status === 'archived';
          return document.status === 'active' && getVehicleDocumentDueState(document.dueDate) === dueStateFilter;
        })();

        return matchesSearch && matchesType && matchesDueState;
      }),
    [documents, searchTerm, typeFilter, dueStateFilter],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});

    const nextFieldErrors: typeof fieldErrors = {};

    if (!formData.vehicleId) nextFieldErrors.vehicleId = 'Selecione o veiculo do documento.';
    if (!isValidDateInput(formData.dueDate)) nextFieldErrors.dueDate = 'Informe uma data de vencimento valida.';
    if (formData.amount.trim() !== '' && (!Number.isFinite(Number(formData.amount)) || Number(formData.amount) < 0)) {
      nextFieldErrors.amount = 'O valor deve ser zero ou maior.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    const payload = {
      vehicleId: formData.vehicleId,
      documentType: formData.documentType,
      identifier: formData.identifier.trim(),
      amount: formData.amount.trim() === '' ? null : Number(formData.amount),
      dueDate: formData.dueDate,
      status: formData.status,
      notes: formData.notes.trim(),
    };

    try {
      if (editingDocument) {
        await updateDocument.mutateAsync({ id: editingDocument.id, payload });
      } else {
        await createDocument.mutateAsync(payload);
      }

      setSubmitSuccess(editingDocument ? 'Documento atualizado com sucesso.' : 'Documento cadastrado com sucesso.');
      closeModal();
    } catch (error) {
      const fieldError = resolveFieldError(error, {
        fieldMap: {
          vehicleId: 'vehicleId',
          documentType: 'documentType',
          identifier: 'identifier',
          amount: 'amount',
          dueDate: 'dueDate',
          status: 'status',
          notes: 'notes',
        },
      });

      if (fieldError?.field) {
        setFieldErrors({ [fieldError.field]: fieldError.message });
        return;
      }

      setSubmitError(getErrorMessage(error, 'Nao foi possivel salvar o documento da frota.'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDocument) return;

    setSubmitError('');
    setSubmitSuccess('');
    try {
      await deleteDocument.mutateAsync(deletingDocument.id);
      setSubmitSuccess('Documento excluido com sucesso.');
      setDeletingDocument(null);
    } catch (error) {
      setDeletingDocument(null);
      setSubmitError(getErrorMessage(error, 'Nao foi possivel excluir o documento da frota.'));
    }
  };

  const feedbackMessage = submitError || loadError || submitSuccess;
  const feedbackIsError = Boolean(submitError || loadError);

  return (
    <div className="space-y-10">
      <VehicleDocumentsHeader canCreate={canCreate} onCreate={openCreate} />

      {feedbackMessage ? (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
            feedbackIsError
              ? 'border-error/20 bg-error/5 text-error'
              : 'border-primary/20 bg-primary/5 text-primary'
          }`}
        >
          {feedbackMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12">
          <VehicleDocumentsFilters
            searchTerm={searchTerm}
            typeFilter={typeFilter}
            dueStateFilter={dueStateFilter}
            onSearchChange={setSearchTerm}
            onTypeChange={setTypeFilter}
            onDueStateChange={setDueStateFilter}
          />
        </div>

        <VehicleDocumentsList
          documents={filteredDocuments}
          loading={loading}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={openEdit}
          onDelete={setDeletingDocument}
        />
      </div>

      <VehicleDocumentFormModal
        isOpen={isModalOpen}
        editing={Boolean(editingDocument)}
        submitError={submitError}
        fieldErrors={fieldErrors}
        isSubmitting={isSubmitting}
        formData={formData}
        vehicles={vehicles}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={setFormData}
        onClearFieldError={(field) => setFieldErrors((current) => clearFieldError(current, field))}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingDocument)}
        title="Excluir documento"
        message={
          deletingDocument
            ? `Tem certeza que deseja excluir este documento do veiculo ${deletingDocument.vehiclePlate}? Esta acao nao pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        variant="danger"
        isLoading={deleteDocument.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingDocument(null)}
      />
    </div>
  );
}

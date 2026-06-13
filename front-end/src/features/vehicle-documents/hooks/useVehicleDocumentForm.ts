import { useState } from 'react';
import { FormFieldErrors } from '../../../lib/errors';
import { VehicleDocument, VehicleDocumentType } from '../types/vehicle-document.types';

export type VehicleDocumentFormData = {
  vehicleId: string;
  documentType: VehicleDocumentType;
  identifier: string;
  amount: string;
  dueDate: string;
  status: VehicleDocument['status'];
  notes: string;
};

export type VehicleDocumentFormField =
  | 'vehicleId'
  | 'documentType'
  | 'identifier'
  | 'amount'
  | 'dueDate'
  | 'status'
  | 'notes';

export const defaultVehicleDocumentFormData: VehicleDocumentFormData = {
  vehicleId: '',
  documentType: 'ipva',
  identifier: '',
  amount: '',
  dueDate: '',
  status: 'active',
  notes: '',
};

export function useVehicleDocumentForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<VehicleDocument | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<VehicleDocumentFormField>>({});
  const [formData, setFormData] = useState<VehicleDocumentFormData>(defaultVehicleDocumentFormData);

  const openCreate = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setEditingDocument(null);
    setFormData(defaultVehicleDocumentFormData);
    setIsModalOpen(true);
  };

  const openEdit = (document: VehicleDocument) => {
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setEditingDocument(document);
    setFormData({
      vehicleId: document.vehicleId,
      documentType: document.documentType,
      identifier: document.identifier || '',
      amount: document.amount !== null && document.amount !== undefined ? String(document.amount) : '',
      dueDate: document.dueDate || '',
      status: document.status,
      notes: document.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingDocument(null);
    setFormData(defaultVehicleDocumentFormData);
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setIsModalOpen(false);
  };

  return {
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
  };
}

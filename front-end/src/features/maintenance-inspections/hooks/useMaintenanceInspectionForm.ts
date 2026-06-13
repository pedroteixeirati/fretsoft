import { useState } from 'react';
import { FormFieldErrors } from '../../../lib/errors';
import {
  MaintenanceInspection,
  MaintenanceInspectionResult,
  MaintenanceInspectionStatus,
  defaultPreventiveChecklist,
} from '../types/maintenance-inspection.types';

export interface InspectionItemFormData {
  label: string;
  result: MaintenanceInspectionResult;
  observation: string;
}

export type MaintenanceInspectionFormData = {
  vehicleId: string;
  status: MaintenanceInspectionStatus;
  inspectedOn: string;
  odometer: string;
  mechanicName: string;
  nextDueOn: string;
  nextDueKm: string;
  notes: string;
  items: InspectionItemFormData[];
};

export type MaintenanceInspectionFormField =
  | 'vehicleId'
  | 'status'
  | 'inspectedOn'
  | 'odometer'
  | 'mechanicName'
  | 'nextDueOn'
  | 'nextDueKm'
  | 'notes'
  | 'items';

export function createDefaultChecklistItems(): InspectionItemFormData[] {
  return defaultPreventiveChecklist.map((label) => ({ label, result: 'ok', observation: '' }));
}

export function createEmptyChecklistItem(): InspectionItemFormData {
  return { label: '', result: 'ok', observation: '' };
}

export const defaultInspectionFormData: MaintenanceInspectionFormData = {
  vehicleId: '',
  status: 'completed',
  inspectedOn: '',
  odometer: '',
  mechanicName: '',
  nextDueOn: '',
  nextDueKm: '',
  notes: '',
  items: createDefaultChecklistItems(),
};

export function useMaintenanceInspectionForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<MaintenanceInspection | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<MaintenanceInspectionFormField>>({});
  const [formData, setFormData] = useState<MaintenanceInspectionFormData>(defaultInspectionFormData);

  const openCreate = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setEditingInspection(null);
    setFormData({ ...defaultInspectionFormData, items: createDefaultChecklistItems() });
    setIsModalOpen(true);
  };

  const openEdit = (inspection: MaintenanceInspection) => {
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setEditingInspection(inspection);
    setFormData({
      vehicleId: inspection.vehicleId,
      status: inspection.status,
      inspectedOn: inspection.inspectedOn || '',
      odometer: inspection.odometer !== null && inspection.odometer !== undefined ? String(inspection.odometer) : '',
      mechanicName: inspection.mechanicName || '',
      nextDueOn: inspection.nextDueOn || '',
      nextDueKm: inspection.nextDueKm !== null && inspection.nextDueKm !== undefined ? String(inspection.nextDueKm) : '',
      notes: inspection.notes || '',
      items: inspection.items.length
        ? inspection.items.map((item) => ({ label: item.label, result: item.result, observation: item.observation || '' }))
        : createDefaultChecklistItems(),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingInspection(null);
    setFormData(defaultInspectionFormData);
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setIsModalOpen(false);
  };

  return {
    isModalOpen,
    editingInspection,
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

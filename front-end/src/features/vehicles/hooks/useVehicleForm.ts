import { useState } from 'react';
import { FormFieldErrors } from '../../../lib/errors';
import { Vehicle } from '../types/vehicle.types';

export interface VehicleFormData {
  name: string;
  plate: string;
  driver: string;
  type: string;
  km: number;
  nextMaintenance: string;
  status: Vehicle['status'];
}

export type VehicleFormField = 'name' | 'plate' | 'driver' | 'type' | 'km' | 'nextMaintenance' | 'status';

export const defaultVehicleFormData: VehicleFormData = {
  name: '',
  plate: '',
  driver: '',
  type: 'Carga Pesada',
  km: 0,
  nextMaintenance: '',
  status: 'active',
};

export function useVehicleForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors<VehicleFormField>>({});
  const [formData, setFormData] = useState<VehicleFormData>(defaultVehicleFormData);

  const openCreate = () => {
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setEditingVehicle(null);
    setFormData(defaultVehicleFormData);
    setIsModalOpen(true);
  };

  const openEdit = (vehicle: Vehicle) => {
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      plate: vehicle.plate,
      driver: vehicle.driver,
      type: vehicle.type,
      km: vehicle.km,
      nextMaintenance: vehicle.nextMaintenance || '',
      status: vehicle.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingVehicle(null);
    setFormData(defaultVehicleFormData);
    setSubmitError('');
    setSubmitSuccess('');
    setFieldErrors({});
    setIsModalOpen(false);
  };

  return {
    isModalOpen,
    editingVehicle,
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

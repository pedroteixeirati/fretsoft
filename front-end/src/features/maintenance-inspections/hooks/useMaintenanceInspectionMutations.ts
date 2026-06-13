import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { maintenanceInspectionsApi } from '../services/maintenance-inspections.api';
import { MaintenanceInspection } from '../types/maintenance-inspection.types';

export type MaintenanceInspectionPayload = Pick<
  MaintenanceInspection,
  'vehicleId' | 'status' | 'inspectedOn' | 'odometer' | 'mechanicName' | 'nextDueOn' | 'nextDueKm' | 'notes' | 'items'
>;

export function useMaintenanceInspectionMutations() {
  const queryClient = useQueryClient();

  const invalidateInspections = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceInspections.all });
  };

  const createInspection = useMutation({
    mutationFn: (payload: MaintenanceInspectionPayload) =>
      maintenanceInspectionsApi.create(payload as Omit<MaintenanceInspection, 'id'>),
    onSuccess: invalidateInspections,
  });

  const updateInspection = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MaintenanceInspectionPayload }) =>
      maintenanceInspectionsApi.update(id, payload),
    onSuccess: invalidateInspections,
  });

  const deleteInspection = useMutation({
    mutationFn: (id: string) => maintenanceInspectionsApi.remove(id),
    onSuccess: invalidateInspections,
  });

  return {
    createInspection,
    updateInspection,
    deleteInspection,
    isSubmitting: createInspection.isPending || updateInspection.isPending || deleteInspection.isPending,
  };
}

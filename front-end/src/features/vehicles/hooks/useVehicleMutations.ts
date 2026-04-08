import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Vehicle } from '../types/vehicle.types';
import { queryKeys } from '../../../shared/lib/query-keys';
import { vehiclesApi } from '../services/vehicles.api';

export function useVehicleMutations() {
  const queryClient = useQueryClient();

  const invalidateVehicles = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.all });
  };

  const createVehicle = useMutation({
    mutationFn: (payload: Omit<Vehicle, 'id'>) => vehiclesApi.create(payload),
    onSuccess: invalidateVehicles,
  });

  const updateVehicle = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<Vehicle, 'id'>> }) =>
      vehiclesApi.update(id, payload),
    onSuccess: invalidateVehicles,
  });

  const deleteVehicle = useMutation({
    mutationFn: (id: string) => vehiclesApi.remove(id),
    onSuccess: invalidateVehicles,
  });

  return {
    createVehicle,
    updateVehicle,
    deleteVehicle,
    isSubmitting: createVehicle.isPending || updateVehicle.isPending || deleteVehicle.isPending,
  };
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { serviceOrdersApi } from '../services/service-orders.api';
import { ServiceOrder } from '../types/service-order.types';

export type ServiceOrderPayload = Pick<
  ServiceOrder,
  'vehicleId' | 'status' | 'openedOn' | 'closedOn' | 'odometer' | 'providerName' | 'description' | 'notes' | 'items'
>;

export function useServiceOrderMutations() {
  const queryClient = useQueryClient();

  const invalidateServiceOrders = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.serviceOrders.all });
  };

  const createServiceOrder = useMutation({
    mutationFn: (payload: ServiceOrderPayload) => serviceOrdersApi.create(payload as Omit<ServiceOrder, 'id'>),
    onSuccess: invalidateServiceOrders,
  });

  const updateServiceOrder = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ServiceOrderPayload }) =>
      serviceOrdersApi.update(id, payload),
    onSuccess: invalidateServiceOrders,
  });

  const deleteServiceOrder = useMutation({
    mutationFn: (id: string) => serviceOrdersApi.remove(id),
    onSuccess: invalidateServiceOrders,
  });

  return {
    createServiceOrder,
    updateServiceOrder,
    deleteServiceOrder,
    isSubmitting: createServiceOrder.isPending || updateServiceOrder.isPending || deleteServiceOrder.isPending,
  };
}

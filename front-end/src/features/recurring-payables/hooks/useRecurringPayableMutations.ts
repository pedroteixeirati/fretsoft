import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { recurringPayablesApi } from '../services/recurring-payables.api';
import { RecurringPayable } from '../types/recurring-payable.types';

export type RecurringPayablePayload = Pick<
  RecurringPayable,
  'description' | 'providerName' | 'amount' | 'dueDay' | 'startsOn' | 'endsOn' | 'status' | 'notes'
>;

export function useRecurringPayableMutations() {
  const queryClient = useQueryClient();

  const invalidateRecurringPayables = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.recurringPayables.all });
  };

  const createRecurringPayable = useMutation({
    mutationFn: (payload: RecurringPayablePayload) =>
      recurringPayablesApi.create(payload as Omit<RecurringPayable, 'id'>),
    onSuccess: invalidateRecurringPayables,
  });

  const updateRecurringPayable = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RecurringPayablePayload }) =>
      recurringPayablesApi.update(id, payload),
    onSuccess: invalidateRecurringPayables,
  });

  const deleteRecurringPayable = useMutation({
    mutationFn: (id: string) => recurringPayablesApi.remove(id),
    onSuccess: invalidateRecurringPayables,
  });

  const generateMonthPayables = useMutation({
    mutationFn: () => recurringPayablesApi.generate(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.payables.all });
    },
  });

  return {
    createRecurringPayable,
    updateRecurringPayable,
    deleteRecurringPayable,
    generateMonthPayables,
    isSubmitting:
      createRecurringPayable.isPending || updateRecurringPayable.isPending || deleteRecurringPayable.isPending,
  };
}

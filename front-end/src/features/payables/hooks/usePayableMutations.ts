import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Payable } from '../types/payable.types';
import { queryKeys } from '../../../shared/lib/query-keys';
import { payablesApi } from '../services/payables.api';

export function usePayableMutations() {
  const queryClient = useQueryClient();

  const invalidatePayables = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.payables.all });
  };

  const createPayable = useMutation({
    mutationFn: (payload: Omit<Payable, 'id'>) => payablesApi.create(payload),
    onSuccess: invalidatePayables,
  });

  const updatePayable = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<Payable, 'id'>> }) => payablesApi.update(id, payload),
    onSuccess: invalidatePayables,
  });

  const deletePayable = useMutation({
    mutationFn: (id: string) => payablesApi.remove(id),
    onSuccess: invalidatePayables,
  });

  const payPayable = useMutation({
    mutationFn: (id: string) => payablesApi.markPaid(id),
    onSuccess: invalidatePayables,
  });

  const markPayableOverdue = useMutation({
    mutationFn: (id: string) => payablesApi.markOverdue(id),
    onSuccess: invalidatePayables,
  });

  return {
    createPayable,
    updatePayable,
    deletePayable,
    payPayable,
    markPayableOverdue,
    isSubmitting:
      createPayable.isPending ||
      updatePayable.isPending ||
      deletePayable.isPending ||
      payPayable.isPending ||
      markPayableOverdue.isPending,
  };
}

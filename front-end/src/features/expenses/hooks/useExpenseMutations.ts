import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Expense } from '../types/expense.types';
import { queryKeys } from '../../../shared/lib/query-keys';
import { expensesApi } from '../services/expenses.api';

export function useExpenseMutations() {
  const queryClient = useQueryClient();

  const invalidateExpenses = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
  };

  const createExpense = useMutation({
    mutationFn: (payload: Omit<Expense, 'id'>) => expensesApi.create(payload),
    onSuccess: invalidateExpenses,
  });

  const updateExpense = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<Expense, 'id'>> }) => expensesApi.update(id, payload),
    onSuccess: invalidateExpenses,
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: invalidateExpenses,
  });

  return {
    createExpense,
    updateExpense,
    deleteExpense,
    isSubmitting: createExpense.isPending || updateExpense.isPending || deleteExpense.isPending,
  };
}

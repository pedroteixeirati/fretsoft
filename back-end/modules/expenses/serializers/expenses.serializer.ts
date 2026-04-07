import type { ExpensePayload } from '../dtos/expense.types';

export function serializeExpense(expense: ExpensePayload | Record<string, unknown>) {
  return { ...expense };
}

export function serializeExpenses(expenses: Array<ExpensePayload | Record<string, unknown>>) {
  return expenses.map(serializeExpense);
}

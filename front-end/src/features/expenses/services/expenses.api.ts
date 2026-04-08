import { createCrudApi } from '../../../shared/lib/api-client';
import { Expense } from '../types/expense.types';

export const expensesApi = createCrudApi<Expense>('/api/expenses');

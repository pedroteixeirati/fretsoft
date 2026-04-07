import type { ExpenseInput, ExpensePayload } from '../dtos/expense.types';
import {
  isNonNegativeNumber,
  isPositiveNumber,
  isValidDate,
  isValidTime,
  isValidUuid,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../../../shared/validation/validation';
import { findTenantVehicleForExpense } from '../repositories/expenses.repository';
import { expenseErrors } from '../errors/expenses.errors';

export async function validateExpensePayload(body: ExpenseInput, tenantId: string): Promise<ExpensePayload> {
  const date = normalizeRequiredText(body.date);
  const time = normalizeRequiredText(body.time);
  const vehicleId = normalizeRequiredText(body.vehicleId);
  const provider = normalizeRequiredText(body.provider);
  const category = normalizeRequiredText(body.category);
  const quantity = String(body.quantity ?? '').trim();
  const amount = Number(body.amount ?? 0);
  const odometer = String(body.odometer ?? '').trim();
  const status = body.status;
  const observations = normalizeOptionalText(body.observations);

  if (!isValidDate(date)) throw expenseErrors.invalidDate();
  if (!isValidTime(time)) throw expenseErrors.invalidTime();
  if (!isValidUuid(vehicleId)) throw expenseErrors.invalidVehicle();
  if (provider.length < 2) throw expenseErrors.invalidProvider();
  if (category.length < 2) throw expenseErrors.invalidCategory();
  if (!isPositiveNumber(amount)) throw expenseErrors.invalidAmount();
  if (quantity && !isNonNegativeNumber(quantity)) throw expenseErrors.invalidQuantity();
  if (odometer && !isNonNegativeNumber(odometer)) throw expenseErrors.invalidOdometer();
  if (!['approved', 'review', 'pending'].includes(status)) throw expenseErrors.invalidStatus();

  const vehicle = await findTenantVehicleForExpense(vehicleId, tenantId);
  if (!vehicle) throw expenseErrors.vehicleNotFound();

  return {
    date,
    time,
    vehicleId,
    vehicleName: vehicle.name,
    provider,
    category,
    quantity,
    amount,
    odometer,
    status,
    observations: observations || '',
  };
}

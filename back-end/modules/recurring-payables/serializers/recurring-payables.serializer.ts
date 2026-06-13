export function serializeRecurringPayable(recurringPayable: Record<string, unknown>) {
  return { ...recurringPayable };
}

export function serializeRecurringPayables(recurringPayables: Array<Record<string, unknown>>) {
  return recurringPayables.map(serializeRecurringPayable);
}

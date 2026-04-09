type RequiredRule<T> =
  | keyof T
  | {
      field: keyof T;
      isFilled?: (value: T[keyof T], formData: T) => boolean;
    };

function defaultIsFilled(value: unknown) {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
  if (typeof value === 'boolean') return value;
  return value !== null && value !== undefined;
}

export function hasRequiredFieldsFilled<T extends Record<string, unknown>>(
  formData: T,
  rules: RequiredRule<T>[],
) {
  return rules.every((rule) => {
    const field = typeof rule === 'string' ? rule : rule.field;
    const value = formData[field];
    const isFilled = typeof rule === 'string' ? defaultIsFilled : rule.isFilled || defaultIsFilled;
    return isFilled(value, formData);
  });
}

export type { RequiredRule };

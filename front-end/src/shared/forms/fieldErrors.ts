import type { FormFieldErrors } from '../../lib/errors';

export function hasRenderableFieldErrors<TField extends string>(fieldErrors: FormFieldErrors<TField>) {
  return Object.values(fieldErrors).some(Boolean);
}

export function clearFieldError<TField extends string>(
  fieldErrors: FormFieldErrors<TField>,
  field: TField,
) {
  if (!fieldErrors[field]) {
    return fieldErrors;
  }

  const next = { ...fieldErrors };
  delete next[field];
  return next;
}

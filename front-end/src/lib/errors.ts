export interface ApiErrorPayload {
  error: string;
  code?: string;
  field?: string | null;
  details?: Record<string, unknown> | null;
  status?: number;
}

export type FormFieldErrors<TField extends string = string> = Partial<Record<TField, string>>;

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  field?: string | null;
  details?: Record<string, unknown> | null;

  constructor(payload: ApiErrorPayload) {
    super(payload.error);
    this.name = 'ApiRequestError';
    this.status = payload.status || 500;
    this.code = payload.code;
    this.field = payload.field;
    this.details = payload.details || null;
  }
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'error' in value &&
    typeof (value as { error?: unknown }).error === 'string',
  );
}

function parseSerializedError(value: string): ApiErrorPayload | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return isApiErrorPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseApiError(error: unknown): ApiErrorPayload | null {
  if (error instanceof ApiRequestError) {
    return {
      error: error.message,
      code: error.code,
      field: error.field ?? null,
      details: error.details ?? null,
      status: error.status,
    };
  }

  if (error instanceof Error && error.message.trim()) {
    return parseSerializedError(error.message);
  }

  if (typeof error === 'string' && error.trim()) {
    return parseSerializedError(error);
  }

  return null;
}

export function getErrorMessage(error: unknown, fallback = 'Nao foi possivel concluir a operacao.') {
  const apiError = parseApiError(error);
  if (apiError?.error?.trim()) {
    return apiError.error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}

export function resolveFieldError<TField extends string>(
  error: unknown,
  options?: {
    fieldMap?: Partial<Record<string, TField>>;
    codeMap?: Partial<Record<string, TField>>;
    fallbackMessage?: string;
  },
): { field?: TField; message: string } | null {
  const apiError = parseApiError(error);
  if (!apiError?.error) return null;

  const mappedByField = apiError.field ? options?.fieldMap?.[apiError.field] : undefined;
  const mappedByCode = apiError.code ? options?.codeMap?.[apiError.code] : undefined;
  const field = mappedByField || mappedByCode;

  if (!field) return null;

  return {
    field,
    message: apiError.error || options?.fallbackMessage || 'Revise o campo informado.',
  };
}

import { auth, OperationType, handleDataError } from '../../firebase';
import { ApiRequestError, ApiErrorPayload } from '../../lib/errors';

export type ResourceInput<T> = Omit<T, 'id'>;

async function buildHeaders(extra?: HeadersInit) {
  const user = auth.currentUser;
  const headers = new Headers(extra);
  headers.set('Content-Type', 'application/json');

  if (!user) {
    throw new Error('Usuario nao autenticado.');
  }

  const token = await user.getIdToken();
  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, operationType: OperationType = OperationType.GET) {
  try {
    const response = await fetch(path, {
      ...init,
      headers: await buildHeaders(init.headers),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({} as ApiErrorPayload));
      throw new ApiRequestError({
        error: payload.error || `Erro ${response.status}`,
        code: payload.code,
        field: payload.field,
        details: payload.details,
        status: response.status,
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json() as T;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }
    handleDataError(error, operationType, path);
  }
}

export function createCrudApi<T>(path: string) {
  return {
    list: () => apiRequest<T[]>(path, {}, OperationType.LIST),
    create: (payload: ResourceInput<T>) => apiRequest<T>(path, { method: 'POST', body: JSON.stringify(payload) }, OperationType.CREATE),
    update: (id: string, payload: Partial<ResourceInput<T>>) => apiRequest<T>(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, OperationType.UPDATE),
    remove: (id: string) => apiRequest<void>(`${path}/${id}`, { method: 'DELETE' }, OperationType.DELETE),
  };
}

import { auth, OperationType, handleDataError } from '../firebase';
import { Company, Contract, Expense, Freight, Payable, PlatformTenant, Provider, Revenue, TenantProfile, UserProfile, Vehicle } from '../types';

type ResourceInput<T> = Omit<T, 'id'>;

async function buildHeaders(extra?: HeadersInit) {
  const user = auth.currentUser;
  const headers = new Headers(extra);
  headers.set('Content-Type', 'application/json');

  if (!user) {
    throw new Error('Usuário não autenticado.');
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
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Erro ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json() as T;
  } catch (error) {
    handleDataError(error, operationType, path);
  }
}

function createCrudApi<T>(path: string) {
  return {
    list: () => apiRequest<T[]>(path, {}, OperationType.LIST),
    create: (payload: ResourceInput<T>) => apiRequest<T>(path, { method: 'POST', body: JSON.stringify(payload) }, OperationType.CREATE),
    update: (id: string, payload: Partial<ResourceInput<T>>) => apiRequest<T>(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, OperationType.UPDATE),
    remove: (id: string) => apiRequest<void>(`${path}/${id}`, { method: 'DELETE' }, OperationType.DELETE),
  };
}

export const usersApi = {
  me: () => apiRequest<UserProfile>('/api/me/profile', {}, OperationType.GET),
  meWithToken: async (token: string) => {
    try {
      const response = await fetch('/api/me/profile', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Erro ${response.status}`);
      }

      return await response.json() as UserProfile;
    } catch (error) {
      handleDataError(error, OperationType.GET, '/api/me/profile');
    }
  },
  create: (payload: { email: string; password: string; role: 'admin' | 'financial' | 'operational' | 'driver' | 'viewer'; name?: string }) =>
    apiRequest<UserProfile>('/api/users', { method: 'POST', body: JSON.stringify(payload) }, OperationType.CREATE),
};

export const tenantProfileApi = {
  get: () => apiRequest<TenantProfile>('/api/tenant-profile', {}, OperationType.GET),
  update: (payload: Omit<TenantProfile, 'id'>) =>
    apiRequest<TenantProfile>('/api/tenant-profile', { method: 'PUT', body: JSON.stringify(payload) }, OperationType.UPDATE),
};

export const platformTenantsApi = {
  list: () => apiRequest<PlatformTenant[]>('/api/platform/tenants', {}, OperationType.LIST),
  create: (payload: {
    name: string;
    tradeName: string;
    slug: string;
    cnpj: string;
    phone: string;
    legalRepresentative: string;
    city: string;
    state: string;
    plan: string;
    status: 'active' | 'inactive' | 'suspended';
    ownerEmail: string;
    ownerName: string;
    ownerPassword: string;
  }) => apiRequest<PlatformTenant>('/api/platform/tenants', { method: 'POST', body: JSON.stringify(payload) }, OperationType.CREATE),
};

export const revenuesApi = {
  list: () => apiRequest<Revenue[]>('/api/revenues', {}, OperationType.LIST),
  generate: () => apiRequest<{ generated: number }>('/api/revenues/generate', { method: 'POST' }, OperationType.CREATE),
  generateCharge: (id: string) => apiRequest<Revenue>(`/api/revenues/${id}/charge`, { method: 'POST' }, OperationType.UPDATE),
  markReceived: (id: string) => apiRequest<Revenue>(`/api/revenues/${id}/receive`, { method: 'POST' }, OperationType.UPDATE),
  markOverdue: (id: string) => apiRequest<Revenue>(`/api/revenues/${id}/overdue`, { method: 'POST' }, OperationType.UPDATE),
};

export const payablesApi = {
  list: () => apiRequest<Payable[]>('/api/payables', {}, OperationType.LIST),
  create: (payload: Omit<Payable, 'id'>) => apiRequest<Payable>('/api/payables', { method: 'POST', body: JSON.stringify(payload) }, OperationType.CREATE),
  update: (id: string, payload: Partial<Omit<Payable, 'id'>>) => apiRequest<Payable>(`/api/payables/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, OperationType.UPDATE),
  remove: (id: string) => apiRequest<void>(`/api/payables/${id}`, { method: 'DELETE' }, OperationType.DELETE),
  markPaid: (id: string) => apiRequest<Payable>(`/api/payables/${id}/pay`, { method: 'POST' }, OperationType.UPDATE),
  markOverdue: (id: string) => apiRequest<Payable>(`/api/payables/${id}/overdue`, { method: 'POST' }, OperationType.UPDATE),
};

export const vehiclesApi = createCrudApi<Vehicle>('/api/vehicles');
export const providersApi = createCrudApi<Provider>('/api/providers');
export const companiesApi = createCrudApi<Company>('/api/companies');
export const contractsApi = createCrudApi<Contract>('/api/contracts');
export const freightsApi = createCrudApi<Freight>('/api/freights');
export const expensesApi = createCrudApi<Expense>('/api/expenses');

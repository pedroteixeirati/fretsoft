import { OperationType } from '../../../firebase';
import { apiRequest } from '../../../shared/lib/api-client';
import { PlatformTenant } from '../types/platform-tenant.types';

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

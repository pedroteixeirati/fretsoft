import { OperationType } from '../../../firebase';
import { apiRequest } from '../../../shared/lib/api-client';
import { TenantProfile } from '../types/tenant-profile.types';

export const tenantProfileApi = {
  get: (tenantId?: string) =>
    apiRequest<TenantProfile>(
      tenantId ? `/api/tenant-profile?tenantId=${encodeURIComponent(tenantId)}` : '/api/tenant-profile',
      {},
      OperationType.GET,
    ),
  update: (payload: Omit<TenantProfile, 'id'>, tenantId?: string) =>
    apiRequest<TenantProfile>(
      tenantId ? `/api/tenant-profile?tenantId=${encodeURIComponent(tenantId)}` : '/api/tenant-profile',
      { method: 'PUT', body: JSON.stringify(payload) },
      OperationType.UPDATE,
    ),
};

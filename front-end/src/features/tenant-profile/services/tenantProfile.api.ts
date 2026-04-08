import { OperationType } from '../../../firebase';
import { apiRequest } from '../../../shared/lib/api-client';
import { TenantProfile } from '../types/tenant-profile.types';

export const tenantProfileApi = {
  get: () => apiRequest<TenantProfile>('/api/tenant-profile', {}, OperationType.GET),
  update: (payload: Omit<TenantProfile, 'id'>) =>
    apiRequest<TenantProfile>('/api/tenant-profile', { method: 'PUT', body: JSON.stringify(payload) }, OperationType.UPDATE),
};

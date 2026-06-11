import { apiRequest } from '../../../shared/lib/api-client';

export interface TenantFeature {
  key: string;
  label: string;
  enabled: boolean;
}

export const tenantFeaturesApi = {
  list: () => apiRequest<TenantFeature[]>('/api/tenant-features'),
  setFeature: (key: string, enabled: boolean) =>
    apiRequest<TenantFeature[]>(`/api/tenant-features/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    }),
};

import { OperationType, handleDataError } from '../../../firebase';
import { apiRequest } from '../../../shared/lib/api-client';
import { UserProfile } from '../../../shared/types/common.types';

export interface TenantUserListItem {
  id: string;
  email: string;
  role: UserProfile['role'];
  name?: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

export const usersApi = {
  me: () => apiRequest<UserProfile>('/api/me/profile', {}, OperationType.GET),
  list: () => apiRequest<TenantUserListItem[]>('/api/users', {}, OperationType.GET),
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

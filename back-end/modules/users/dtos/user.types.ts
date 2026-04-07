import type { AppRole } from '../../../shared/authorization/permissions';

export type CreateTenantUserInput = {
  email: string;
  password: string;
  role: AppRole;
  name?: string;
};

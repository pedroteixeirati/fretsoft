import type { ResourcePermissions } from '../../shared/authorization/permissions';

export const fiscalPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'financial'],
  update: ['dev', 'owner', 'admin', 'financial'],
  delete: ['dev', 'owner', 'admin'],
};

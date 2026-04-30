import type { ResourcePermissions } from '../../shared/authorization/permissions';

export const payablesPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'],
  create: ['dev', 'owner', 'admin', 'financial'],
  update: ['dev', 'owner', 'admin', 'financial'],
  delete: ['dev', 'owner', 'admin', 'financial'],
};

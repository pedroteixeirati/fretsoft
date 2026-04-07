export type AppRole = 'dev' | 'owner' | 'admin' | 'financial' | 'operational' | 'driver' | 'viewer';

export type ResourceAction = 'read' | 'create' | 'update' | 'delete';

export type ResourcePermissions = Record<ResourceAction, readonly AppRole[]>;

export const userManagementRoles: AppRole[] = ['dev', 'owner'];

export const platformTenantRoles: AppRole[] = ['dev'];
export const tenantProfileRoles: AppRole[] = ['dev', 'owner', 'admin'];

export function canPerform(action: ResourceAction, permissions: ResourcePermissions, role?: AppRole) {
  return !!role && permissions[action].includes(role);
}

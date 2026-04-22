import { UserProfile } from '../../../shared/types/common.types';

export function canAccessNovalogOperations(profile: UserProfile | null) {
  if (!profile) return false;
  return profile.tenantSlug === 'novalog';
}

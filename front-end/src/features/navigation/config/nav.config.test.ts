import { buildNavigationSections } from './nav.config';
import type { UserProfile } from '../../../shared/types/common.types';

function makeProfile(role: UserProfile['role']): UserProfile {
  return {
    uid: `user-${role}`,
    email: `${role}@teste.com`,
    role,
    tenantId: 'tenant-1',
    tenantName: 'Transportadora Teste',
    tenantSlug: 'transportadora-teste',
  };
}

describe('buildNavigationSections', () => {
  it('exibe administracao apenas para usuario dev', () => {
    const devSections = buildNavigationSections(makeProfile('dev'));
    const ownerSections = buildNavigationSections(makeProfile('owner'));
    const adminSections = buildNavigationSections(makeProfile('admin'));

    expect(devSections.some((section) => section.id === 'admin')).toBe(true);
    expect(ownerSections.some((section) => section.id === 'admin')).toBe(false);
    expect(adminSections.some((section) => section.id === 'admin')).toBe(false);
  });
});

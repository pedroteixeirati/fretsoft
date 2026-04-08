import { renderHook } from '@testing-library/react';
import { usePermission } from './usePermission';
import { UserProfile } from '../../../shared/types/common.types';

const mockUseAuth = vi.fn();

vi.mock('./useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function makeProfile(role: UserProfile['role']): UserProfile {
  return {
    uid: `user-${role}`,
    email: `${role}@teste.com`,
    role,
    tenantId: 'tenant-1',
    tenantName: 'Tenant Teste',
    tenantSlug: 'tenant-teste',
  };
}

describe('usePermission', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('expõe can=true quando o perfil tem acesso', () => {
    mockUseAuth.mockReturnValue({ userProfile: makeProfile('financial') });

    const { result } = renderHook(() => usePermission('payables', 'read'));

    expect(result.current.can).toBe(true);
  });

  it('expõe check reutilizável para outras combinações', () => {
    mockUseAuth.mockReturnValue({ userProfile: makeProfile('viewer') });

    const { result } = renderHook(() => usePermission());

    expect(result.current.check('vehicles', 'read')).toBe(true);
    expect(result.current.check('reports', 'read')).toBe(false);
  });
});

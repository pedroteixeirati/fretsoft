import { useCallback, useMemo } from 'react';
import { canAccess, type Action, type Section } from '../../../lib/permissions';
import { useAuth } from './useAuth';

export function usePermission(section?: Section, action?: Action) {
  const { userProfile } = useAuth();

  const can = useMemo(() => {
    if (!section || !action) return false;
    return canAccess(userProfile, section, action);
  }, [action, section, userProfile]);

  const check = useCallback((targetSection: Section, targetAction: Action) => {
    return canAccess(userProfile, targetSection, targetAction);
  }, [userProfile]);

  return {
    can,
    check,
    userProfile,
  };
}

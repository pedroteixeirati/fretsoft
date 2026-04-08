import React, { useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import AppShell from '../../features/navigation/components/AppShell';
import { getFirstAllowedPath, getNavItemFromPath, resolveAllowedTab } from '../router/navigation';

export default function PrivateLayout() {
  const location = useLocation();
  const { userProfile } = useAuth();

  const activeItem = useMemo(() => getNavItemFromPath(location.pathname), [location.pathname]);
  const effectiveItem = useMemo(() => {
    if (!userProfile) return activeItem;
    return resolveAllowedTab(userProfile, activeItem);
  }, [activeItem, userProfile]);

  if (!userProfile) {
    return <Navigate to="/acesso-pendente" replace />;
  }

  if (effectiveItem !== activeItem) {
    return <Navigate to={getFirstAllowedPath(userProfile)} replace />;
  }

  return (
    <AppShell activeItem={effectiveItem}>
      <Outlet />
    </AppShell>
  );
}

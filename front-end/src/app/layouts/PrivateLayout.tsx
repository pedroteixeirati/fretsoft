import React, { useMemo } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import { getFirstAllowedPath, getNavItemFromPath, getPathFromNavItem, resolveAllowedTab } from '../router/navigation';

export default function PrivateLayout() {
  const location = useLocation();
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-surface">
      <Sidebar activeItem={effectiveItem} onNavigate={(item) => navigate(getPathFromNavItem(item))} />
      <TopBar onNavigate={(item) => navigate(getPathFromNavItem(item))} />
      <main className="ml-64 px-10 pb-12 pt-24">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

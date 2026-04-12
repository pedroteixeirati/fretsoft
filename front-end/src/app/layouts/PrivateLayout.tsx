import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import { getFirstAllowedPath, getNavItemFromPath, getPathFromNavItem, resolveAllowedTab } from '../router/navigation';

export default function PrivateLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleNavigate = (item: Parameters<typeof getPathFromNavItem>[0]) => {
    setIsMobileSidebarOpen(false);
    navigate(getPathFromNavItem(item));
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        activeItem={effectiveItem}
        onNavigate={handleNavigate}
        isMobileOpen={isMobileSidebarOpen}
        onRequestClose={() => setIsMobileSidebarOpen(false)}
      />
      <TopBar
        onNavigate={handleNavigate}
        onToggleSidebar={() => setIsMobileSidebarOpen((current) => !current)}
      />
      <main className="px-4 pb-10 pt-20 sm:px-6 md:px-8 lg:ml-64 lg:px-10 lg:pb-12 lg:pt-24">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { getFirstAllowedPath } from './navigation';

export default function PublicRoute() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (user && userProfile) {
    return <Navigate to={getFirstAllowedPath(userProfile)} replace />;
  }

  if (user && !userProfile) {
    return <Navigate to="/acesso-pendente" replace />;
  }

  return <Outlet />;
}

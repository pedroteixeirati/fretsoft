import React from 'react';
import { Navigate } from 'react-router-dom';
import { type Action, type Section } from '../../../lib/permissions';
import { usePermission } from '../hooks/usePermission';

interface GuardProps {
  section: Section;
  action: Action;
  children: React.ReactNode;
  redirectTo?: string;
}

export default function Guard({ section, action, children, redirectTo = '/' }: GuardProps) {
  const { can } = usePermission(section, action);
  if (!can) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}

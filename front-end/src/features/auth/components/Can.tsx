import React from 'react';
import { type Action, type Section } from '../../../lib/permissions';
import { usePermission } from '../hooks/usePermission';

interface CanProps {
  section: Section;
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function Can({ section, action, children, fallback = null }: CanProps) {
  const { can } = usePermission(section, action);
  return can ? <>{children}</> : <>{fallback}</>;
}

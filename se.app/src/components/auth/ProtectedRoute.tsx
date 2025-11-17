'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { redirect } from 'next/navigation';
import type { Permission, Role } from '@/types/app/types';

interface ProtectedRouteProps {
  children: ReactNode;
  // New preferred props
  requiredPermissions?: Permission[];
  requiredRoles?: Role[];
  // Back-compat props (will be ignored if required* provided)
  permissions?: Permission[];
  roles?: Role[];
  // If true, require all provided roles/permissions; otherwise any
  requireAll?: boolean;
}

export function ProtectedRoute({ 
  children,
  requiredPermissions,
  requiredRoles,
  // deprecated props kept for back-compat
  permissions,
  roles,
  requireAll = false 
}: ProtectedRouteProps) {
  const { session, isLoading, hasPermission, hasRole } = useAuth();

  const effectivePermissions: Permission[] = requiredPermissions ?? permissions ?? [];
  const effectiveRoles: Role[] = requiredRoles ?? roles ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    redirect('/login');
  }

  if (effectivePermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? effectivePermissions.every(p => hasPermission(p))
      : effectivePermissions.some(p => hasPermission(p));

    if (!hasRequiredPermissions) {
      redirect('/unauthorized');
    }
  }

  if (effectiveRoles.length > 0) {
    const hasRequiredRoles = requireAll
      ? effectiveRoles.every(r => hasRole(r))
      : effectiveRoles.some(r => hasRole(r));

    if (!hasRequiredRoles) {
      redirect('/unauthorized');
    }
  }

  return <>{children}</>;
}

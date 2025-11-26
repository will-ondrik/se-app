'use client';

import { ReactNode } from 'react';
import { redirect, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layouts/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { session, isLoading, hasRole } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    // Preserve intent: go to login and then back if desired later
    redirect('/login');
  }

  // Management role path restrictions: allow only /schedule, /team, /reports
  if (session && hasRole('MANAGEMENT')) {
    const allowed =
      pathname.startsWith('/schedule') ||
      pathname.startsWith('/team') ||
      pathname.startsWith('/reports');
    if (!allowed) {
      redirect('/unauthorized');
    }
  }

  return (
    <MainLayout>
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    </MainLayout>
  );
}

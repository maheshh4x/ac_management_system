'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Permission, Role, hasPermission, canAccessRoute } from '@/lib/permissions';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    
    const isPublicPath = pathname === '/login' || pathname === '/403';
    if (!user && !isPublicPath) {
      router.push('/login');
    } else if (user && pathname === '/login') {
      // Redirect already-logged in user away from login page
      switch(user.role) {
        case 'SUPER_ADMIN': router.push('/admin/dashboard'); break;
        case 'FACILITY_MANAGER': router.push('/manager/dashboard'); break;
        case 'TECHNICIAN': router.push('/technician/dashboard'); break;
        case 'VIEWER': router.push('/viewer/dashboard'); break;
        default: router.push('/viewer/dashboard');
      }
    } else if (user && pathname !== '/login' && pathname !== '/403' && !canAccessRoute(user.role, pathname)) {
      router.push('/403');
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (!user && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}

export function ProtectedAction({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { user } = useAuth();
  return hasPermission(user?.role || null, permission) ? <>{children}</> : null;
}

export function RoleGuard({ allowedRoles, children }: { allowedRoles: Role[]; children: React.ReactNode }) {
  const { user } = useAuth();
  return user && allowedRoles.includes(user.role) ? <>{children}</> : null;
}

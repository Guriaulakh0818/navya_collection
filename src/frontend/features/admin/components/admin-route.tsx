'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Loader } from '@/components/ui/loader';
import { useAdminAuthStore, useAuthStore } from '@/stores';

type AdminRouteProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function AdminRoute({ children, fallback }: AdminRouteProps) {
  const router = useRouter();
  const adminUser = useAdminAuthStore((s) => s.user);
  const adminToken = useAdminAuthStore((s) => s.token);
  const setAdminUser = useAdminAuthStore((s) => s.setUser);
  const logout = useAdminAuthStore((s) => s.logout);
  const customerUser = useAuthStore((s) => s.user);

  const hasOptimisticAdmin = Boolean(
    adminUser &&
    ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(adminUser.role?.toUpperCase() || ''),
  );

  const [isChecking, setIsChecking] = useState(!hasOptimisticAdmin);
  const [authorized, setAuthorized] = useState(hasOptimisticAdmin);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      // 1. Verify session with server (checks HTTP-Only cookies navya_admin_session / navya_session and Bearer token)
      try {
        const headers: Record<string, string> = {};
        if (adminToken) {
          headers['Authorization'] = `Bearer ${adminToken}`;
        }

        const res = await fetch('/api/v1/auth/session', {
          headers,
          cache: 'no-store',
          credentials: 'include',
        });
        const data = await res.json().catch(() => null);

        if (res.ok && data?.authenticated && data?.user) {
          const userRole = data.user.role?.toUpperCase() || '';
          if (['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(userRole)) {
            setAdminUser(data.user);
            if (isMounted) {
              setAuthorized(true);
              setIsChecking(false);
            }
            return;
          }
        }

        // If server says unauthenticated or non-admin:
        // Clear stale client state (prevent zombie sessions)
        logout();
        if (isMounted) {
          setAuthorized(false);
          setIsChecking(false);
          const currentPath =
            typeof window !== 'undefined'
              ? window.location.pathname + window.location.search
              : '/admin/dashboard';
          const redirectParam =
            currentPath && currentPath !== '/admin/login' && currentPath !== '/admin'
              ? `?redirectUrl=${encodeURIComponent(currentPath)}&expired=true`
              : '?expired=true';
          router.push(`/admin/login${redirectParam}`);
        }
      } catch (err) {
        console.warn('[ADMIN_ROUTE_AUTH_CHECK_FAILED]', err);
        // If network failed and optimistic check passed, stay authorized
        if (hasOptimisticAdmin && isMounted) {
          setAuthorized(true);
          setIsChecking(false);
        } else if (isMounted) {
          setAuthorized(false);
          setIsChecking(false);
          router.push('/admin/login?expired=true');
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [adminToken, hasOptimisticAdmin, logout, router, setAdminUser]);

  if (isChecking) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center bg-white text-slate-900">
          <Loader text="Verifying Admin Privileges..." />
        </div>
      )
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}

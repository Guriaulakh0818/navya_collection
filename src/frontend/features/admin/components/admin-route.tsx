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
  const setAdminUser = useAdminAuthStore((s) => s.setUser);
  const customerUser = useAuthStore((s) => s.user);

  const [isChecking, setIsChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      // 1. Check client store first
      const currentUser =
        adminUser ||
        (customerUser &&
        ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(
          customerUser.role?.toUpperCase() || '',
        )
          ? customerUser
          : null);

      if (
        currentUser &&
        ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(
          currentUser.role?.toUpperCase() || '',
        )
      ) {
        if (isMounted) {
          setAuthorized(true);
          setIsChecking(false);
        }
        return;
      }

      // 2. Fetch session from server (checks HTTP-Only cookies navya_admin_session / navya_session)
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();

        if (data?.authenticated && data?.user) {
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
      } catch {
        // Session check failed
      }

      if (isMounted) {
        setAuthorized(false);
        setIsChecking(false);
        router.push('/admin/login');
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [adminUser, customerUser, setAdminUser, router]);

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

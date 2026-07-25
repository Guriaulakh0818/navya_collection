'use client';

import { useRouter } from 'next/navigation';

import { Loader } from '@/components/ui/loader';
import { useAuth } from '@/providers/auth-provider';

type AdminRouteProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function AdminRoute({ children, fallback }: AdminRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
          <Loader text="Verifying Admin Privileges..." />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    router.push('/admin/login');
    return null;
  }

  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  if (!isAdmin) {
    router.push('/admin/unauthorized');
    return null;
  }

  return <>{children}</>;
}

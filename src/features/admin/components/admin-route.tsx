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
        <div className="flex min-h-screen items-center justify-center">
          <Loader text="Loading..." />
        </div>
      )
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}

'use client';

import { useRouter } from 'next/navigation';

import { Loader } from '@/components/ui/loader';
import { useAuth } from '@/providers/auth-provider';
import { useAuthStore } from '@/stores';

type ProtectedRouteProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated: isContextAuth, isLoading } = useAuth();
  const storeUser = useAuthStore((s) => s.user);
  const router = useRouter();

  const isUserAuthenticated = isContextAuth || !!storeUser;

  if (isLoading && !isUserAuthenticated) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <Loader text="Loading..." />
        </div>
      )
    );
  }

  if (!isUserAuthenticated) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}

'use client';

import { useRouter } from 'next/navigation';

import { Loader } from '@/components/ui/loader';
import { useAuth } from '@/providers/auth-provider';

type ProtectedRouteProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
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

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  return <>{children}</>;
}

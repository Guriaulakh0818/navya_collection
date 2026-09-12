import { Suspense } from 'react';
import { headers } from 'next/headers';

import AdminLoginPage from '@/app/admin/login/page';
import { Loader } from '@/components/ui/loader';
import { getCurrentUser } from '@/features/auth/actions/auth.actions';
import { LoginForm } from '@/features/auth/components/login-form';

export default async function LoginPage() {
  const headersList = await headers();
  const host = (headersList.get('x-forwarded-host') || headersList.get('host') || '').toLowerCase();
  const isAdminSubdomain =
    host.startsWith('admin.') || host.includes('admin.navyacollection.store');

  // If accessed from admin.navyacollection.store, render dedicated Admin Portal Login
  if (isAdminSubdomain) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50/80">
            <Loader text="Loading Admin Governance Console..." />
          </div>
        }
      >
        <AdminLoginPage />
      </Suspense>
    );
  }

  const user = await getCurrentUser();
  const userRole = ((user as any)?.role || '').toUpperCase();
  const isAdminRole = ['ADMIN', 'SUPER_ADMIN', 'OWNER', 'SUPERVISOR'].includes(userRole);
  const userData = user && !isAdminRole ? (user as any) : null;

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-20 select-none">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl">
        <Suspense
          fallback={
            <div className="py-10 text-center">
              <Loader text="Loading..." />
            </div>
          }
        >
          <LoginForm
            initialUser={
              userData
                ? { name: userData.name || undefined, email: userData.email || undefined }
                : null
            }
          />
        </Suspense>
      </div>
    </div>
  );
}

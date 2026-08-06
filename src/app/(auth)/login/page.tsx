import { Suspense } from 'react';

import { Loader } from '@/components/ui/loader';
import { getCurrentUser } from '@/features/auth/actions/auth.actions';
import { LoginForm } from '@/features/auth/components/login-form';

export default async function LoginPage() {
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

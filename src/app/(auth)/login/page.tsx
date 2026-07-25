import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/features/auth/actions/auth.actions';
import { LoginForm } from '@/features/auth/components/login-form';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/');
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="rounded-2xl border border-border bg-white p-8 shadow-premium">
        <div className="text-center">
          <h1 className="font-heading text-3xl text-navy">Welcome Back</h1>
          <p className="mt-2 text-sm text-slate-600">Login to your Navya Collection account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

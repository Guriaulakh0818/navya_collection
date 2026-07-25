import { ArrowLeft, LogIn, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function AdminUnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 shadow-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 mb-6">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <h1 className="font-heading text-2xl font-bold text-navy">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-600">
          Admin privileges required. Your account does not have permission to access the Navya
          Collection Admin Portal.
        </p>

        <div className="mt-8 space-y-3">
          <Link href="/admin/login" className="block w-full">
            <Button className="w-full rounded-full bg-navy text-white hover:bg-navy/90 gap-2">
              <LogIn className="h-4 w-4" /> Sign in with Admin Account
            </Button>
          </Link>

          <Link href="/" className="block w-full">
            <Button
              variant="outline"
              className="w-full rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Return to Customer Store
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { AddressList } from '@/features/addresses/components/AddressList';
import { ProtectedRoute } from '@/features/auth/components/protected-route';

export default function AddressesPage() {
  return (
    <ProtectedRoute>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Account', href: '/account' },
          { label: 'My Addresses' },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-8">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
          <AddressList />
        </div>
      </div>
    </ProtectedRoute>
  );
}

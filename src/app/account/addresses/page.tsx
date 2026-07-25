'use client';

import Link from 'next/link';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

export default function AddressesPage() {
  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Account', href: '/account' },
          { label: 'Addresses' },
        ]}
        className="mx-auto max-w-[1440px] px-4 md:px-6 py-4"
      />
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <h1 className="font-heading text-3xl text-navy mb-6">My Addresses</h1>
        <Link href="/account/addresses/new">
          <Button className="mb-4 rounded-full">Add New Address</Button>
        </Link>
        <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
          <p className="text-sm text-slate-600">No addresses saved yet.</p>
        </div>
      </div>
    </div>
  );
}

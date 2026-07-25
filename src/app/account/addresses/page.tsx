'use client';

import { useEffect, useState } from 'react';

import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/features/auth/components/protected-route';

type Address = {
  id: string;
  label: string;
  name: string;
  mobile: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

const MOCK_ADDRESSES: Address[] = [
  {
    id: '1',
    label: 'Home',
    name: 'Test User',
    mobile: '9876543210',
    line1: '123 Main Street',
    line2: 'Apartment 4B',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    isDefault: true,
  },
];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Address>({
    id: '',
    label: 'Home',
    name: '',
    mobile: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  useEffect(() => {
    if (!isCreating && addresses.length) {
      setForm({
        id: '',
        label: 'Home',
        name: addresses[0].name,
        mobile: addresses[0].mobile,
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false,
      });
    }
  }, [isCreating, addresses]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.line1 || !form.city || !form.state || !form.pincode)
      return;

    if (form.id) {
      setAddresses((prev) => prev.map((a) => (a.id === form.id ? { ...form, id: a.id } : a)));
    } else {
      setAddresses((prev) => [...prev, { ...form, id: `${Date.now()}` }]);
    }

    setIsCreating(false);
  };

  const handleEdit = (address: Address) => {
    setForm(address);
    setIsCreating(true);
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

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
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-2xl text-navy">My Addresses</h2>
          {!isCreating && (
            <Button className="rounded-full" onClick={() => setIsCreating(true)}>
              Add New Address
            </Button>
          )}
        </div>

        {isCreating && (
          <form
            onSubmit={handleSave}
            className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-premium"
          >
            <h3 className="font-heading text-xl text-navy mb-4">
              {form.id ? 'Edit Address' : 'New Address'}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Label</label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Full Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Mobile</label>
                <Input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Address Line 1</label>
                <Input
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-navy mb-1">Address Line 2</label>
                <Input
                  value={form.line2}
                  onChange={(e) => setForm({ ...form, line2: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">City</label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">State</label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Pincode</label>
                <Input
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button type="submit" className="rounded-full">
                Save Address
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {addresses.length === 0 && !isCreating ? (
          <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
            <p className="text-sm text-slate-600">No addresses saved yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-navy">
                    {address.label} {address.isDefault ? '(Default)' : ''}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {address.name} | {address.mobile}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {address.line1}, {address.line2 ? `${address.line2}, ` : ''}
                    {address.city}, {address.state} - {address.pincode}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleEdit(address)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-error hover:text-error"
                    onClick={() => handleDelete(address.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

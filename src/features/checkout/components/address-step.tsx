'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCheckout } from '@/features/checkout/context/checkout-context';
import type { Address } from '@/features/checkout/types/checkout.types';

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

export function AddressStep() {
  const { address, setAddress, nextStep } = useCheckout();
  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES);
  const [selectedId, setSelectedId] = useState<string>(address?.id || addresses[0]?.id || '');
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
    if (!address) {
      const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
      if (defaultAddress) {
        setAddress(defaultAddress);
        setSelectedId(defaultAddress.id);
      }
    }
  }, [address, addresses, setAddress]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newAddress: Address = {
      ...form,
      id: form.id || `${Date.now()}`,
    };
    setAddresses((prev) => [...prev, newAddress]);
    setAddress(newAddress);
    setSelectedId(newAddress.id);
    setIsCreating(false);
  };

  const handleSelect = (id: string) => {
    const selected = addresses.find((a) => a.id === id);
    if (selected) {
      setSelectedId(id);
      setAddress(selected);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-premium">
      <h2 className="font-heading text-xl text-navy mb-4">Delivery Address</h2>

      <div className="space-y-3 mb-6">
        {addresses.map((addr) => (
          <label
            key={addr.id}
            className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${
              selectedId === addr.id ? 'border-navy bg-navy/5' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="address"
              checked={selectedId === addr.id}
              onChange={() => handleSelect(addr.id)}
              className="mt-1 h-4 w-4"
            />
            <div>
              <p className="text-sm font-semibold text-navy">
                {addr.label} {addr.isDefault ? '(Default)' : ''}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {addr.name} | {addr.mobile}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ''}
                {addr.city}, {addr.state} - {addr.pincode}
              </p>
            </div>
          </label>
        ))}
      </div>

      {!isCreating ? (
        <Button variant="outline" className="rounded-full" onClick={() => setIsCreating(true)}>
          Add New Address
        </Button>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 border-t border-border pt-4">
          <h3 className="font-semibold text-navy">New Address</h3>
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
          <div className="flex items-center gap-3">
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

      <div className="mt-6 flex justify-between">
        <Button variant="outline" className="rounded-full">
          Back
        </Button>
        <Button className="rounded-full" onClick={nextStep} disabled={!address}>
          Continue to Delivery
        </Button>
      </div>
    </div>
  );
}

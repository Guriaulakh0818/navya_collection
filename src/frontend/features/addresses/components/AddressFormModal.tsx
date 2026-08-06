'use client';

import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { AddressData } from './AddressCard';

export interface AddressFormValues {
  id?: string;
  fullName: string;
  mobile: string;
  pincode: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  type: 'HOME' | 'WORK' | 'OTHER';
  isDefault: boolean;
}

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AddressFormValues) => Promise<void>;
  initialData?: AddressData | null;
  isLoading?: boolean;
}

export const AddressFormModal: React.FC<AddressFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [form, setForm] = useState<AddressFormValues>({
    fullName: '',
    mobile: '',
    pincode: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    type: 'HOME',
    isDefault: false,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        id: initialData.id,
        fullName: initialData.fullName || '',
        mobile: initialData.mobile || '',
        pincode: initialData.pincode || '',
        addressLine1: initialData.addressLine1 || '',
        addressLine2: initialData.addressLine2 || '',
        city: initialData.city || '',
        state: initialData.state || '',
        type: (initialData.type as any) || 'HOME',
        isDefault: initialData.isDefault || false,
      });
    } else {
      setForm({
        fullName: '',
        mobile: '',
        pincode: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        type: 'HOME',
        isDefault: false,
      });
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client side validation
    if (!form.fullName.trim() || form.fullName.length < 2) {
      setErrorMsg('Full name must be at least 2 characters.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      setErrorMsg('Please enter a valid 10-digit mobile number starting with 6-9.');
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setErrorMsg('Please enter a valid 6-digit Indian Pincode.');
      return;
    }
    if (!form.addressLine1.trim() || form.addressLine1.length < 3) {
      setErrorMsg('Address Line 1 is required.');
      return;
    }
    if (!form.city.trim() || !form.state.trim()) {
      setErrorMsg('City and State are required.');
      return;
    }

    try {
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save address.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <h3 className="font-heading text-xl font-bold text-navy">
            {initialData ? 'Edit Delivery Address' : 'Add New Delivery Address'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-navy hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-2xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Full Name *
              </label>
              <Input
                placeholder="e.g. Navya Sharma"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                className="rounded-xl bg-white border-slate-300 text-slate-900 font-semibold focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Mobile Number *
              </label>
              <Input
                placeholder="10-digit mobile"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                required
                className="rounded-xl bg-white border-slate-300 text-slate-900 font-semibold focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Pincode *
              </label>
              <Input
                placeholder="6-digit Pincode"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                required
                className="rounded-xl bg-white border-slate-300 text-slate-900 font-semibold focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Address Type
              </label>
              <div className="flex gap-2">
                {(['HOME', 'WORK', 'OTHER'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                      form.type === t
                        ? 'border-navy bg-navy text-white shadow-xs'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-navy hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Flat, House No., Building, Street *
              </label>
              <Input
                placeholder="Address Line 1"
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                required
                className="rounded-xl bg-white border-slate-300 text-slate-900 font-semibold focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Area, Colony, Landmark (Optional)
              </label>
              <Input
                placeholder="Address Line 2"
                value={form.addressLine2 || ''}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                className="rounded-xl bg-white border-slate-300 text-slate-900 font-semibold focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                City / District *
              </label>
              <Input
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
                className="rounded-xl bg-white border-slate-300 text-slate-900 font-semibold focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                State *
              </label>
              <Input
                placeholder="State"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
                className="rounded-xl bg-white border-slate-300 text-slate-900 font-semibold focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-2 select-none">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-navy focus:ring-navy cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700">
              Set as default delivery address
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              className="rounded-full text-xs font-semibold"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-navy text-white hover:bg-navy-600 font-extrabold text-xs px-6 py-2.5 shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : initialData ? (
                'Update Address'
              ) : (
                'Save Address'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

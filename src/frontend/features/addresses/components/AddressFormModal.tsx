'use client';

import { CheckCircle2, Loader2, MapPin } from 'lucide-react';
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

interface LocalityOption {
  name: string;
  district: string;
  state: string;
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
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeResolvedText, setPincodeResolvedText] = useState<string | null>(null);
  const [localities, setLocalities] = useState<LocalityOption[]>([]);
  const [selectedLocality, setSelectedLocality] = useState<string>('');

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
      if (initialData.city && initialData.state) {
        setPincodeResolvedText(`${initialData.city}, ${initialData.state}`);
      }
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
      setPincodeResolvedText(null);
    }
    setErrorMsg(null);
    setPincodeError(null);
    setIsFetchingPincode(false);
    setLocalities([]);
    setSelectedLocality('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const fetchLocationForPincode = async (code: string) => {
    setIsFetchingPincode(true);
    setPincodeError(null);
    setPincodeResolvedText(null);
    setLocalities([]);
    setSelectedLocality('');

    try {
      const res = await fetch(`/api/v1/pincode/${code}`);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        const { state, district, city, localities: locList } = json.data;

        setForm((prev) => ({
          ...prev,
          state: state || prev.state,
          city: city || district || prev.city,
        }));

        setPincodeResolvedText(`${city || district}, ${state}`);
        setPincodeError(null);

        if (Array.isArray(locList) && locList.length > 0) {
          setLocalities(locList);
          setSelectedLocality(locList[0].name);
        }
      } else {
        // Clear auto-filled location if pincode is invalid
        setForm((prev) => ({
          ...prev,
          city: '',
          state: '',
        }));
        setPincodeError(json.message || 'Please enter a valid Indian PIN code.');
        setPincodeResolvedText(null);
      }
    } catch (err) {
      console.error('Failed to fetch pincode location:', err);
      setPincodeError(
        'Unable to fetch location. Please try again or enter your location manually.',
      );
      setPincodeResolvedText(null);
    } finally {
      setIsFetchingPincode(false);
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only accept numeric digits, max 6
    const cleanValue = e.target.value.replace(/\D/g, '').slice(0, 6);

    setForm((prev) => ({
      ...prev,
      pincode: cleanValue,
    }));

    if (cleanValue.length < 6) {
      setIsFetchingPincode(false);
      setPincodeError(null);
      setPincodeResolvedText(null);
      setLocalities([]);
      setSelectedLocality('');
      return;
    }

    if (cleanValue.length === 6) {
      fetchLocationForPincode(cleanValue);
    }
  };

  const handleLocalitySelect = (locName: string) => {
    setSelectedLocality(locName);
    const chosen = localities.find((l) => l.name === locName);
    if (chosen) {
      setForm((prev) => ({
        ...prev,
        city: chosen.district || chosen.name || prev.city,
        addressLine2: prev.addressLine2 ? prev.addressLine2 : chosen.name,
      }));
    }
  };

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
    if (!/^[1-9]\d{5}$/.test(form.pincode.trim())) {
      setErrorMsg('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    if (pincodeError && form.pincode.length === 6 && !form.city.trim()) {
      setErrorMsg('Please enter a valid Indian PIN code or fill your location manually.');
      return;
    }
    if (!form.addressLine1.trim() || form.addressLine1.length < 3) {
      setErrorMsg('Flat, House No., Building, Street is required.');
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
            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-navy hover:bg-slate-100 transition cursor-pointer"
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
                onChange={(e) =>
                  setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })
                }
                required
                maxLength={10}
                className="rounded-xl bg-white border-slate-300 text-slate-900 font-semibold focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Pincode *
              </label>
              <div className="relative">
                <Input
                  placeholder="6-digit Pincode"
                  value={form.pincode}
                  onChange={handlePincodeChange}
                  required
                  maxLength={6}
                  className={`rounded-xl bg-white text-slate-900 font-semibold focus:border-navy focus:ring-2 focus:ring-navy/20 ${
                    pincodeError
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                      : pincodeResolvedText
                        ? 'border-emerald-500'
                        : 'border-slate-300'
                  }`}
                />
                {isFetchingPincode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin text-orange" />
                  </div>
                )}
              </div>

              {/* Status & Validation Indicators for Pincode */}
              {isFetchingPincode && (
                <p className="text-[11px] font-semibold text-navy mt-1 inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin text-orange shrink-0" />
                  Fetching location...
                </p>
              )}

              {!isFetchingPincode && pincodeResolvedText && (
                <p className="text-[11px] font-extrabold text-emerald-600 mt-1 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  Auto-filled: {pincodeResolvedText}
                </p>
              )}

              {!isFetchingPincode && pincodeError && (
                <p className="text-[11px] font-bold text-red-500 mt-1">{pincodeError}</p>
              )}
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
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
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

            {/* Multiple Post Offices / Localities Selector */}
            {localities.length > 1 && (
              <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5 animate-fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-orange shrink-0" />
                  Select Area / Post Office ({localities.length} available for {form.pincode})
                </label>
                <select
                  value={selectedLocality}
                  onChange={(e) => handleLocalitySelect(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 p-2.5 focus:border-navy focus:ring-2 focus:ring-navy/20 cursor-pointer outline-none"
                >
                  {localities.map((loc, idx) => (
                    <option key={`${loc.name}-${idx}`} value={loc.name}>
                      📍 {loc.name} ({loc.district})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Flat, House No., Building, Street *
              </label>
              <Input
                placeholder="Address Line 1 (Required)"
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
                placeholder="Address Line 2 (Optional)"
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
                placeholder="City / District"
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
              className="rounded-full text-xs font-semibold cursor-pointer"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <button
              type="submit"
              disabled={isLoading || isFetchingPincode}
              className="rounded-full bg-navy text-white hover:bg-navy-600 font-extrabold text-xs px-6 py-2.5 shadow-md transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
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

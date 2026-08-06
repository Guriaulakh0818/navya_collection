'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { AddressData } from '@/features/addresses/components/AddressCard';
import { AddressList } from '@/features/addresses/components/AddressList';
import { useCheckout } from '@/features/checkout/context/checkout-context';

export function AddressStep() {
  const { address, setAddress, nextStep, prevStep } = useCheckout();
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
    address
      ? {
          id: address.id,
          fullName: address.name,
          mobile: address.mobile,
          pincode: address.pincode,
          addressLine1: address.line1,
          addressLine2: address.line2,
          city: address.city,
          state: address.state,
          type: address.label || 'HOME',
          isDefault: address.isDefault,
        }
      : null,
  );

  const handleSelect = (addr: AddressData) => {
    setSelectedAddress(addr);
    setAddress({
      id: addr.id,
      label: addr.type || 'HOME',
      name: addr.fullName,
      mobile: addr.mobile,
      line1: addr.addressLine1,
      line2: addr.addressLine2 || undefined,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm space-y-6">
      <AddressList
        selectable
        selectedAddressId={selectedAddress?.id}
        onSelectAddress={handleSelect}
      />

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <Button variant="outline" className="rounded-full font-semibold text-xs" onClick={prevStep}>
          Back to Cart
        </Button>
        <button
          className="rounded-full bg-orange text-white hover:bg-orange-600 font-extrabold text-xs px-7 py-3 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={nextStep}
          disabled={!selectedAddress}
        >
          Continue to Shipping →
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { AddressCard, AddressData } from './AddressCard';
import { AddressFormModal, AddressFormValues } from './AddressFormModal';
import { DeleteAddressDialog } from './DeleteAddressDialog';

interface AddressListProps {
  selectable?: boolean;
  selectedAddressId?: string;
  onSelectAddress?: (address: AddressData) => void;
  onAddressListChange?: (addresses: AddressData[]) => void;
  className?: string;
}

let globalAddressCache: AddressData[] | null = null;

export const AddressList: React.FC<AddressListProps> = ({
  selectable = false,
  selectedAddressId,
  onSelectAddress,
  onAddressListChange,
  className = '',
}) => {
  const [addresses, setAddresses] = useState<AddressData[]>(globalAddressCache || []);
  const [isLoading, setIsLoading] = useState<boolean>(!globalAddressCache);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<AddressData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAddresses = useCallback(
    async (silent = false) => {
      if (!silent && !globalAddressCache) {
        setIsLoading(true);
      }
      setErrorMsg(null);
      try {
        const res = await fetch('/api/v1/addresses', { method: 'GET' });
        const json = await res.json();
        if (json.success && json.data) {
          globalAddressCache = json.data;
          setAddresses(json.data);
          if (onAddressListChange) onAddressListChange(json.data);

          // Auto-select default address if in selectable mode and none selected yet
          if (selectable && !selectedAddressId && json.data.length > 0) {
            const defaultAddr = json.data.find((a: AddressData) => a.isDefault) || json.data[0];
            if (onSelectAddress && defaultAddr) onSelectAddress(defaultAddr);
          }
        } else if (!globalAddressCache) {
          setErrorMsg(json.message || 'Failed to load addresses.');
        }
      } catch {
        if (!globalAddressCache) {
          setErrorMsg('Network error loading addresses.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [selectable, selectedAddressId, onSelectAddress, onAddressListChange],
  );

  useEffect(() => {
    fetchAddresses(!!globalAddressCache);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateOrUpdate = async (values: AddressFormValues) => {
    setIsSubmitting(true);
    try {
      const isEdit = Boolean(values.id);
      const url = isEdit ? `/api/v1/addresses/${values.id}` : '/api/v1/addresses';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Operation failed');
      }

      const savedAddress: AddressData = json.data || {
        id: values.id || `addr_${Date.now()}`,
        fullName: values.fullName,
        mobile: values.mobile,
        pincode: values.pincode,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2,
        city: values.city,
        state: values.state,
        type: values.type,
        isDefault: values.isDefault,
      };

      // Update state and global cache INSTANTLY
      setAddresses((prev) => {
        const filtered = prev.filter((a) => a.id !== savedAddress.id);
        const updated = savedAddress.isDefault
          ? [savedAddress, ...filtered.map((a) => ({ ...a, isDefault: false }))]
          : [savedAddress, ...filtered];
        globalAddressCache = updated;
        if (onAddressListChange) onAddressListChange(updated);
        return updated;
      });

      if (onSelectAddress && selectable) {
        onSelectAddress(savedAddress);
      }

      await fetchAddresses(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAddress) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/addresses/${deletingAddress.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to delete address');
      }
      setDeletingAddress(null);
      await fetchAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete address.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const res = await fetch(`/api/v1/addresses/${addressId}/default`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        await fetchAddresses();
      } else {
        alert(json.message || 'Failed to set default address.');
      }
    } catch {
      alert('Network error setting default address.');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-heading text-xl font-bold text-navy">
            {selectable ? 'Select Delivery Address' : 'Saved Addresses'}
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            <span className="font-bold text-navy">{addresses.length}</span> of 10 maximum addresses
            saved
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingAddress(null);
            setIsModalOpen(true);
          }}
          disabled={addresses.length >= 10}
          className="inline-flex items-center gap-1.5 rounded-full bg-navy text-white hover:bg-navy/90 active:scale-[0.98] font-bold text-xs px-4 py-2.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-base font-normal leading-none">+</span> Add New Address
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl border border-slate-200 bg-slate-50/70 animate-pulse p-5 space-y-3"
            >
              <div className="h-4 w-1/3 bg-slate-200/80 rounded" />
              <div className="h-3 w-1/2 bg-slate-200/80 rounded" />
              <div className="h-3 w-3/4 bg-slate-200/80 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && errorMsg && (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center justify-between shadow-xs">
          <span className="font-medium">{errorMsg}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAddresses()}
            className="rounded-full text-xs font-semibold"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !errorMsg && addresses.length === 0 && (
        <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy shadow-sm mb-3">
            📍
          </div>
          <p className="text-base font-bold text-navy">No saved addresses found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed font-medium">
            Add a delivery address to ensure fast, smooth shipping for your orders.
          </p>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-navy text-white hover:bg-navy/90 font-bold text-xs px-5 py-2.5 shadow-md transition-all cursor-pointer"
            onClick={() => {
              setEditingAddress(null);
              setIsModalOpen(true);
            }}
          >
            + Add Address Now
          </button>
        </div>
      )}

      {/* Address Cards List */}
      {!isLoading && !errorMsg && addresses.length > 0 && (
        <div className="space-y-3.5">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              selectable={selectable}
              isSelected={selectedAddressId === addr.id}
              onSelect={() => onSelectAddress && onSelectAddress(addr)}
              onEdit={() => {
                setEditingAddress(addr);
                setIsModalOpen(true);
              }}
              onDelete={() => setDeletingAddress(addr)}
              onSetDefault={() => handleSetDefault(addr.id)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddressFormModal
        isOpen={isModalOpen}
        initialData={editingAddress}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAddress(null);
        }}
        onSubmit={handleCreateOrUpdate}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteAddressDialog
        isOpen={Boolean(deletingAddress)}
        address={deletingAddress}
        onClose={() => setDeletingAddress(null)}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
};

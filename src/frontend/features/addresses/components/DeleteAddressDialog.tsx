'use client';

import React from 'react';

import { Button } from '@/components/ui/button';

import { AddressData } from './AddressCard';

interface DeleteAddressDialogProps {
  isOpen: boolean;
  address: AddressData | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export const DeleteAddressDialog: React.FC<DeleteAddressDialogProps> = ({
  isOpen,
  address,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen || !address) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl space-y-4">
        <h3 className="font-heading text-xl font-bold text-navy">Delete Delivery Address?</h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to remove the address for{' '}
          <strong className="text-navy">{address.fullName}</strong> ({address.city},{' '}
          {address.pincode})? This action cannot be undone.
        </p>

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
            type="button"
            className="rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 shadow-sm transition cursor-pointer disabled:opacity-50"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

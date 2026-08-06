'use client';

import React from 'react';

import { Button } from '@/components/ui/button';

export interface AddressData {
  id: string;
  userId?: string;
  fullName: string;
  mobile: string;
  pincode: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  type: 'HOME' | 'WORK' | 'OTHER' | string;
  isDefault: boolean;
}

interface AddressCardProps {
  address: AddressData;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  selectable?: boolean;
  className?: string;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  selectable = false,
  className = '',
}) => {
  return (
    <div
      onClick={selectable && onSelect ? onSelect : undefined}
      className={`group relative rounded-2xl border p-5 transition-all duration-200 bg-white ${
        selectable ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-navy ring-2 ring-navy/15 bg-slate-50/70 shadow-sm'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          {selectable && (
            <input
              type="radio"
              name="selected_address"
              checked={isSelected}
              onChange={() => onSelect && onSelect()}
              className="mt-1 h-4 w-4 accent-navy cursor-pointer"
            />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-navy text-base">{address.fullName}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {address.type}
              </span>
              {address.isDefault && (
                <span className="text-[10px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  DEFAULT
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-700 mt-1.5 flex items-center gap-1">
              <span>📞</span> +91 {address.mobile}
            </p>

            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ''}
              <br />
              {address.city}, {address.state} —{' '}
              <span className="font-bold text-navy">{address.pincode}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-end">
          {!address.isDefault && onSetDefault && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault();
              }}
              className="text-xs font-semibold text-slate-500 hover:text-navy px-2.5 py-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              Set Default
            </button>
          )}

          {onEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full text-xs h-7 px-3 font-semibold border-slate-200 text-navy hover:bg-slate-50"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              Edit
            </Button>
          )}

          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-xs h-7 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

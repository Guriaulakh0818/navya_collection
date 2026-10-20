'use client';

import { Check, MoreVertical, Pencil, Phone, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      onClick={selectable && onSelect ? onSelect : undefined}
      className={`group relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 bg-white ${
        selectable ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-navy ring-2 ring-navy/15 bg-slate-50/70 shadow-sm'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
          {selectable && (
            <input
              type="radio"
              name="selected_address"
              checked={isSelected}
              onChange={() => onSelect && onSelect()}
              className="mt-1 h-4 w-4 accent-navy cursor-pointer shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-navy text-sm sm:text-base">{address.fullName}</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {address.type}
              </span>
              {address.isDefault && (
                <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  DEFAULT
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-700 mt-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-pink-600 fill-pink-600/10 shrink-0" />
              <span>+91 {address.mobile}</span>
            </p>

            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ''}
              <br />
              {address.city}, {address.state} —{' '}
              <span className="font-bold text-navy">{address.pincode}</span>
            </p>
          </div>
        </div>

        {/* 3-Dots Action Menu */}
        {(onEdit || onDelete || (!address.isDefault && onSetDefault)) && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              aria-label="Address options"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-navy hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 sm:w-40 bg-white rounded-xl shadow-lg border border-slate-200/80 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                {onEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onEdit();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-navy transition-colors text-left cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit</span>
                  </button>
                )}

                {!address.isDefault && onSetDefault && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onSetDefault();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-navy transition-colors text-left cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-slate-400" />
                    <span>Set Default</span>
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left border-t border-slate-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

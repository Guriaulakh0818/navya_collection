'use client';

import { Address } from '@/features/shared/lib/types';
import { Card } from '@/components/ui/card';

type AddressCardProps = {
  address: Address;
  onEdit?: (address: Address) => void;
  onDelete?: (id: string) => void;
};

export function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-navy">{address.name}</h4>
          <p className="mt-1 text-sm text-slate-600">{address.line1}</p>
          {address.line2 && <p className="text-sm text-slate-600">{address.line2}</p>}
          <p className="text-sm text-slate-600">
            {address.city}, {address.state} - {address.pincode}
          </p>
          <p className="text-sm text-slate-600">Mobile: {address.mobile}</p>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button onClick={() => onEdit(address)} className="text-xs font-medium text-navy hover:underline">
              Edit
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(address.id)} className="text-xs font-medium text-error hover:underline">
              Delete
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

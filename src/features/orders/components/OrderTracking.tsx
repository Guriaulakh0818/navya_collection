'use client';

import { CheckCircle2, Clock, Package, Truck, XCircle } from 'lucide-react';

import type { TrackingEvent } from '@/features/orders/types/orders.types';

type OrderTrackingProps = {
  events: TrackingEvent[];
};

const STATUS_ICONS: Record<string, typeof Package> = {
  completed: CheckCircle2,
  active: Clock,
  pending: Package,
};

export function OrderTracking({ events }: OrderTrackingProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200" />

      <div className="space-y-6">
        {events.map((event, index) => {
          const Icon = STATUS_ICONS[event.status] || Package;
          const isLast = index === events.length - 1;

          return (
            <div key={event.id} className="relative flex gap-4">
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  event.status === 'completed'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                    : event.status === 'active'
                      ? 'border-navy bg-navy/5 text-navy'
                      : 'border-slate-200 bg-white text-slate-400'
                } ${!isLast ? 'mb-6' : ''}`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-navy">{event.title}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{event.description}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(event.timestamp).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

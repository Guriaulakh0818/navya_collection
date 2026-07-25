'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ORDERS } from '@/features/orders/constants/orders.constants';
import type { Order, OrderStatus } from '@/features/orders/types/orders.types';

const STATUS_STYLE: Record<OrderStatus, string> = {
  Processing: 'rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700',
  Shipped: 'rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700',
  'Out for Delivery': 'rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700',
  Delivered: 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700',
  Cancelled: 'rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700',
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  Processing: 'Shipped',
  Shipped: 'Out for Delivery',
  'Out for Delivery': 'Delivered',
  Delivered: null,
  Cancelled: null,
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [search, setSearch] = useState('');

  const filtered = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.address.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleStatusChange = (id: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== id) return order;
        const next = NEXT_STATUS[order.status];
        return next ? { ...order, status: next } : order;
      }),
    );
  };

  const handleCancel = (id: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: 'Cancelled' as OrderStatus } : order,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-navy">Orders</h1>
        <p className="text-sm text-slate-600 mt-1">Manage and track customer orders</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 font-semibold text-navy">Order</th>
                <th className="pb-3 font-semibold text-navy">Customer</th>
                <th className="pb-3 font-semibold text-navy">Date</th>
                <th className="pb-3 font-semibold text-navy">Total</th>
                <th className="pb-3 font-semibold text-navy">Status</th>
                <th className="pb-3 font-semibold text-navy text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="py-4">
                    <div>
                      <p className="font-semibold text-navy">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500">{order.items.length} item(s)</p>
                    </div>
                  </td>
                  <td className="py-4">
                    <div>
                      <p className="font-medium text-navy">{order.address.name}</p>
                      <p className="text-xs text-slate-500">{order.address.mobile}</p>
                    </div>
                  </td>
                  <td className="py-4 text-slate-600">
                    {new Date(order.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-4 font-semibold text-navy">
                    ₹{order.total.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4">
                    <span className={STATUS_STYLE[order.status]}>{order.status}</span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {NEXT_STATUS[order.status] && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => handleStatusChange(order.id)}
                        >
                          Mark {NEXT_STATUS[order.status]}
                        </Button>
                      )}
                      {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-error hover:text-error"
                          onClick={() => handleCancel(order.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

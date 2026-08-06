'use client';

import { CheckCircle2, Clock, FileText, Package, Search, Truck, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ORDERS } from '@/features/orders/constants/orders.constants';
import type { Order, OrderStatus } from '@/features/orders/types/orders.types';

const STATUS_STYLE: Record<OrderStatus, string> = {
  Processing:
    'rounded-full bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1 text-[11px] font-extrabold whitespace-nowrap',
  Shipped:
    'rounded-full bg-sky-50 text-sky-800 border border-sky-300 px-3 py-1 text-[11px] font-extrabold whitespace-nowrap',
  'Out for Delivery':
    'rounded-full bg-indigo-50 text-indigo-800 border border-indigo-300 px-3 py-1 text-[11px] font-extrabold whitespace-nowrap',
  Delivered:
    'rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 text-[11px] font-extrabold whitespace-nowrap',
  Cancelled:
    'rounded-full bg-rose-50 text-rose-800 border border-rose-300 px-3 py-1 text-[11px] font-extrabold whitespace-nowrap',
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
      {/* Header Banner - Navy & Gold Luxury Theme */}
      <div className="bg-navy text-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block mb-1">
            Customer Fulfillment Desk
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-amber-400" /> Marketplace Orders Ledger
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Manage customer orders, track dispatch status, print shipping invoices, and process
            fulfillments.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shrink-0 text-right">
          <span className="text-[10px] uppercase font-bold text-amber-300 block">
            Total Ledger Orders
          </span>
          <span className="text-xl font-extrabold text-white font-mono">
            {orders.length} Orders
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by order ID or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl text-xs bg-slate-50 border-slate-200 focus:bg-white focus:border-amber-500 font-semibold"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            Showing <strong className="text-navy">{filtered.length}</strong> of {orders.length}
          </span>
        </div>

        {/* Formatted Table with Clear Row/Column Borders */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-navy font-extrabold uppercase border-b-2 border-slate-200 tracking-wider">
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Order ID
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Customer Info
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Order Date
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">Amount</th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-center">
                  Status
                </th>
                <th className="px-4 py-3.5 whitespace-nowrap text-right">Fulfillment Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-mono font-bold text-amber-700">
                    {order.orderNumber}
                    <span className="block text-[10px] text-slate-500 font-sans font-medium">
                      {order.items.length} item(s) ordered
                    </span>
                  </td>

                  <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-bold text-navy">
                    {order.address.name}
                    <span className="block text-[10px] text-slate-500 font-mono font-normal">
                      📱 +91 {order.address.mobile}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-slate-600 font-medium">
                    {new Date(order.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-extrabold text-slate-900 font-mono text-sm">
                    ₹{order.total.toLocaleString('en-IN')}
                  </td>

                  <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-center">
                    <span className={STATUS_STYLE[order.status]}>{order.status}</span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      {NEXT_STATUS[order.status] && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-xs font-bold border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 shadow-2xs"
                          onClick={() => handleStatusChange(order.id)}
                        >
                          Mark {NEXT_STATUS[order.status]}
                        </Button>
                      )}
                      {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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

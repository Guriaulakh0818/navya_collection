'use client';

import {
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/utils/format-price';

interface RealOrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemCount: number;
  shopNames: string[];
  totalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  finalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  address?: {
    fullName: string;
    mobile: string;
    fullAddress: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    shopName: string;
    imageUrl?: string;
  }[];
}

const STATUS_STYLE: Record<string, string> = {
  PENDING:
    'rounded-full bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1 text-[11px] font-extrabold whitespace-nowrap',
  CONFIRMED:
    'rounded-full bg-blue-50 text-blue-800 border border-blue-300 px-3 py-1 text-[11px] font-extrabold whitespace-nowrap',
  PROCESSING:
    'rounded-full bg-amber-50 text-amber-900 border border-amber-400 px-3 py-1 text-[11px] font-extrabold whitespace-nowrap',
  SHIPPED:
    'rounded-full bg-sky-50 text-sky-800 border border-sky-300 px-3 py-1 text-[11px] font-extrabold whitespace-nowrap',
  OUT_FOR_DELIVERY:
    'rounded-full bg-indigo-50 text-indigo-800 border border-indigo-300 px-3 py-1 text-[11px] font-extrabold whitespace-nowrap',
  DELIVERED:
    'rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 text-[11px] font-extrabold whitespace-nowrap',
  CANCELLED:
    'rounded-full bg-rose-50 text-rose-800 border border-rose-300 px-3 py-1 text-[11px] font-extrabold whitespace-nowrap',
};

const NEXT_STATUS: Record<string, string | null> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'SHIPPED',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
  OUT_FOR_DELIVERY: 'DELIVERED',
  DELIVERED: null,
  CANCELLED: null,
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<RealOrderData[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRealOrders = async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/v1/admin/orders', window.location.origin);
      if (search) url.searchParams.set('search', search);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data.orders || []);
        setStats(json.data.stats || { totalOrders: 0, totalRevenue: 0 });
      }
    } catch (err) {
      console.error('Failed to load real admin orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealOrders();
  }, [search, statusFilter]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/v1/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, orderStatus: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: nextStatus } : o)),
        );
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
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
            Real-time ledger fetching ALL customer orders placed across all boutique stores from
            database.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shrink-0 text-right">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">
              Total Revenue Collected
            </span>
            <span className="text-xl font-extrabold text-white font-mono">
              {formatPrice(stats.totalRevenue)}
            </span>
          </div>

          <button
            onClick={fetchRealOrders}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by order #, customer or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl text-xs bg-slate-50 border-slate-200 focus:bg-white focus:border-amber-500 font-semibold"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-navy focus:outline-none"
            >
              <option value="ALL">All Statuses ({orders.length})</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Formatted Table with Clear Row/Column Borders */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-navy font-extrabold uppercase border-b-2 border-slate-200 tracking-wider">
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Order Number
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Customer Info
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Store / Boutique
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">
                  Order Date
                </th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap">Amount</th>
                <th className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-center">
                  Status
                </th>
                <th className="px-4 py-3.5 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-medium">
                    Loading live orders ledger from database...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-medium">
                    No marketplace orders found matching your search.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-mono font-bold text-amber-700">
                      {order.orderNumber}
                      <span className="block text-[10px] text-slate-500 font-sans font-medium">
                        {order.itemCount} item(s)
                      </span>
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-bold text-navy">
                      {order.customerName}
                      <span className="block text-[10px] text-slate-500 font-mono font-normal">
                        📱 {order.customerPhone}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-bold text-slate-800">
                      {order.shopNames.join(', ') || 'Navya Boutique'}
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-slate-600 font-medium">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap font-extrabold text-slate-900 font-mono text-sm">
                      {formatPrice(order.finalAmount || order.totalAmount)}
                    </td>

                    <td className="px-4 py-3.5 border-r border-slate-200 whitespace-nowrap text-center">
                      <span className={STATUS_STYLE[order.orderStatus] || STATUS_STYLE.PENDING}>
                        {order.orderStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {NEXT_STATUS[order.orderStatus] && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updatingId === order.id}
                            className="rounded-xl text-xs font-bold border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 shadow-2xs cursor-pointer"
                            onClick={() =>
                              handleUpdateStatus(order.id, NEXT_STATUS[order.orderStatus]!)
                            }
                          >
                            Mark {NEXT_STATUS[order.orderStatus]}
                          </Button>
                        )}
                        {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={updatingId === order.id}
                            className="rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                            onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

'use client';

import {
  Building2,
  CheckCircle2,
  Clock,
  IndianRupee,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SellerDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/v1/seller/dashboard');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch seller metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-600 flex items-center justify-center gap-2.5">
        <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        <span className="font-semibold text-sm">Loading Merchant Analytics...</span>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalProducts: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalInventoryStock: 0,
  };

  const shop = data?.shop || {};
  const recentOrders = data?.recentOrders || [];
  const monthlyRevenue = data?.monthlyRevenue || [];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/10 border border-navy/20 text-navy text-xs font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5 text-navy" />
            Merchant Control Center
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-7 h-7 text-navy" />
            {shop.name || 'Merchant Dashboard'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time analytics overview, inventory stock levels, and order fulfillment status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/seller/products"
            className="px-4 py-2.5 bg-navy hover:bg-navy/90 text-white font-bold text-xs rounded-xl shadow-md shadow-navy/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Product
          </Link>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Products */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-navy/30 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Products
            </span>
            <div className="w-9 h-9 rounded-xl bg-navy/10 border border-navy/20 flex items-center justify-center text-navy">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {metrics.totalProducts}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active catalog items in boutique store</p>
        </div>

        {/* Card 2: Pending Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-navy/30 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
            {metrics.pendingOrders}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Orders awaiting dispatch & shipping</p>
        </div>

        {/* Card 3: Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-navy/30 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Net Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            ₹{Number(metrics.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Net settlements after commission</p>
        </div>

        {/* Card 4: Inventory Stock */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-navy/30 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Inventory Units
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {metrics.totalInventoryStock}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total variant stock items in warehouse</p>
        </div>
      </div>

      {/* Analytics Charts & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Analytics Chart Bar */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-navy" />
              Monthly Sales Performance (6-Month Trend)
            </h3>
            <span className="text-xs text-navy font-semibold bg-navy/10 px-2.5 py-1 rounded-full border border-navy/20">
              Live Metrics
            </span>
          </div>

          <div className="h-48 pt-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-2">
            {monthlyRevenue.map((item: any, idx: number) => {
              const maxRev = Math.max(...monthlyRevenue.map((m: any) => m.revenue), 1000);
              const heightPct = Math.max(15, Math.min(100, (item.revenue / maxRev) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-mono text-navy font-bold opacity-0 group-hover:opacity-100 transition-all">
                    ₹{item.revenue}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-gradient-to-t from-navy/30 via-navy/70 to-navy rounded-t-lg transition-all group-hover:brightness-110"
                  />
                  <span className="text-[10px] text-slate-500 font-semibold">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fulfillment Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-4 h-4 text-navy" />
            Order Fulfillment Status
          </h3>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Delivered Orders</span>
                <span className="text-emerald-600 font-bold">85%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full w-[85%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Pending Dispatch</span>
                <span className="text-amber-600 font-bold">12%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-full w-[12%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Returns & Exchanges</span>
                <span className="text-rose-600 font-bold">3%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-rose-500 h-full w-[3%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Vendor Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-navy" />
            Recent Vendor Orders
          </h3>
          <Link
            href="/seller/orders"
            className="text-xs text-navy hover:text-navy/80 font-bold underline underline-offset-4"
          >
            View All Orders →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No recent vendor orders recorded yet. When customers order your shop products, orders
            will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase tracking-wider text-[10px] text-slate-500">
                <tr>
                  <th className="py-3.5 px-6 font-bold">Order Ref</th>
                  <th className="py-3.5 px-6 font-bold">Customer</th>
                  <th className="py-3.5 px-6 font-bold">Items Count</th>
                  <th className="py-3.5 px-6 font-bold">Total Amount</th>
                  <th className="py-3.5 px-6 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-all">
                    <td className="py-3.5 px-6 font-mono text-navy font-semibold">
                      {order.vendorOrderNumber ||
                        order.masterOrder?.orderNumber ||
                        order.id.substring(0, 10)}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-900">
                      {order.masterOrder?.user?.name || 'Customer'}
                    </td>
                    <td className="py-3.5 px-6">{order.items?.length || 1} Item(s)</td>
                    <td className="py-3.5 px-6 font-semibold text-emerald-600 font-mono">
                      ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/30">
                        {order.status || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
